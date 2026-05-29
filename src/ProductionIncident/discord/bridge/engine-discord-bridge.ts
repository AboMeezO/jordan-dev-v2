import type { GameEvent, GameplayManager, StateManager } from "../../engine/index.js";
import {
  type DiscordActionRouteKey,
  DiscordCustomIdCodec,
} from "../interactions/discord-custom-id-codec.js";
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
  private readonly customIdCodec = new DiscordCustomIdCodec();
  private readonly renderer = new DiscordIncidentRenderer();

  public constructor(
    private readonly stateManager: StateManager,
    private readonly gameplayManager: GameplayManager,
  ) {}

  public async voteSubmitted(customId: string, userId: string): Promise<void> {
    const decoded = this.customIdCodec.decodeVote(customId);

    await this.gameplayManager.submitVote({
      actionId: decoded.actionId,
      incidentId: decoded.incidentId,
      playerId: this.customIdCodec.playerIdFromDiscordUserId(userId),
      sessionId: decoded.sessionId,
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
            ? session.state.incidentHistory.get(event.incidentId)
            : undefined;

        return incident === undefined
          ? undefined
          : {
              payload: this.renderer.renderIncidentPrompt(
                incident,
                () => this.customIdCodec.encodeAction({ key: "a1" as DiscordActionRouteKey }),
                () => this.customIdCodec.encodeInstant({ key: "i1" as DiscordActionRouteKey }),
              ),
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
