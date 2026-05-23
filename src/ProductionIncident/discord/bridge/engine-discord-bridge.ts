import type {
  ActionId,
  GameEvent,
  GameplayManager,
  IncidentId,
  PlayerId,
  SessionId,
  StateManager,
} from "../../engine/index.js";
import { DiscordIncidentRenderer } from "../renderers/discord-incident-renderer.js";
import type { DiscordMessagePayload } from "../renderers/discord-message-payload.js";

export type DiscordRenderAction =
  | {
      readonly payload: DiscordMessagePayload;
      readonly type: "send";
    }
  | {
      readonly incidentId: string;
      readonly payload: DiscordMessagePayload;
      readonly type: "update-incident";
    };

export class EngineDiscordBridge {
  private readonly renderer = new DiscordIncidentRenderer();

  public constructor(
    private readonly stateManager: StateManager,
    private readonly gameplayManager: GameplayManager,
  ) {}

  public async voteSubmitted(customId: string, userId: string): Promise<void> {
    const [, , sessionId, incidentId, actionId] = customId.split(":");

    if (
      sessionId === undefined ||
      incidentId === undefined ||
      actionId === undefined
    ) {
      throw new Error("Invalid vote custom ID.");
    }

    await this.gameplayManager.submitVote({
      actionId: actionId as ActionId,
      incidentId: incidentId as IncidentId,
      playerId: `player-${userId}` as PlayerId,
      sessionId: sessionId as SessionId,
    });
  }

  public mapEventToRenderAction(event: GameEvent): DiscordRenderAction | undefined {
    switch (event.type) {
      case "incident.generated": {
        const session = this.stateManager.getSnapshot(event.sessionId);
        const incident =
          session?.state.status === "running" ||
          session?.state.status === "paused" ||
          session?.state.status === "recovering"
            ? session.state.activeIncidents.get(event.incidentId)
            : undefined;

        return incident === undefined
          ? undefined
          : {
              payload: this.renderer.renderIncidentPrompt(event.sessionId, incident),
              type: "send",
            };
      }
      case "incident.resolved": {
        const session = this.stateManager.getSnapshot(event.sessionId);
        const incident =
          session?.state.status === "running" ||
          session?.state.status === "paused" ||
          session?.state.status === "recovering"
            ? session.state.activeIncidents.get(event.incidentId)
            : undefined;

        return incident === undefined
          ? undefined
          : {
              incidentId: event.incidentId,
              payload: this.renderer.renderIncidentOutcome(incident, event.succeeded),
              type: "update-incident",
            };
      }
      case "commentary.cued":
        return {
          payload: this.renderer.renderCommentary(event.message),
          type: "send",
        };
      default:
        return undefined;
    }
  }
}
