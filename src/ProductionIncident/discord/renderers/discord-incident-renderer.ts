import type {
  Action,
  GameSession,
  GlobalStats,
  Incident,
  VoteWindow,
} from "../../engine/index.js";
import type { DiscordMessagePayload } from "./discord-message-payload.js";
import { renderIncidentLogsBlock } from "./incident-log-renderer.js";
import type { ProductionIncidentEmojiRegistry } from "./production-incident-emojis.js";

export class DiscordIncidentRenderer {
  public constructor(private readonly emojis: ProductionIncidentEmojiRegistry) {}

  public renderIncidentPrompt(
    incident: Incident,
    actionCustomId: (action: Action) => string,
    instantCustomId: (action: Action) => string,
    voteWindow?: VoteWindow,
    options: {
      readonly disabled?: boolean;
      readonly incidentNumber?: number;
      readonly maxIncidents?: number;
      readonly terminalText?: string;
    } = {},
  ): DiscordMessagePayload {
    const voteCountByActionId = this.voteCountByActionId(voteWindow);
    const voteButtons = incident.actionOptions.map((action) =>
      this.actionButton(
        action,
        actionCustomId(action),
        voteCountByActionId.get(action.id) ?? 0,
        options.disabled ?? false,
      ),
    );
    const instantButtons = incident.instantActionOptions.map((action) =>
      this.actionButton(
        action,
        instantCustomId(action),
        undefined,
        options.disabled ?? false,
        "secondary",
      ),
    );

    return {
      accentColor: this.accentForIncident(incident),
      buttonRows: [
        { buttons: voteButtons },
        ...(instantButtons.length === 0 ? [] : [{ buttons: instantButtons }]),
      ],
      content: [
        `${this.emojis.emoji("incident")} **Production Incident**`,
        this.incidentCounter(options.incidentNumber, options.maxIncidents),
        `\`${incident.title}\``,
        "",
        `**Severity:** ${this.titleCase(incident.severity)}`,
        `**Service:** ${incident.affectedServices.join(", ")}`,
        `**Problem:** ${incident.description}`,
        this.stateLine(incident, voteWindow, options.terminalText),
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
      accentColor: succeeded ? 0x02fe97 : 0xff5c5c,
      useComponentsV2: true,
    };
  }

  public renderSessionSummary(session: GameSession): DiscordMessagePayload {
    return {
      content: this.renderStatsText("System Status", session.stats, [
        `Status: ${session.state.status}`,
      ]),
      accentColor: 0x02fe97,
      useComponentsV2: true,
    };
  }

  public renderCommentary(message: string): DiscordMessagePayload {
    return {
      content: `${this.emojis.emoji("warning")} **System Notes**\n${message}`,
      accentColor: 0xf1c40f,
      useComponentsV2: true,
    };
  }

  public renderInstantActionFeedback(
    message: string,
    incident: Incident | undefined,
  ): DiscordMessagePayload {
    return {
      content: [
        `${this.emojis.emoji("logs")} **Logs Snapshot**`,
        message,
        ...(incident === undefined ? [] : ["", renderIncidentLogsBlock(incident, "diff")]),
      ].join("\n"),
      accentColor: 0x02fe97,
      useComponentsV2: true,
    };
  }

  private actionButton(
    action: Action,
    customId: string,
    votes?: number,
    disabled = false,
    style?: "danger" | "primary" | "secondary" | "success",
  ): {
    readonly customId: string;
    readonly disabled?: boolean;
    readonly label: string;
    readonly style: "danger" | "primary" | "secondary" | "success";
  } {
    const emoji = this.emojis.emoji(action.emojiKey);
    const prefix = emoji.length === 0 ? "" : `${emoji} `;
    const label = votes === undefined
      ? `${prefix}${action.label}`
      : `${prefix}${action.label} (${votes})`;

    return {
      customId,
      disabled,
      label: label.slice(0, 80),
      style: style ?? "secondary",
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

  private stateLine(
    incident: Incident,
    voteWindow: VoteWindow | undefined,
    terminalText: string | undefined,
  ): string {
    if (terminalText !== undefined) {
      return `**State:** ${terminalText}`;
    }

    const text = this.votingCloseText(incident, voteWindow);
    return text === "Voting closed."
      ? "**State:** Voting closed."
      : `**Voting closes:** ${text}`;
  }

  private accentForIncident(incident: Incident): number {
    switch (incident.severity) {
      case "critical":
        return 0xff5c5c;
      case "high":
        return 0xf1c40f;
      case "low":
      case "medium":
        return 0x02fe97;
    }
  }

  private incidentCounter(
    incidentNumber: number | undefined,
    maxIncidents: number | undefined,
  ): string {
    if (incidentNumber === undefined) {
      return "";
    }

    return maxIncidents === undefined
      ? `**Incident #${incidentNumber}**`
      : `**Incident ${incidentNumber}/${maxIncidents}**`;
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
