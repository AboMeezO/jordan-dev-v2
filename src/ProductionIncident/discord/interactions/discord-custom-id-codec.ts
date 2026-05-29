import type {
  ActionId,
  IncidentId,
  PlayerId,
  SessionId,
} from "../../engine/index.js";

const CUSTOM_ID_NAMESPACE = "pi";
const CUSTOM_ID_VERSION = "v1";

export interface DecodedDiscordVoteCustomId {
  readonly actionId: ActionId;
  readonly incidentId: IncidentId;
  readonly kind: "vote";
  readonly sessionId: SessionId;
  readonly version: typeof CUSTOM_ID_VERSION;
}

export type DiscordLobbyAction = "cancel" | "join" | "start";

export interface DecodedDiscordLobbyCustomId {
  readonly action: DiscordLobbyAction;
  readonly kind: "lobby";
  readonly sessionId: SessionId;
  readonly version: typeof CUSTOM_ID_VERSION;
}

export class DiscordCustomIdCodec {
  public decodeLobby(customId: string): DecodedDiscordLobbyCustomId {
    const parts = customId.split(":");

    if (
      parts.length !== 5 ||
      parts[0] !== CUSTOM_ID_NAMESPACE ||
      parts[1] !== CUSTOM_ID_VERSION ||
      parts[2] !== "lobby"
    ) {
      throw new Error("Invalid Production Incident lobby custom ID.");
    }

    const [, version, kind, sessionId, action] = parts;

    if (
      version !== CUSTOM_ID_VERSION ||
      kind !== "lobby" ||
      sessionId === undefined ||
      sessionId.length === 0 ||
      !isLobbyAction(action)
    ) {
      throw new Error("Lobby custom ID is missing required identifiers.");
    }

    return {
      action,
      kind,
      sessionId: sessionId as SessionId,
      version,
    };
  }

  public decodeVote(customId: string): DecodedDiscordVoteCustomId {
    const parts = customId.split(":");

    if (
      parts.length !== 6 ||
      parts[0] !== CUSTOM_ID_NAMESPACE ||
      parts[1] !== CUSTOM_ID_VERSION ||
      parts[2] !== "vote"
    ) {
      throw new Error("Invalid Production Incident vote custom ID.");
    }

    const [, version, kind, sessionId, incidentId, actionId] = parts;

    if (
      version !== CUSTOM_ID_VERSION ||
      kind !== "vote" ||
      sessionId === undefined ||
      sessionId.length === 0 ||
      incidentId === undefined ||
      incidentId.length === 0 ||
      actionId === undefined ||
      actionId.length === 0
    ) {
      throw new Error("Vote custom ID is missing required identifiers.");
    }

    return {
      actionId: actionId as ActionId,
      incidentId: incidentId as IncidentId,
      kind,
      sessionId: sessionId as SessionId,
      version,
    };
  }

  public encodeVote(input: {
    readonly actionId: ActionId;
    readonly incidentId: IncidentId;
    readonly sessionId: SessionId;
  }): string {
    return [
      CUSTOM_ID_NAMESPACE,
      CUSTOM_ID_VERSION,
      "vote",
      input.sessionId,
      input.incidentId,
      input.actionId,
    ].join(":");
  }

  public encodeLobby(input: {
    readonly action: DiscordLobbyAction;
    readonly sessionId: SessionId;
  }): string {
    return [
      CUSTOM_ID_NAMESPACE,
      CUSTOM_ID_VERSION,
      "lobby",
      input.sessionId,
      input.action,
    ].join(":");
  }

  public playerIdFromDiscordUserId(userId: string): PlayerId {
    if (userId.trim().length === 0) {
      throw new Error("Discord user ID must not be empty.");
    }

    return `player-${userId}` as PlayerId;
  }
}

function isLobbyAction(value: string | undefined): value is DiscordLobbyAction {
  return value === "cancel" || value === "join" || value === "start";
}
