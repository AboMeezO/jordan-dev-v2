import type {
	ButtonInteraction,
	ChatInputCommandInteraction,
	Client,
	ContainerBuilder,	Message,
	TextBasedChannel} from "discord.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	MessageFlags,
	SeparatorBuilder,
	SlashCommandBuilder,
} from "discord.js";

import { buildContainer } from "#ComponentsV2";
import { Logger } from "#Logger";

import {
	type Action,
	EngineKernel,
	type GameEvent,
	type GameSession,
	type Incident,
	type IncidentId,
	InMemoryEventBus,
	NodeClock,
	NodeScheduler,
	type Player,
	RuntimeIdGenerator,
	SeededRandomSource,
	type SessionId,
} from "../../engine/index.js";

const log = new Logger("ProductionIncidentDiscord");
import { DiscordCustomIdCodec } from "../interactions/discord-custom-id-codec.js";
import { DiscordSessionRegistry } from "../registry/discord-session-registry.js";
import { DiscordIncidentRenderer } from "../renderers/discord-incident-renderer.js";
import type {
	DiscordButtonPayload,
	DiscordButtonRowPayload,
	DiscordEmbedPayload,
	DiscordMessagePayload,
} from "../renderers/discord-message-payload.js";
import {
	type AvailableDiscordEmoji,
	ProductionIncidentEmojiRegistry,
} from "../renderers/production-incident-emojis.js";

const MAX_PLAYERS = 8;
const MAX_INCIDENTS = 10;
const MIN_PLAYERS = 1;
const COMMENTARY_FLUSH_DELAY_MS = 1_250;

export const productionIncidentCommandData =
	new SlashCommandBuilder()
		.setName("dev")
		.setDescription("Developer tools")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("incident")
				.setDescription(
					"Start The Production Incident lobby.",
				),
		)
		.toJSON();

export class ProductionIncidentDiscordService {
	private static instance:
		| ProductionIncidentDiscordService
		| undefined;

	public static getInstance(): ProductionIncidentDiscordService {
		if (this.instance === undefined) {
			this.instance =
				new ProductionIncidentDiscordService();
		}

		return this.instance;
	}

	private readonly codec = new DiscordCustomIdCodec();
	private readonly eventBus = new InMemoryEventBus();
	private readonly idGenerator = new RuntimeIdGenerator();
	private readonly emojis =
		new ProductionIncidentEmojiRegistry();
	private emojiSyncInFlight: Promise<void> | undefined;
	private readonly kernel =
		EngineKernel.createLifecycleKernel({
			clock: new NodeClock(),
			eventBus: this.eventBus,
			idGenerator: this.idGenerator,
			randomSource: new SeededRandomSource(
				"production-incident-discord",
			),
			scheduler: new NodeScheduler(),
		});
	private readonly registry = new DiscordSessionRegistry();
	private readonly renderer = new DiscordIncidentRenderer(
		this.emojis,
	);
	private readonly commentaryBuffers = new Map<
		SessionId,
		{
			readonly messages: Set<string>;
			readonly timer: NodeJS.Timeout;
		}
	>();

	private client: Client | undefined;

	private constructor() {
		this.eventBus.subscribeAll((event) => {
			if (this.client === undefined) {
				return undefined;
			}

			return this.renderEvent(this.client, event).catch(
				(error: unknown) => {
					this.debug("render event failed", {
						error:
							error instanceof Error
								? error.message
								: String(error),
						eventType: event.type,
						sessionId: event.sessionId,
					});
				},
			);
		});
	}

	public attachClient(client: Client): void {
		this.client = client;
		void this.syncApplicationEmojiRegistry(client);
	}

