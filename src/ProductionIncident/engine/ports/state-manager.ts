import type { IncidentId, PlayerId, SessionId, UnixMillis } from "../domain/ids.js";
import type { Incident } from "../domain/incident.js";
import type {
  GameSession,
  Player,
  SessionEndReason,
  StatDelta,
  Vote,
} from "../domain/index.js";
import type { GameEvent } from "../events/game-event.js";

export interface StateMutationResult<TValue> {
  readonly events: readonly GameEvent[];
  readonly value: TValue;
}

export interface StateManager {
  addIncident(
    sessionId: SessionId,
    incident: Incident,
  ): Promise<StateMutationResult<GameSession>>;
  applyStatDelta(
    sessionId: SessionId,
    delta: StatDelta,
  ): Promise<StateMutationResult<GameSession>>;
  closeVoteWindow(
    sessionId: SessionId,
    incidentId: IncidentId,
  ): Promise<StateMutationResult<GameSession>>;
  createSession(
    sessionId: SessionId,
    players: readonly Player[],
    createdAt: UnixMillis,
  ): Promise<StateMutationResult<GameSession>>;
  endSession(
    sessionId: SessionId,
    reason: SessionEndReason,
    endedAt: UnixMillis,
  ): Promise<StateMutationResult<GameSession>>;
  getSnapshot(sessionId: SessionId): GameSession | undefined;
  joinSession(
    sessionId: SessionId,
    player: Player,
  ): Promise<StateMutationResult<GameSession>>;
  removeIncident(
    sessionId: SessionId,
    incidentId: IncidentId,
  ): Promise<StateMutationResult<GameSession>>;
  removePlayer(
    sessionId: SessionId,
    playerId: PlayerId,
  ): Promise<StateMutationResult<GameSession>>;
  replaceIncident(
    sessionId: SessionId,
    incident: Incident,
  ): Promise<StateMutationResult<GameSession>>;
  upsertVote(
    sessionId: SessionId,
    vote: Vote,
  ): Promise<StateMutationResult<GameSession>>;
  startSession(
    sessionId: SessionId,
    startedAt: UnixMillis,
  ): Promise<StateMutationResult<GameSession>>;
}
