import type {
	ActionId,
	IncidentId,
	PlayerId,
	SessionId,
} from "../domain/ids.js";
import type {
	GameSession,
	Incident,
} from "../domain/index.js";
import type { GameEvent } from "../events/game-event.js";
import type { EngineCommandResult } from "./session-manager.js";

export interface GenerateIncidentInput {
	readonly sessionId: SessionId;
}

export interface SubmitVoteInput {
	readonly actionId: ActionId;
	readonly incidentId: IncidentId;
	readonly playerId: PlayerId;
	readonly sessionId: SessionId;
}

export interface UseInstantActionInput {
	readonly actionId: ActionId;
	readonly incidentId: IncidentId;
	readonly playerId: PlayerId;
	readonly sessionId: SessionId;
}

export interface InstantActionResult {
	readonly message: string;
}

export interface CloseVoteInput {
	readonly incidentId: IncidentId;
	readonly sessionId: SessionId;
}

export interface GameplayMutation {
	readonly events: readonly GameEvent[];
	readonly session: GameSession;
}

export interface GameplayManager {
	closeVote(
		input: CloseVoteInput,
	): Promise<EngineCommandResult<GameplayMutation>>;
	generateIncident(
		input: GenerateIncidentInput,
	): Promise<EngineCommandResult<Incident>>;
	submitVote(
		input: SubmitVoteInput,
	): Promise<EngineCommandResult<GameSession>>;
	useInstantAction(
		input: UseInstantActionInput,
	): Promise<EngineCommandResult<InstantActionResult>>;
}