	public async handleStartCommand(
		interaction: ChatInputCommandInteraction,
	): Promise<void> {
		if (
			!interaction.inGuild() ||
			interaction.guildId === null
		) {
			await interaction.reply({
				content:
					"This game can only be started inside a server channel.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const existing = this.registry.getByChannel(
			interaction.channelId,
		);

		if (existing !== undefined) {
			await interaction.reply({
				content:
					"A Production Incident session is already bound to this channel.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const created =
			await this.kernel.sessionManager.createSession({});

		if (!created.ok) {
			await interaction.reply({
				content: created.error.message,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const session = created.result.value;
		const payload = this.renderLobby(session.id);
		this.debug("sending lobby", {
			componentRows: this.componentRowCount(payload),
			sessionId: session.id,
			status: session.state.status,
		});
		await interaction.reply(
			this.toDiscordMessageOptions(payload),
		);
		const reply = await interaction.fetchReply();
		this.debug("lobby sent", {
			messageId: reply.id,
			sessionId: session.id,
		});

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
		this.debug("button interaction received", {
			customId: interaction.customId,
			userId: interaction.user.id,
		});

		const acknowledged =
			await this.deferEphemeral(interaction);

		if (!acknowledged) {
			return;
		}

		try {
			if (interaction.customId.includes(":lobby:")) {
				await this.handleLobbyButton(interaction);
				return;
			}

			if (interaction.customId.includes(":a:")) {
				await this.handleVoteButton(interaction);
				return;
			}

			if (interaction.customId.includes(":i:")) {
				await this.handleInstantButton(interaction);
				return;
			}

			await this.replyEphemeral(
				interaction,
				"This Production Incident control is no longer available.",
			);
		} catch (error: unknown) {
			this.debug("button interaction failed", {
				customId: interaction.customId,
				error:
					error instanceof Error
						? error.message
						: String(error),
			});
			await this.replyEphemeral(
				interaction,
				error instanceof Error
					? error.message
					: "The interaction failed.",
			);
		}
	}

	private async handleLobbyButton(
		interaction: ButtonInteraction,
	): Promise<void> {
		const decoded = this.codec.decodeLobby(
			interaction.customId,
		);
		this.debug("lobby custom id decoded", {
			action: decoded.action,
			sessionId: decoded.sessionId,
		});
		const binding = this.registry.getBySession(
			decoded.sessionId,
		);

		if (binding === undefined) {
			await this.replyEphemeral(
				interaction,
				"This lobby is no longer active.",
			);
			return;
		}

		switch (decoded.action) {
			case "join":
				await this.joinSession(
					interaction,
					decoded.sessionId,
				);
				return;
			case "start":
				await this.startSession(interaction, binding);
				return;
			case "cancel":
				await this.cancelSession(interaction, binding);
				return;
			case "end":
				await this.endSession(interaction, binding);
				return;
		}
	}

	private async joinSession(
		interaction: ButtonInteraction,
		sessionId: SessionId,
	): Promise<void> {
		const player: Player = {
			displayName: interaction.user.displayName,
			id: this.codec.playerIdFromDiscordUserId(
				interaction.user.id,
			),
			joinedAt: this.kernel.clock.now(),
		};
		const result =
			await this.kernel.sessionManager.joinSession({
				player,
				sessionId,
			});

		if (!result.ok) {
			await this.replyEphemeral(
				interaction,
				result.error.message,
			);
			return;
		}

		await this.updateLobby(sessionId);
		await this.replyEphemeral(
			interaction,
			"You joined the incident room.",
		);
	}

	private async startSession(
		interaction: ButtonInteraction,
		binding: ReturnType<
			DiscordSessionRegistry["getBySession"]
		>,
	): Promise<void> {
		if (binding === undefined) {
			await this.replyEphemeral(
				interaction,
				"This lobby is no longer active.",
			);
			return;
		}

		if (interaction.user.id !== binding.hostUserId) {
			await this.replyEphemeral(
				interaction,
				"Only the host can start this incident.",
			);
			return;
		}

		const result =
			await this.kernel.sessionManager.startSession({
				firstTickDelayMs: 2_000,
				minimumPlayers: MIN_PLAYERS,
				sessionId: binding.sessionId,
			});

		if (!result.ok) {
			await this.replyEphemeral(
				interaction,
				result.error.message,
			);
			return;
		}

		const outputChannel = await this.resolveOutputChannel(
			interaction,
			binding,
		);
		this.registry.updateSession(
			binding.sessionId,
			outputChannel.id === binding.channelId
				? { outputChannelId: outputChannel.id }
				: {
						outputChannelId: outputChannel.id,
						threadId: outputChannel.id,
					},
		);

		await this.updateLobby(binding.sessionId, true);
		await this.sendPayload(outputChannel, {
			buttons: [
				{
					customId: this.codec.encodeLobby({
						action: "end",
						sessionId: binding.sessionId,
					}),
					label: "End Session",
					style: "danger",
				},
			],
			content: [
				`${this.emojis.emoji("incident")} **Production Incident Started**`,
				`**Players:** ${result.result.value.state.players.size}`,
				"",
				"**Goal**",
				`Survive \`${MAX_INCIDENTS} incidents\` without production collapsing.`,
				"صوتوا بسرعة قبل ما incident يقفل.",
				"",
				`${this.emojis.emoji("end")} Host control: **End Session**`,
			].join("\n"),
			accentColor: 0x02fe97,
			useComponentsV2: true,
		});
		await this.replyEphemeral(
			interaction,
			"Session started.",
		);
		await this.kernel.gameplayManager.generateIncident({
			sessionId: binding.sessionId,
		});
	}

	private async cancelSession(
		interaction: ButtonInteraction,
		binding: ReturnType<
			DiscordSessionRegistry["getBySession"]
		>,
	): Promise<void> {
		if (binding === undefined) {
			await this.replyEphemeral(
				interaction,
				"This lobby is no longer active.",
			);
			return;
		}

		if (interaction.user.id !== binding.hostUserId) {
			await this.replyEphemeral(
				interaction,
				"Only the host can cancel this incident.",
			);
			return;
		}

		const result =
			await this.kernel.sessionManager.cancelSession(
				binding.sessionId,
			);

		if (!result.ok) {
			await this.replyEphemeral(
				interaction,
				result.error.message,
			);
			return;
		}

		await this.updateLobby(binding.sessionId, true);
		this.registry.cleanup(binding.sessionId);
		await this.replyEphemeral(
			interaction,
			"Incident lobby cancelled.",
		);
	}

	private async endSession(
		interaction: ButtonInteraction,
		binding: ReturnType<
			DiscordSessionRegistry["getBySession"]
		>,
	): Promise<void> {
		if (binding === undefined) {
			await this.replyEphemeral(
				interaction,
				"This session is no longer active.",
			);
			return;
		}

		if (interaction.user.id !== binding.hostUserId) {
			await this.replyEphemeral(
				interaction,
				"Only the host can end this incident session.",
			);
			return;
		}

		const result =
			await this.kernel.sessionManager.endSession({
				reason: "shutdown",
				sessionId: binding.sessionId,
			});

		await this.replyEphemeral(
			interaction,
			result.ok
				? "Incident session ended."
				: result.error.message,
		);
	}

	private async handleVoteButton(
		interaction: ButtonInteraction,
	): Promise<void> {
		const decoded = this.codec.decodeAction(
			interaction.customId,
		);
		const route = this.registry.getActionRoute(
			decoded.key,
			this.kernel.clock.now(),
		);

		this.debug("action custom id decoded", {
			key: decoded.key,
			routeFound: route !== undefined,
		});

		if (route === undefined) {
			await this.replyEphemeral(
				interaction,
				"This incident action is no longer available.",
			);
			return;
		}

		const result =
			await this.kernel.gameplayManager.submitVote({
				actionId: route.actionId,
				incidentId: route.incidentId,
				playerId: this.codec.playerIdFromDiscordUserId(
					interaction.user.id,
				),
				sessionId: route.sessionId,
			});

		await this.replyEphemeral(
			interaction,
			result.ok ? "Vote registered." : result.error.message,
		);

		if (result.ok) {
			await this.updateIncidentMessage(
				route.sessionId,
				route.incidentId,
			);
		}
	}

	private async handleInstantButton(
		interaction: ButtonInteraction,
	): Promise<void> {
		const decoded = this.codec.decodeInstant(
			interaction.customId,
		);
		const route = this.registry.getActionRoute(
			decoded.key,
			this.kernel.clock.now(),
		);

		if (route === undefined) {
			await this.replyEphemeral(
				interaction,
				"This incident action is no longer available.",
			);
			return;
		}

		const result =
			await this.kernel.gameplayManager.useInstantAction({
				actionId: route.actionId,
				incidentId: route.incidentId,
				playerId: this.codec.playerIdFromDiscordUserId(
					interaction.user.id,
				),
				sessionId: route.sessionId,
			});
		const incident = this.findIncident(
			route.sessionId,
			route.incidentId,
		);
		const message = result.ok
			? this.renderer.renderInstantActionFeedback(
					result.result.value.message,
					incident,
				).content
			: result.error.message;

		await this.replyEphemeral(interaction, message);
	}

	private async renderEvent(
		client: Client,
		event: GameEvent,
	): Promise<void> {
		const binding = this.registry.getBySession(
			event.sessionId,
		);

		if (binding === undefined) {
			return;
		}

		const outputChannel = await this.fetchTextChannel(
			client,
			binding.outputChannelId,
		);

		if (outputChannel === undefined) {
			return;
		}

		switch (event.type) {
			case "player.joined":
				await this.updateLobby(event.sessionId);
				return;
			case "roles.assigned":
				await this.sendPayload(
					outputChannel,
					this.renderRoleAssignments(event.sessionId),
				);
				return;
			case "incident.generated": {
				const session =
					this.kernel.stateManager.getSnapshot(
						event.sessionId,
					);
				const incident =
					session?.state.status === "running" ||
					session?.state.status === "paused" ||
					session?.state.status === "recovering"
						? session.state.activeIncidents.get(
								event.incidentId,
							)
						: undefined;

				if (incident === undefined) {
					this.debug(
						"incident render skipped: incident not active",
						{
							incidentId: event.incidentId,
							sessionId: event.sessionId,
						},
					);
					return;
				}

				const voteWindow =
					session?.state.status === "running" ||
					session?.state.status === "paused" ||
					session?.state.status === "recovering"
						? session.state.voteWindows.get(
								event.incidentId,
							)
						: undefined;

				const payload = this.renderer.renderIncidentPrompt(
					incident,
					(action) => {
						const route = this.registerIncidentActionRoute(
							event.sessionId,
							incident,
							action,
						);
						const customId = this.codec.encodeAction({
							key: route.key,
						});
						this.debug("action route registered", {
							actionId: action.id,
							customIdLength: customId.length,
							incidentId: incident.id,
							key: route.key,
							sessionId: event.sessionId,
						});
						return customId;
					},
					(action) => {
						const route = this.registerIncidentActionRoute(
							event.sessionId,
							incident,
							action,
						);
						return this.codec.encodeInstant({
							key: route.key,
						});
					},
					voteWindow,
					this.incidentRenderOptions(
						event.sessionId,
						event.incidentId,
					),
				);
				this.debug("incident render payload produced", {
					actionCount: incident.actionOptions.length,
					componentRows: this.componentRowCount(payload),
					incidentId: incident.id,
					title: incident.title,
				});
				const message = await this.sendPayload(
					outputChannel,
					payload,
				);
				this.registry.setIncidentMessageId(
					event.sessionId,
					event.incidentId,
					message.id,
				);
				this.debug("incident message sent", {
					incidentId: event.incidentId,
					messageId: message.id,
					sessionId: event.sessionId,
				});
				return;
			}
			case "vote.closed":
				await this.updateIncidentMessage(
					event.sessionId,
					event.incidentId,
					{
						disabled: true,
						terminalText:
							event.selectedActionId === undefined
								? "No response selected."
								: "Voting closed. Applying response.",
					},
				);

				if (event.selectedActionId === undefined) {
					this.registry.cleanupIncidentActionRoutes(
						event.sessionId,
						event.incidentId,
					);
				}

				return;
			case "incident.resolved": {
				await this.updateIncidentMessage(
					event.sessionId,
					event.incidentId,
					{
						disabled: true,
						terminalText: event.succeeded
							? "Fixed. Somehow."
							: "Failed. We tried.",
					},
				);
				this.registry.cleanupIncidentActionRoutes(
					event.sessionId,
					event.incidentId,
				);
				const session =
					this.kernel.stateManager.getSnapshot(
						event.sessionId,
					);
				const incident =
					session?.state.status === "running" ||
					session?.state.status === "paused" ||
					session?.state.status === "recovering"
						? session.state.incidentHistory.get(
								event.incidentId,
							)
						: undefined;

				if (incident !== undefined) {
					await this.sendPayload(
						outputChannel,
						this.renderer.renderIncidentOutcome(
							incident,
							event.succeeded,
						),
					);
				}

				return;
			}
			case "incident.failed":
				await this.updateIncidentMessage(
					event.sessionId,
					event.incidentId,
					{
						disabled: true,
						terminalText: "Pressure increased.",
					},
				);
				this.registry.cleanupIncidentActionRoutes(
					event.sessionId,
					event.incidentId,
				);
				return;
			case "statistics.updated":
				await this.sendPayload(
					outputChannel,
					this.renderStatus(event.after),
				);
				return;
			case "commentary.cued":
				if (
					event.sourceEventType === "incident.generated"
				) {
					this.debug(
						"suppressed generated-incident commentary",
						{
							message: event.message,
							sessionId: event.sessionId,
						},
					);
					return;
				}

				this.queueCommentary(
					event.sessionId,
					event.message,
					event.priority,
				);
				return;
			case "session.ended":
				await this.updateSessionIncidentMessages(
					event.sessionId,
					{
						disabled: true,
						terminalText: this.sessionTerminalText(
							event.reason,
						),
					},
				);
				await this.flushCommentary(event.sessionId);
				await this.sendPayload(
					outputChannel,
					this.renderFinalReport(event.sessionId),
				);
				this.registry.cleanup(event.sessionId);
				return;
			default:
				return;
		}
	}

	private async resolveOutputChannel(
		interaction: ButtonInteraction,
		binding: NonNullable<
			ReturnType<DiscordSessionRegistry["getBySession"]>
		>,
	): Promise<SendableTextChannel> {
		const channel = interaction.channel;

		if (channel !== null) {
			try {
				const thread =
					await interaction.message.startThread({
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
			const fetched =
				await interaction.client.channels.fetch(
					binding.channelId,
				);

			if (
				fetched?.isTextBased() &&
				isSendableChannel(fetched)
			) {
				return fetched;
			}

			throw new Error(
				"Unable to resolve a text channel for the incident.",
			);
		}

		if (isSendableChannel(channel)) {
			return channel;
		}

		throw new Error(
			"Unable to resolve a sendable text channel for the incident.",
		);
	}

	private async updateLobby(
		sessionId: SessionId,
		disabled = false,
	): Promise<void> {
		const binding = this.registry.getBySession(sessionId);

		if (
			binding?.lobbyMessageId === undefined ||
			this.client === undefined
		) {
			return;
		}

		const channel = await this.fetchTextChannel(
			this.client,
			binding.channelId,
		);

		if (
			channel === undefined ||
			!isMessageFetchableChannel(channel)
		) {
			return;
		}

		const message = await channel.messages
			.fetch(binding.lobbyMessageId)
			.catch(() => undefined);

		if (message === undefined) {
			return;
		}

		await message.edit(
			this.toDiscordMessageOptions(
				this.renderLobby(sessionId, disabled),
			),
		);
	}

	private async fetchTextChannel(
		client: Client,
		channelId: string,
	): Promise<SendableTextChannel | undefined> {
		const channel = await client.channels
			.fetch(channelId)
			.catch(() => null);
		return channel?.isTextBased() &&
			isSendableChannel(channel)
			? channel
			: undefined;
	}

	private registerIncidentActionRoute(
		sessionId: SessionId,
		incident: Incident,
		action: Action,
	): ReturnType<
		DiscordSessionRegistry["registerActionRoute"]
	> {
		return incident.votingClosesAt === undefined
			? this.registry.registerActionRoute({
					actionId: action.id,
					createdAt: this.kernel.clock.now(),
					incidentId: incident.id,
					sessionId,
				})
			: this.registry.registerActionRoute({
					actionId: action.id,
					createdAt: this.kernel.clock.now(),
					expiresAt: incident.votingClosesAt,
					incidentId: incident.id,
					sessionId,
				});
	}

	private async updateIncidentMessage(
		sessionId: SessionId,
		incidentId: IncidentId,
		options: {
			readonly disabled?: boolean;
			readonly terminalText?: string;
		} = {},
	): Promise<void> {
		const binding = this.registry.getBySession(sessionId);
		const messageId = this.registry.getIncidentMessageId(
			sessionId,
			incidentId,
		);

		if (
			binding === undefined ||
			messageId === undefined ||
			this.client === undefined
		) {
			return;
		}

		const channel = await this.fetchTextChannel(
			this.client,
			binding.outputChannelId,
		);

		if (
			channel === undefined ||
			!isMessageFetchableChannel(channel)
		) {
			return;
		}

		const session =
			this.kernel.stateManager.getSnapshot(sessionId);
		const incident = this.findIncident(
			sessionId,
			incidentId,
		);

		if (incident === undefined) {
			return;
		}

		const voteWindow =
			session?.state.status === "running" ||
			session?.state.status === "paused" ||
			session?.state.status === "recovering"
				? session.state.voteWindows.get(incidentId)
				: undefined;

		const message = await channel.messages
			.fetch(messageId)
			.catch(() => undefined);

		if (message === undefined) {
			return;
		}

		const payload = this.renderer.renderIncidentPrompt(
			incident,
			(action) => {
				const existingRoute =
					this.registry.getActionRouteByAction(
						sessionId,
						incident.id,
						action.id,
					);
				const route =
					existingRoute ??
					this.registerIncidentActionRoute(
						sessionId,
						incident,
						action,
					);
				return this.codec.encodeAction({ key: route.key });
			},
			(action) => {
				const existingRoute =
					this.registry.getActionRouteByAction(
						sessionId,
						incident.id,
						action.id,
					);
				const route =
					existingRoute ??
					this.registerIncidentActionRoute(
						sessionId,
						incident,
						action,
					);
				return this.codec.encodeInstant({ key: route.key });
			},
			voteWindow,
			this.incidentRenderOptions(
				sessionId,
				incidentId,
				options,
			),
		);

		await message
			.edit(this.toDiscordMessageOptions(payload))
			.catch(() => undefined);
	}

	private findIncident(
		sessionId: SessionId,
		incidentId: IncidentId,
	): Incident | undefined {
		const session =
			this.kernel.stateManager.getSnapshot(sessionId);

		if (
			session === undefined ||
			session.state.status === "waiting"
		) {
			return undefined;
		}

		if (session.state.status === "ended") {
			return session.state.incidentHistory.get(incidentId);
		}

		return (
			session.state.activeIncidents.get(incidentId) ??
			session.state.incidentHistory.get(incidentId)
		);
	}

	private async updateSessionIncidentMessages(
		sessionId: SessionId,
		options: {
			readonly disabled?: boolean;
			readonly terminalText?: string;
		},
	): Promise<void> {
		for (const entry of this.registry.getIncidentMessageEntries(
			sessionId,
		)) {
			await this.updateIncidentMessage(
				sessionId,
				entry.incidentId,
				options,
			);
		}
	}

	private incidentNumber(
		sessionId: SessionId,
		incidentId: IncidentId,
	): number | undefined {
		const session =
			this.kernel.stateManager.getSnapshot(sessionId);

		if (
			session === undefined ||
			session.state.status === "waiting"
		) {
			return undefined;
		}

		const history = [
			...session.state.incidentHistory.keys(),
		];
		const historyIndex = history.findIndex(
			(id) => id === incidentId,
		);

		if (historyIndex >= 0) {
			return historyIndex + 1;
		}

		return session.state.status === "ended"
			? undefined
			: session.state.incidentHistory.size + 1;
	}

	private incidentRenderOptions(
		sessionId: SessionId,
		incidentId: IncidentId,
		options: {
			readonly disabled?: boolean;
			readonly terminalText?: string;
		} = {},
	): {
		readonly disabled?: boolean;
		readonly incidentNumber?: number;
		readonly maxIncidents?: number;
		readonly terminalText?: string;
	} {
		const incidentNumber = this.incidentNumber(
			sessionId,
			incidentId,
		);

		return {
			maxIncidents: MAX_INCIDENTS,
			...(incidentNumber === undefined
				? {}
				: { incidentNumber }),
			...(options.disabled === undefined
				? {}
				: { disabled: options.disabled }),
			...(options.terminalText === undefined
				? {}
				: { terminalText: options.terminalText }),
		};
	}

	private queueCommentary(
		sessionId: SessionId,
		message: string,
		priority: "high" | "low" | "normal",
	): void {
		if (
			priority === "low" &&
			this.isGenericCommentary(message)
		) {
			return;
		}

		const existing = this.commentaryBuffers.get(sessionId);

		if (existing !== undefined) {
			existing.messages.add(this.polishCommentary(message));
			return;
		}

		const messages = new Set<string>([
			this.polishCommentary(message),
		]);
		const timer = setTimeout(
			() => {
				this.flushCommentary(sessionId).catch(
					(error: unknown) => {
						this.debug("commentary flush failed", {
							error:
								error instanceof Error
									? error.message
									: String(error),
							sessionId,
						});
					},
				);
			},
			priority === "high" ? 250 : COMMENTARY_FLUSH_DELAY_MS,
		);

		this.commentaryBuffers.set(sessionId, {
			messages,
			timer,
		});
	}

	private async flushCommentary(
		sessionId: SessionId,
	): Promise<void> {
		const buffer = this.commentaryBuffers.get(sessionId);

		if (buffer === undefined || this.client === undefined) {
			return;
		}

		clearTimeout(buffer.timer);
		this.commentaryBuffers.delete(sessionId);

		if (buffer.messages.size === 0) {
			return;
		}

		const binding = this.registry.getBySession(sessionId);

		if (binding === undefined) {
			return;
		}

		const outputChannel = await this.fetchTextChannel(
			this.client,
			binding.outputChannelId,
		);

		if (outputChannel === undefined) {
			return;
		}

		await this.sendPayload(
			outputChannel,
			this.renderer.renderCommentary(
				[...buffer.messages]
					.map((line) => `- ${line}`)
					.join("\n"),
			),
		);
	}

	private isGenericCommentary(message: string): boolean {
		return (
			message ===
			"Production metrics shifted after the response."
		);
	}

	private polishCommentary(message: string): string {
		const replacements: Readonly<Record<string, string>> = {
			"A delayed consequence has been scheduled.":
				"Delayed follow-up work is now queued.",
			"Production metrics shifted after the response.":
				"Metrics changed after the response.",
			"The failed response may cascade into follow-up work.":
				"Failure may trigger follow-up incidents.",
			"The response failed and production pressure increased.":
				"Pressure increased after the failed fix.",
			"The response worked and production stabilized.":
				"Production stabilized after the response.",
		};

		return replacements[message] ?? message;
	}

	private renderLobby(
		sessionId: SessionId,
		disabled = false,
	): DiscordMessagePayload {
		const session =
			this.kernel.stateManager.getSnapshot(sessionId);
		const playerCount =
			session?.state.status === "waiting"
				? session.state.players.size
				: 0;
		const status = session?.state.status ?? "unknown";

		return {
			buttons: [
				{
					customId: this.codec.encodeLobby({
						action: "join",
						sessionId,
					}),
					disabled,
					label: `${this.emojis.emoji("users")} Join`,
					style: "secondary",
				},
				{
					customId: this.codec.encodeLobby({
						action: "start",
						sessionId,
					}),
					disabled,
					label: `${this.emojis.emoji("incident")} Start`,
					style: "secondary",
				},
				{
					customId: this.codec.encodeLobby({
						action: "cancel",
						sessionId,
					}),
					disabled,
					label: `${this.emojis.emoji("end")} Cancel`,
					style: "secondary",
				},
			],
			content: [
				`${this.emojis.emoji("incident")} **Production Incident**`,
				"جهزوا الفريق. الإنتاج بدأ يتوتر.",
				"",
				`**Players:** ${playerCount}/${MAX_PLAYERS}`,
				`**Status:** ${this.titleCase(status)}`,
				`**Session:** \`${this.shortSessionId(sessionId)}\``,
			].join("\n"),
			accentColor: 0x02fe97,
			useComponentsV2: true,
		};
	}

	private renderRoleAssignments(
		sessionId: SessionId,
	): DiscordMessagePayload {
		const session =
			this.kernel.stateManager.getSnapshot(sessionId);
		const players =
			session?.state.status === "running" ||
			session?.state.status === "paused" ||
			session?.state.status === "recovering"
				? [...session.state.players.values()]
				: [];

		return {
			content: [
				`${this.emojis.emoji("users")} **Production Team Assembled**`,
				...players.map(
					(player) =>
						`${player.displayName} - ${this.roleDisplayName(player.roleId)}`,
				),
			].join("\n"),
			accentColor: 0x02fe97,
			useComponentsV2: true,
		};
	}

	private renderStatus(stats: {
		readonly developerSanity: number;
		readonly infrastructureCost: number;
		readonly serverStability: number;
		readonly userHappiness: number;
	}): DiscordMessagePayload {
		return {
			content: [
				`${this.emojis.emoji("status")} **System Status**`,
				`**Stability:** ${stats.serverStability}`,
				`**Developer sanity:** ${stats.developerSanity}`,
				`**User happiness:** ${stats.userHappiness}`,
				`**Cost:** ${stats.infrastructureCost}`,
			].join("\n"),
			accentColor: 0x02fe97,
			useComponentsV2: true,
		};
	}

	private renderFinalReport(
		sessionId: SessionId,
	): DiscordMessagePayload {
		const session =
			this.kernel.stateManager.getSnapshot(sessionId);
		const endReason =
			session?.state.status === "ended"
				? session.state.endReason
				: undefined;
		const historyCount = this.incidentHistoryCount(session);

		return {
			content: [
				`${this.emojis.emoji("end")} **Final Report**`,
				`**Result:** ${this.sessionResultText(endReason)}`,
				`**Incidents handled:** ${historyCount}`,
				`**Stability:** ${session?.stats.serverStability ?? 0}`,
				`**Developer sanity:** ${session?.stats.developerSanity ?? 0}`,
				`**User happiness:** ${session?.stats.userHappiness ?? 0}`,
				`**Cost:** ${session?.stats.infrastructureCost ?? 0}`,
				"",
				this.finalReportBlock(session),
			].join("\n"),
			accentColor:
				endReason === "survived" ? 0x02fe97 : 0xff5c5c,
			useComponentsV2: true,
		};
	}

	private async replyEphemeral(
		interaction: ButtonInteraction,
		content: string,
	): Promise<void> {
		await this.tryInteractionFeedback(
			interaction,
			async () => {
				if (interaction.deferred && !interaction.replied) {
					await interaction.editReply({ content });
					return;
				}

				if (interaction.replied) {
					await interaction.followUp({
						content,
						flags: MessageFlags.Ephemeral,
					});
					return;
				}

				await interaction.reply({
					content,
					flags: MessageFlags.Ephemeral,
				});
			},
		);
	}

	private async deferEphemeral(
		interaction: ButtonInteraction,
	): Promise<boolean> {
		if (interaction.deferred || interaction.replied) {
			return true;
		}

		return this.tryInteractionFeedback(
			interaction,
			async () => {
				await interaction.deferReply({
					flags: MessageFlags.Ephemeral,
				});
			},
		);
	}

	private async tryInteractionFeedback(
		interaction: ButtonInteraction,
		operation: () => Promise<void>,
	): Promise<boolean> {
		try {
			await operation();
			return true;
		} catch (error: unknown) {
			this.debug("interaction feedback failed", {
				code: this.errorCode(error),
				customId: interaction.customId,
				error:
					error instanceof Error
						? error.message
						: String(error),
			});
			return false;
		}
	}

	private sendPayload(
		channel: SendableTextChannel,
		payload: DiscordMessagePayload,
	): Promise<Message> {
		return channel.send(
			this.toDiscordMessageOptions(payload),
		);
	}

	private toDiscordMessageOptions(
		payload: DiscordMessagePayload,
	): RenderedDiscordMessage {
		const rows = this.resolveButtonRows(payload);

		if (payload.useComponentsV2 === true) {
			const container = buildContainer({
				accentColor: payload.accentColor ?? 0x02fe97,
				content: payload.content,
			});

			if (rows.length > 0) {
				container.addSeparatorComponents(
					new SeparatorBuilder().setDivider(true),
				);

				for (const row of rows) {
					container.addActionRowComponents(
						new ActionRowBuilder<ButtonBuilder>().addComponents(
							row.buttons.map((button) =>
								this.toButton(button),
							),
						),
					);
				}
			}

			return {
				components: [container],
				content: "",
				embeds: [],
				flags: MessageFlags.IsComponentsV2,
			};
		}

		return {
			components: rows.map((row) =>
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					row.buttons.map((button) =>
						this.toButton(button),
					),
				),
			),
			content: payload.content,
			embeds:
				payload.embeds?.map((embed) =>
					this.toEmbed(embed),
				) ?? [],
		};
	}

	private resolveButtonRows(
		payload: DiscordMessagePayload,
	): readonly DiscordButtonRowPayload[] {
		if (payload.buttonRows !== undefined) {
			return payload.buttonRows;
		}

		if (payload.buttons === undefined) {
			return [];
		}

		const rows: DiscordButtonRowPayload[] = [];

		for (
			let index = 0;
			index < payload.buttons.length;
			index += 5
		) {
			rows.push({
				buttons: payload.buttons.slice(index, index + 5),
			});
		}

		return rows;
	}

	private toButton(
		button: DiscordButtonPayload,
	): ButtonBuilder {
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

	private toEmbed(
		payload: DiscordEmbedPayload,
	): EmbedBuilder {
		const embed = new EmbedBuilder().setTitle(
			payload.title,
		);

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

	private componentRowCount(
		payload: DiscordMessagePayload,
	): number {
		return this.resolveButtonRows(payload).length;
	}

	private debug(
		message: string,
		metadata: Readonly<Record<string, unknown>>,
	): void {
		log.debug(message, metadata);
	}

	private errorCode(error: unknown): string | undefined {
		return typeof error === "object" &&
			error !== null &&
			"code" in error &&
			(typeof error.code === "string" ||
				typeof error.code === "number")
			? String(error.code)
			: undefined;
	}

	private finalReportBlock(
		session: GameSession | undefined,
	): string {
		if (session === undefined) {
			return "```log\n[REPORT] SESSION COMPLETE\n[WARN] Session data unavailable\n```";
		}

		const historyCount = this.incidentHistoryCount(session);

		return [
			"```log",
			"[REPORT] SESSION COMPLETE",
			`[OK] Incidents handled: ${historyCount}`,
			`[WARN] Infrastructure cost: ${session.stats.infrastructureCost}`,
			"```",
		].join("\n");
	}

	private async syncApplicationEmojiRegistry(
		client: Client,
	): Promise<void> {
		if (this.emojiSyncInFlight !== undefined) {
			return this.emojiSyncInFlight;
		}

		this.emojiSyncInFlight = this.loadApplicationEmojis(
			client,
		)
			.then((applicationEmojis) => {
				const summary = this.emojis.sync(applicationEmojis);
				this.debug("application emoji registry synced", {
					...summary,
					availableApplicationEmojis:
						applicationEmojis.length,
					note: "Compared persistent emoji config against bot application emojis only. Missing entries use configured fallback unicode.",
				});
			})
			.catch((error: unknown) => {
				this.debug(
					"application emoji registry sync failed",
					{
						error:
							error instanceof Error
								? error.message
								: String(error),
						note: "Emoji rendering will use configured fallback unicode until the next successful application emoji sync.",
					},
				);
			})
			.finally(() => {
				this.emojiSyncInFlight = undefined;
			});

		return this.emojiSyncInFlight;
	}

	private async loadApplicationEmojis(
		client: Client,
	): Promise<readonly AvailableDiscordEmoji[]> {
		if (client.application === null) {
			return [];
		}

		const fetched = await client.application.emojis.fetch();
		return fetched.map((emoji) => ({
			animated: emoji.animated ?? false,
			id: emoji.id,
			name: emoji.name,
			source: "application" as const,
		}));
	}

	private incidentHistoryCount(
		session: GameSession | undefined,
	): number {
		if (
			session === undefined ||
			session.state.status === "waiting"
		) {
			return 0;
		}

		return session.state.incidentHistory.size;
	}

	private sessionResultText(
		reason: string | undefined,
	): string {
		switch (reason) {
			case "cancelled":
			case "shutdown":
				return "Manually ended";
			case "failed":
				return "Production collapsed";
			case "survived":
				return "Survived";
			case "timed-out":
				return "Timed out";
			default:
				return "Ended";
		}
	}

	private sessionTerminalText(reason: string): string {
		switch (reason) {
			case "survived":
				return "Contained. For now.";
			case "failed":
				return "Failed. Production remembers.";
			case "timed-out":
				return "Passed. Nobody ask why.";
			case "cancelled":
			case "shutdown":
				return "Session ended.";
			default:
				return "At least we tried.";
		}
	}

	private roleDisplayName(
		roleId: string | undefined,
	): string {
		const names: Readonly<Record<string, string>> = {
			"role-backend-engineer": "Backend Engineer",
			"role-devops": "DevOps",
			"role-intern": "Intern",
			"role-qa": "QA",
			"role-security-engineer": "Security Engineer",
		};

		return roleId === undefined
			? "Unassigned"
			: (names[roleId] ?? roleId);
	}

	private titleCase(value: string): string {
		return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
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

function isSendableChannel(
	channel: TextBasedChannel,
): channel is SendableTextChannel {
	return (
		"send" in channel && typeof channel.send === "function"
	);
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
	readonly components: readonly (
		| ActionRowBuilder<ButtonBuilder>
		| ContainerBuilder
	)[];
	readonly content: string;
	readonly embeds: EmbedBuilder[];
	readonly flags?: MessageFlags.IsComponentsV2;
}
