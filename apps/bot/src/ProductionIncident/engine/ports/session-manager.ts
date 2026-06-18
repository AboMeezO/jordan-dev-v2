import type { PlayerId, SessionId } from "../domain/ids.js";
import type {
	GameSession,
	Player,
	SessionEndReason,
} from "../domain/index.js";
import type { GameEvent } from "../events/game-event.js";

export interface CreateSessionInput {
	readonly initialPlayers?: readonly Player[];
	readonly minimumPlayers?: number;
}

export interface JoinSessionInput {
	readonly player: Player;
	readonly sessionId: SessionId;
}

export interface EndSessionInput {
	readonly reason: SessionEndReason;
	readonly sessionId: SessionId;
}

export interface StartSessionInput {
	readonly firstTickDelayMs?: number;
	readonly minimumPlayers?: number;
	readonly sessionId: SessionId;
}

export type SessionLifecycleErrorCode =
	| "duplicate-player"
	| "invalid-session-state"
	| "minimum-players-not-met"
	| "session-not-found";

export interface SessionLifecycleError {
	readonly code: SessionLifecycleErrorCode;
	readonly message: string;
	readonly sessionId?: SessionId;
}

export interface EngineMutationResult<TValue> {
	readonly events: readonly GameEvent[];
	readonly value: TValue;
}

export type EngineCommandResult<TValue> =
	| {
			readonly error: SessionLifecycleError;
			readonly ok: false;
	  }
	| {
			readonly ok: true;
			readonly result: EngineMutationResult<TValue>;
	  };

export interface SessionManager {
	cancelSession(
		sessionId: SessionId,
	): Promise<EngineCommandResult<GameSession>>;
	createSession(
		input: CreateSessionInput,
	): Promise<EngineCommandResult<GameSession>>;
	endSession(
		input: EndSessionInput,
	): Promise<EngineCommandResult<GameSession>>;
	getSession(sessionId: SessionId): GameSession | undefined;
	joinSession(
		input: JoinSessionInput,
	): Promise<EngineCommandResult<GameSession>>;
	removePlayer(
		sessionId: SessionId,
		playerId: PlayerId,
	): Promise<EngineCommandResult<GameSession>>;
	startSession(
		input: StartSessionInput,
	): Promise<EngineCommandResult<GameSession>>;
}
