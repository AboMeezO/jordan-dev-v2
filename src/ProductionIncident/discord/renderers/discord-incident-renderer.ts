import type {
  Action,
  GameSession,
  GlobalStats,
  Incident,
  VoteWindow,
} from "../../engine/index.js";
import type { DiscordMessagePayload } from "./discord-message-payload.js";
import type { ProductionIncidentEmojiRegistry } from "./production-incident-emojis.js";

export class DiscordIncidentRenderer {
  public constructor(private readonly emojis: ProductionIncidentEmojiRegistry) {}

  public renderIncidentPrompt(
    incident: Incident,
    actionCustomId: (action: Action) => string,
    instantCustomId: (action: Action) => string,
    voteWindow?: VoteWindow,
  ): DiscordMessagePayload {
    const voteCountByActionId = this.voteCountByActionId(voteWindow);
    const voteButtons = incident.actionOptions.map((action) =>
      this.actionButton(
        action,
        actionCustomId(action),
        voteCountByActionId.get(action.id) ?? 0,
      ),
    );
    const instantButtons = incident.instantActionOptions.map((action) =>
      this.actionButton(action, instantCustomId(action), undefined, "secondary"),
    );

    return {
      buttonRows: [
        { buttons: voteButtons },
        ...(instantButtons.length === 0 ? [] : [{ buttons: instantButtons }]),
      ],
      content: [
        `${this.emojis.emoji("incident")} **Production Incident**`,
        `\`${incident.title}\``,
        "",
        `**Severity:** ${this.titleCase(incident.severity)}`,
        `**Service:** ${incident.affectedServices.join(", ")}`,
        `**Problem:** ${incident.description}`,
        `**Voting closes:** ${this.votingCloseText(incident, voteWindow)}`,
        "",
        "اختاروا team response بسرعة.",
      ].join("\n"),
      useComponentsV2: true,
    };
  }

  public renderIncidentOutcome(
    incident: Incident,
    succeeded: boolean,
  ): DiscordMessagePayload {
    return {
      content: [
        `${this.emojis.emoji(succeeded ? "success" : "failure")} **${succeeded ? "Response Worked" : "Response Failed"}**`,
        `\`${incident.title}\``,
        "",
        `**Root cause:** ${incident.rootCause}`,
      ].join("\n"),
      useComponentsV2: true,
    };
  }

  public renderSessionSummary(session: GameSession): DiscordMessagePayload {
    return {
      content: this.renderStatsText("System Status", session.stats, [
        `Status: ${session.state.status}`,
      ]),
      useComponentsV2: true,
    };
  }

  public renderCommentary(message: string): DiscordMessagePayload {
    return {
      content: `${this.emojis.emoji("warning")} **System Notes**\n${message}`,
      useComponentsV2: true,
    };
  }

  private actionButton(
    action: Action,
    customId: string,
    votes?: number,
    style?: "danger" | "primary" | "secondary" | "success",
  ): { readonly customId: string; readonly label: string; readonly style: "danger" | "primary" | "secondary" | "success" } {
    const emoji = this.emojis.emoji(action.emojiKey);
    const prefix = emoji.length === 0 ? "" : `${emoji} `;
    const label = votes === undefined
      ? `${prefix}${action.label}`
      : `${prefix}${action.label} (${votes})`;

    return {
      customId,
      label: label.slice(0, 80),
      style: style ?? (action.risk === "critical" || action.risk === "high" ? "danger" : "primary"),
    };
  }

  private discordTimestamp(timestamp: Incident["votingClosesAt"]): string {
    return timestamp === undefined
      ? "soon"
      : `<t:${Math.floor(timestamp / 1_000)}:R>`;
  }

  private votingCloseText(incident: Incident, voteWindow: VoteWindow | undefined): string {
    if (voteWindow?.status === "closed" || incident.status !== "voting") {
      return "Voting closed.";
    }

    return this.discordTimestamp(incident.votingClosesAt);
  }

  private renderStatsText(
    title: string,
    stats: GlobalStats,
    lines: readonly string[] = [],
  ): string {
    return [
      `${this.emojis.emoji("status")} **${title}**`,
      ...lines,
      `Server Stability: ${stats.serverStability}`,
      `Developer Sanity: ${stats.developerSanity}`,
      `User Happiness: ${stats.userHappiness}`,
      `Infrastructure Cost: ${stats.infrastructureCost}`,
    ].join("\n");
  }

  private titleCase(value: string): string {
    return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
  }

  private voteCountByActionId(voteWindow: VoteWindow | undefined): ReadonlyMap<Action["id"], number> {
    const counts = new Map<Action["id"], number>();

    if (voteWindow === undefined) {
      return counts;
    }

    for (const vote of voteWindow.votesByPlayerId.values()) {
      counts.set(vote.actionId, (counts.get(vote.actionId) ?? 0) + 1);
    }

    return counts;
  }
}
