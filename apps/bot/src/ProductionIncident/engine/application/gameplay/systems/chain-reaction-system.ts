import type {
	GameEvent,
	GameSession,
	IdGenerator,
	IncidentId,
	Scheduler,
	SessionId,
} from "../../../index.js";
import type {
	Clock,
	RandomSource,
} from "../../../ports/index.js";

const CHAIN_REACTION_DELAY_MS = 5_000;
const MAX_CHAIN_DEPTH = 3;

export class ChainReactionSystem {
	// Depth is active scheduled/executing chain work, not lifetime chain count.
	// It is decremented after execution so long sessions do not permanently lock out chains.
	private readonly activeDepthBySessionId = new Map<
		SessionId,
		number
	>();

	public constructor(
		private readonly clock: Clock,
		private readonly idGenerator: IdGenerator,
		private readonly randomSource: RandomSource,
		private readonly scheduler: Scheduler,
		private readonly generateIncident: (
			sessionId: SessionId,
		) => Promise<void>,
		private readonly isSessionActive: (
			sessionId: SessionId,
		) => boolean,
	) {}

	public clear(sessionId: SessionId): void {
		this.activeDepthBySessionId.delete(sessionId);
	}

	public maybeSchedule(
		sessionId: SessionId,
		sourceIncidentId: IncidentId,
		session: GameSession,
	): GameEvent | undefined {
		const currentDepth =
			this.activeDepthBySessionId.get(sessionId) ?? 0;

		if (
			currentDepth >= MAX_CHAIN_DEPTH ||
			!this.isSessionActive(sessionId)
		) {
			return undefined;
		}

		const instability =
			(100 - session.stats.serverStability) / 100;
		const shouldChain =
			this.randomSource.nextFloat() <
			0.25 + instability * 0.5;

		if (!shouldChain) {
			return undefined;
		}

		const nextDepth = currentDepth + 1;
		this.activeDepthBySessionId.set(sessionId, nextDepth);
		this.scheduler.scheduleOnce(
			CHAIN_REACTION_DELAY_MS,
			() => {
				if (!this.isSessionActive(sessionId)) {
					this.decrementDepth(sessionId);
					return undefined;
				}

				return this.generateIncident(sessionId).finally(
					() => {
						this.decrementDepth(sessionId);
					},
				);
			},
			sessionId,
		);

		return {
			delayMs: CHAIN_REACTION_DELAY_MS,
			depth: nextDepth,
			eventId: this.idGenerator.createEventId(),
			occurredAt: this.clock.now(),
			sessionId,
			sourceIncidentId,
			type: "chainReaction.scheduled",
		};
	}

	private decrementDepth(sessionId: SessionId): void {
		const currentDepth =
			this.activeDepthBySessionId.get(sessionId) ?? 0;

		if (currentDepth <= 1) {
			this.activeDepthBySessionId.delete(sessionId);
			return;
		}

		this.activeDepthBySessionId.set(
			sessionId,
			currentDepth - 1,
		);
	}
}
