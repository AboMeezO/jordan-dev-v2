import type {
  ActionId,
  GameplayManager,
  IncidentId,
  PlayerId,
  SessionId,
} from "../../engine/index.js";

export interface DiscordVoteInteractionDto {
  readonly customId: string;
  readonly userId: string;
}

export class DiscordInteractionRouter {
  public constructor(private readonly gameplayManager: GameplayManager) {}

  public async handleVoteInteraction(
    interaction: DiscordVoteInteractionDto,
  ): Promise<void> {
    const command = this.decodeVoteCustomId(interaction.customId, interaction.userId);
    await this.gameplayManager.submitVote(command);
  }

  public decodeVoteCustomId(
    customId: string,
    userId: string,
  ): {
    readonly actionId: ActionId;
    readonly incidentId: IncidentId;
    readonly playerId: PlayerId;
    readonly sessionId: SessionId;
  } {
    const parts = customId.split(":");

    if (parts.length !== 5 || parts[0] !== "pi" || parts[1] !== "vote") {
      throw new Error("Invalid Production Incident vote custom ID.");
    }

    const [, , sessionId, incidentId, actionId] = parts;

    if (
      sessionId === undefined ||
      incidentId === undefined ||
      actionId === undefined
    ) {
      throw new Error("Vote custom ID is missing required identifiers.");
    }

    return {
      actionId: actionId as ActionId,
      incidentId: incidentId as IncidentId,
      playerId: `player-${userId}` as PlayerId,
      sessionId: sessionId as SessionId,
    };
  }
}
