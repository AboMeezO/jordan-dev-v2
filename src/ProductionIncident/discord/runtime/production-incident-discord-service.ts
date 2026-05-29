import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  Message,
  TextBasedChannel,
} from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

import {
  EngineKernel,
  type GameEvent,
  InMemoryEventBus,
  NodeClock,
  NodeScheduler,
  type Player,
  RuntimeIdGenerator,
  SeededRandomSource,
  type SessionId,
} from "../../engine/index.js";
import { DiscordCustomIdCodec } from "../interactions/discord-custom-id-codec.js";
import { DiscordSessionRegistry } from "../registry/discord-session-registry.js";
import { DiscordIncidentRenderer } from "../renderers/discord-incident-renderer.js";
import type {
  DiscordButtonPayload,
  DiscordEmbedPayload,
  DiscordMessagePayload,
} from "../renderers/discord-message-payload.js";

const MAX_PLAYERS = 8;
const MIN_PLAYERS = 1;

export const productionIncidentCommandData = new SlashCommandBuilder()
  .setName("dev")
  .setDescription("Developer tools")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("incident")
      .setDescription("Start The Production Incident lobby."),
  )
  .toJSON();

export class ProductionIncidentDiscordService {
  private static instance: ProductionIncidentDiscordService | undefined;

  public static getInstance(): ProductionIncidentDiscordService {
    if (this.instance === undefined) {
      this.instance = new ProductionIncidentDiscordService();
    }

    return this.instance;
  }

  private readonly codec = new DiscordCustomIdCodec();
  private readonly eventBus = new InMemoryEventBus();
  private readonly idGenerator = new RuntimeIdGenerator();
  private readonly kernel = EngineKernel.createLifecycleKernel({
    clock: new NodeClock(),
    eventBus: this.eventBus,
    idGenerator: this.idGenerator,
    randomSource: new SeededRandomSource("production-incident-discord"),
    scheduler: new NodeScheduler(),
  });
  private readonly registry = new DiscordSessionRegistry();
  private readonly renderer = new DiscordIncidentRenderer();

  private client: Client | undefined;

  private constructor() {
    this.eventBus.subscribeAll((event) => {
      if (this.client === undefined) {
        return undefined;
      }

      return this.renderEvent(this.client, event);
    });
  }

  public attachClient(client: Client): void {
    this.client = client;
  }

