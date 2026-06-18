import type {
	GameEvent,
	GameSession,
	IdGenerator,
	SessionId,
} from "../../../index.js";
import type { Clock } from "../../../ports/index.js";

export class EscalationDirector {
	private readonly escalationLevelBySessionId = new Map<
		SessionId,
		number
	>();

	public constructor(
		private readonly clock: Clock,
		private readonly idGenerator: IdGenerator,
	) {}

	public clear(sessionId: SessionId): void {
		this.escalationLevelBySessionId.delete(sessionId);
	}

	public getLevel(sessionId: SessionId): number {
		return (
			this.escalationLevelBySessionId.get(sessionId) ?? 0
		);
	}

	public nextIncidentDelayMs(sessionId: SessionId): number {
		const level = this.getLevel(sessionId);
		return Math.max(8_000, 25_000 - level * 3_000);
	}

	public escalateIfNeeded(
		sessionId: SessionId,
		session: GameSession,
	): readonly GameEvent[] {
		const currentLevel = this.getLevel(sessionId);
		const pressure =
			100 -
			session.stats.serverStability +
			(100 - session.stats.userHappiness) +
			Math.max(0, 50 - session.stats.developerSanity) +
			session.stats.infrastructureCost / 2;
		const nextLevel = Math.min(
			5,
			Math.floor(pressure / 45),
		);

		if (nextLevel <= currentLevel) {
			return [];
		}

		this.escalationLevelBySessionId.set(
			sessionId,
			nextLevel,
		);
		return [
			{
				currentLevel: nextLevel,
				eventId: this.idGenerator.createEventId(),
				occurredAt: this.clock.now(),
				previousLevel: currentLevel,
				reason: "stat-threshold",
				sessionId,
				type: "escalation.updated",
			},
		];
	}
}
