import type {
  Action,
  GameSession,
  Incident,
  SessionId,
} from "../../engine/index.js";
import type { DiscordMessagePayload } from "./discord-message-payload.js";

export class DiscordIncidentRenderer {
  public renderIncidentPrompt(
    sessionId: SessionId,
    incident: Incident,
  ): DiscordMessagePayload {
    return {
      buttons: incident.actionOptions.map((action) =>
        this.actionButton(sessionId, incident, action),
      ),
      content: `Incident: ${incident.title}`,
      embeds: [
        {
          color: this.colorForSeverity(incident.severity),
          description: incident.description,
          fields: [
            {
              inline: true,
              name: "Severity",
              value: incident.severity,
            },
            {
              inline: true,
              name: "Service",
              value: incident.affectedServices.join(", "),
            },
            {
              name: "Actions",
              value: incident.actionOptions
                .map((action) => `${action.label} (${action.risk})`)
                .join("\n"),
            },
          ],
          title: incident.title,
        },
      ],
    };
  }

  public renderIncidentOutcome(
    incident: Incident,
    succeeded: boolean,
  ): DiscordMessagePayload {
    return {
      content: succeeded
        ? `${incident.title} resolved.`
        : `${incident.title} response failed.`,
      embeds: [
        {
          color: succeeded ? 0x2ecc71 : 0xe74c3c,
          description: `Root cause: ${incident.rootCause}`,
          title: succeeded ? "Incident resolved" : "Incident failed",
        },
      ],
    };
  }

  public renderSessionSummary(session: GameSession): DiscordMessagePayload {
    return {
      content: `Session ${session.id}`,
      embeds: [
        {
          fields: [
            { inline: true, name: "Stability", value: String(session.stats.serverStability) },
            { inline: true, name: "Sanity", value: String(session.stats.developerSanity) },
            { inline: true, name: "Users", value: String(session.stats.userHappiness) },
            { inline: true, name: "Cost", value: String(session.stats.infrastructureCost) },
          ],
          title: `Status: ${session.state.status}`,
        },
      ],
    };
  }

  public renderCommentary(message: string): DiscordMessagePayload {
    return {
      content: message,
    };
  }

  private actionButton(
    sessionId: SessionId,
    incident: Incident,
    action: Action,
  ): { readonly customId: string; readonly label: string; readonly style: "danger" | "primary" | "secondary" | "success" } {
    return {
      customId: `pi:vote:${sessionId}:${incident.id}:${action.id}`,
      label: action.label,
      style: action.risk === "critical" || action.risk === "high" ? "danger" : "primary",
    };
  }

  private colorForSeverity(severity: Incident["severity"]): number {
    switch (severity) {
      case "low":
        return 0x3498db;
      case "medium":
        return 0xf1c40f;
      case "high":
        return 0xe67e22;
      case "critical":
        return 0xe74c3c;
    }
  }
}