  public async handleStartCommand(
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    if (!interaction.inGuild() || interaction.guildId === null) {
      await interaction.reply({
        content: "This game can only be started inside a server channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const existing = this.registry.getByChannel(interaction.channelId);

    if (existing !== undefined) {
      await interaction.reply({
        content: "A Production Incident session is already bound to this channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const created = await this.kernel.sessionManager.createSession({});

    if (!created.ok) {
      await interaction.reply({
        content: created.error.message,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const session = created.result.value;
    const payload = this.renderLobby(session.id);
    await interaction.reply(this.toDiscordMessageOptions(payload));
    const reply = await interaction.fetchReply();

    this.registry.bindSession({
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      hostUserId: interaction.user.id,
      lobbyMessageId: reply.id,
      outputChannelId: interaction.channelId,
      sessionId: session.id,
    });
  }

  public async handleButtonInteraction(
    interaction: ButtonInteraction,
  ): Promise<void> {
    try {
      if (interaction.customId.includes(":lobby:")) {
        await this.handleLobbyButton(interaction);
        return;
      }

      if (interaction.customId.includes(":vote:")) {
        await this.handleVoteButton(interaction);
        return;
      }
    } catch (error: unknown) {
      await this.replyEphemeral(
        interaction,
        error instanceof Error ? error.message : "The interaction failed.",
      );
    }
  }

  private async handleLobbyButton(interaction: ButtonInteraction): Promise<void> {
    const decoded = this.codec.decodeLobby(interaction.customId);
    const binding = this.registry.getBySession(decoded.sessionId);

    if (binding === undefined) {
      await this.replyEphemeral(interaction, "This lobby is no longer active.");
      return;
    }

    switch (decoded.action) {
      case "join":
        await this.joinSession(interaction, decoded.sessionId);
        return;
      case "start":
        await this.startSession(interaction, binding);
        return;
      case "cancel":
        await this.cancelSession(interaction, binding);
        return;
    }
  }

  private async joinSession(
    interaction: ButtonInteraction,
    sessionId: SessionId,
  ): Promise<void> {
    const player: Player = {
      displayName: interaction.user.displayName,
      id: this.codec.playerIdFromDiscordUserId(interaction.user.id),
      joinedAt: this.kernel.clock.now(),
    };
    const result = await this.kernel.sessionManager.joinSession({
      player,
      sessionId,
    });

    if (!result.ok) {
      await this.replyEphemeral(interaction, result.error.message);
      return;
    }

    await this.updateLobby(sessionId);
    await this.replyEphemeral(interaction, "You joined the incident room.");
  }

  private async startSession(
    interaction: ButtonInteraction,
    binding: ReturnType<DiscordSessionRegistry["getBySession"]>,
  ): Promise<void> {
    if (binding === undefined) {
      await this.replyEphemeral(interaction, "This lobby is no longer active.");
      return;
    }

    if (interaction.user.id !== binding.hostUserId) {
      await this.replyEphemeral(interaction, "Only the host can start this incident.");
      return;
    }

    const result = await this.kernel.sessionManager.startSession({
      firstTickDelayMs: 2_000,
      minimumPlayers: MIN_PLAYERS,
      sessionId: binding.sessionId,
    });

    if (!result.ok) {
      await this.replyEphemeral(interaction, result.error.message);
      return;
    }

    const outputChannel = await this.resolveOutputChannel(interaction, binding);
    this.registry.updateSession(
      binding.sessionId,
      outputChannel.id === binding.channelId
        ? { outputChannelId: outputChannel.id }
        : { outputChannelId: outputChannel.id, threadId: outputChannel.id },
    );

    await this.updateLobby(binding.sessionId, true);
    await this.sendPayload(outputChannel, {
      content: "Incident session started.",
      embeds: [
        {
          fields: [
            { inline: true, name: "Players", value: String(result.result.value.state.players.size) },
            { inline: true, name: "Status", value: result.result.value.state.status },
          ],
          title: "Production Incident Started",
        },
      ],
    });
    await this.replyEphemeral(interaction, "Session started.");
    await this.kernel.gameplayManager.generateIncident({ sessionId: binding.sessionId });
  }

  private async cancelSession(
    interaction: ButtonInteraction,
    binding: ReturnType<DiscordSessionRegistry["getBySession"]>,
  ): Promise<void> {
    if (binding === undefined) {
      await this.replyEphemeral(interaction, "This lobby is no longer active.");
      return;
    }

    if (interaction.user.id !== binding.hostUserId) {
      await this.replyEphemeral(interaction, "Only the host can cancel this incident.");
      return;
    }

    const result = await this.kernel.sessionManager.cancelSession(binding.sessionId);

    if (!result.ok) {
      await this.replyEphemeral(interaction, result.error.message);
      return;
    }

    await this.updateLobby(binding.sessionId, true);
    this.registry.cleanup(binding.sessionId);
    await this.replyEphemeral(interaction, "Incident lobby cancelled.");
  }

  private async handleVoteButton(interaction: ButtonInteraction): Promise<void> {
    const decoded = this.codec.decodeVote(interaction.customId);
    const result = await this.kernel.gameplayManager.submitVote({
      actionId: decoded.actionId,
      incidentId: decoded.incidentId,
      playerId: this.codec.playerIdFromDiscordUserId(interaction.user.id),
      sessionId: decoded.sessionId,
    });

    await this.replyEphemeral(
      interaction,
      result.ok ? "Vote registered." : result.error.message,
    );
  }

  private async renderEvent(client: Client, event: GameEvent): Promise<void> {
    const binding = this.registry.getBySession(event.sessionId);

    if (binding === undefined) {
      return;
    }

    const outputChannel = await this.fetchTextChannel(client, binding.outputChannelId);

    if (outputChannel === undefined) {
      return;
    }

    switch (event.type) {
      case "player.joined":
        await this.updateLobby(event.sessionId);
        return;
      case "incident.generated": {
        const session = this.kernel.stateManager.getSnapshot(event.sessionId);
        const incident =
          session?.state.status === "running" ||
          session?.state.status === "paused" ||
          session?.state.status === "recovering"
            ? session.state.activeIncidents.get(event.incidentId)
            : undefined;

        if (incident === undefined) {
          return;
        }

        const message = await this.sendPayload(
          outputChannel,
          this.renderer.renderIncidentPrompt(event.sessionId, incident),
        );
        this.registry.setIncidentMessageId(event.sessionId, event.incidentId, message.id);
        return;
      }
      case "incident.resolved": {
        const session = this.kernel.stateManager.getSnapshot(event.sessionId);
        const incident =
          session?.state.status === "running" ||
          session?.state.status === "paused" ||
          session?.state.status === "recovering"
            ? session.state.incidentHistory.get(event.incidentId)
            : undefined;

        if (incident !== undefined) {
          await this.sendPayload(
            outputChannel,
            this.renderer.renderIncidentOutcome(incident, event.succeeded),
          );
        }

        return;
      }
      case "statistics.updated":
        await this.sendPayload(outputChannel, this.renderStatus(event.after));
        return;
      case "commentary.cued":
        await this.sendPayload(outputChannel, this.renderer.renderCommentary(event.message));
        return;
      case "session.ended":
        await this.sendPayload(outputChannel, this.renderFinalReport(event.sessionId));
        this.registry.cleanup(event.sessionId);
        return;
      default:
        return;
    }
  }

  private async resolveOutputChannel(
    interaction: ButtonInteraction,
    binding: NonNullable<ReturnType<DiscordSessionRegistry["getBySession"]>>,
  ): Promise<SendableTextChannel> {
    const channel = interaction.channel;

    if (channel !== null) {
      try {
        const thread = await interaction.message.startThread({
          name: `Production Incident ${this.shortSessionId(binding.sessionId)}`,
          reason: "Production Incident game session",
        });
        return thread;
      } catch {
        if (isSendableChannel(channel)) {
          return channel;
        }
      }
    }

    if (channel === null) {
      const fetched = await interaction.client.channels.fetch(binding.channelId);

      if (fetched?.isTextBased() && isSendableChannel(fetched)) {
        return fetched;
      }

      throw new Error("Unable to resolve a text channel for the incident.");
    }

    if (isSendableChannel(channel)) {
      return channel;
    }

    throw new Error("Unable to resolve a sendable text channel for the incident.");
  }

  private async updateLobby(sessionId: SessionId, disabled = false): Promise<void> {
    const binding = this.registry.getBySession(sessionId);

    if (binding?.lobbyMessageId === undefined || this.client === undefined) {
      return;
    }

    const channel = await this.fetchTextChannel(this.client, binding.channelId);

    if (channel === undefined || !isMessageFetchableChannel(channel)) {
      return;
    }

    const message = await channel.messages.fetch(binding.lobbyMessageId).catch(() => undefined);

    if (message === undefined) {
      return;
    }

    await message.edit(this.toDiscordMessageOptions(this.renderLobby(sessionId, disabled)));
  }

  private async fetchTextChannel(
    client: Client,
    channelId: string,
  ): Promise<SendableTextChannel | undefined> {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    return channel?.isTextBased() && isSendableChannel(channel) ? channel : undefined;
  }

  private renderLobby(sessionId: SessionId, disabled = false): DiscordMessagePayload {
    const session = this.kernel.stateManager.getSnapshot(sessionId);
    const playerCount =
      session?.state.status === "waiting" ? session.state.players.size : 0;
    const status = session?.state.status ?? "unknown";

    return {
      buttons: [
        {
          customId: this.codec.encodeLobby({ action: "join", sessionId }),
          disabled,
          label: "Join Incident",
          style: "primary",
        },
        {
          customId: this.codec.encodeLobby({ action: "start", sessionId }),
          disabled,
          label: "Start Incident",
          style: "success",
        },
        {
          customId: this.codec.encodeLobby({ action: "cancel", sessionId }),
          disabled,
          label: "Cancel",
          style: "danger",
        },
      ],
      content: "Production Incident Lobby",
      embeds: [
        {
          fields: [
            { inline: true, name: "Players", value: `${playerCount}/${MAX_PLAYERS}` },
            { inline: true, name: "Status", value: status },
            { name: "Session", value: this.shortSessionId(sessionId) },
          ],
          title: "Production Incident Lobby",
        },
      ],
    };
  }

  private renderStatus(stats: {
    readonly developerSanity: number;
    readonly infrastructureCost: number;
    readonly serverStability: number;
    readonly userHappiness: number;
  }): DiscordMessagePayload {
    return {
      content: "System status updated.",
      embeds: [
        {
          fields: [
            { inline: true, name: "Server Stability", value: String(stats.serverStability) },
            { inline: true, name: "Developer Sanity", value: String(stats.developerSanity) },
            { inline: true, name: "User Happiness", value: String(stats.userHappiness) },
            { inline: true, name: "Infrastructure Cost", value: String(stats.infrastructureCost) },
          ],
          title: "System Status",
        },
      ],
    };
  }

  private renderFinalReport(sessionId: SessionId): DiscordMessagePayload {
    const session = this.kernel.stateManager.getSnapshot(sessionId);
    const historyCount =
      session?.state.status === "running" ||
      session?.state.status === "paused" ||
      session?.state.status === "recovering"
        ? session.state.incidentHistory.size
        : 0;

    return {
      content: "Production incident session ended.",
      embeds: [
        {
          fields: [
            { inline: true, name: "Final Status", value: session?.state.status ?? "ended" },
            { inline: true, name: "Incident History", value: String(historyCount) },
            { inline: true, name: "Server Stability", value: String(session?.stats.serverStability ?? 0) },
            { inline: true, name: "Developer Sanity", value: String(session?.stats.developerSanity ?? 0) },
            { inline: true, name: "User Happiness", value: String(session?.stats.userHappiness ?? 0) },
            { inline: true, name: "Infrastructure Cost", value: String(session?.stats.infrastructureCost ?? 0) },
          ],
          title: "Final Report",
        },
      ],
    };
  }

  private async replyEphemeral(
    interaction: ButtonInteraction,
    content: string,
  ): Promise<void> {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.reply({ content, flags: MessageFlags.Ephemeral });
  }

  private sendPayload(
    channel: SendableTextChannel,
    payload: DiscordMessagePayload,
  ): Promise<Message> {
    return channel.send(this.toDiscordMessageOptions(payload));
  }

  private toDiscordMessageOptions(payload: DiscordMessagePayload): RenderedDiscordMessage {
    return {
      components:
        payload.buttons === undefined
          ? []
          : [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                payload.buttons.map((button) => this.toButton(button)),
              ),
            ],
      content: payload.content,
      embeds: payload.embeds?.map((embed) => this.toEmbed(embed)) ?? [],
    };
  }

  private toButton(button: DiscordButtonPayload): ButtonBuilder {
    const styleByName = {
      danger: ButtonStyle.Danger,
      primary: ButtonStyle.Primary,
      secondary: ButtonStyle.Secondary,
      success: ButtonStyle.Success,
    } as const;

    return new ButtonBuilder()
      .setCustomId(button.customId)
      .setDisabled(button.disabled ?? false)
      .setLabel(button.label)
      .setStyle(styleByName[button.style]);
  }

  private toEmbed(payload: DiscordEmbedPayload): EmbedBuilder {
    const embed = new EmbedBuilder().setTitle(payload.title);

    if (payload.color !== undefined) {
      embed.setColor(payload.color);
    }

    if (payload.description !== undefined) {
      embed.setDescription(payload.description);
    }

    if (payload.fields !== undefined) {
      embed.addFields([...payload.fields]);
    }

    return embed;
  }

  private shortSessionId(sessionId: SessionId): string {
    return sessionId.replace(/^session-/, "").slice(0, 8);
  }
}

type SendableTextChannel = TextBasedChannel & {
  readonly id: string;
  send(options: RenderedDiscordMessage): Promise<Message>;
};

type MessageFetchableTextChannel = SendableTextChannel & {
  readonly messages: {
    fetch(messageId: string): Promise<Message>;
  };
};

function isSendableChannel(channel: TextBasedChannel): channel is SendableTextChannel {
  return "send" in channel && typeof channel.send === "function";
}

function isMessageFetchableChannel(
  channel: TextBasedChannel,
): channel is MessageFetchableTextChannel {
  return (
    isSendableChannel(channel) &&
    "messages" in channel &&
    typeof channel.messages === "object" &&
    channel.messages !== null &&
    "fetch" in channel.messages &&
    typeof channel.messages.fetch === "function"
  );
}

interface RenderedDiscordMessage {
  readonly components: ActionRowBuilder<ButtonBuilder>[];
  readonly content: string;
  readonly embeds: EmbedBuilder[];
}
