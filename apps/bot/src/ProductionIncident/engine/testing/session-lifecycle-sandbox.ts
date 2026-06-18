import type {
	EventId,
	IncidentId,
	PlayerId,
	SessionId,
	TimerId,
	UnixMillis,
} from "../domain/ids.js";
import type { Player } from "../domain/index.js";
import type { GameEvent } from "../events/game-event.js";
import { InMemoryEventBus } from "../events/in-memory-event-bus.js";
import { EngineKernel } from "../index.js";
import type { Clock } from "../ports/clock.js";
import type { IdGenerator } from "../ports/id-generator.js";
import type { RandomSource } from "../ports/random-source.js";
import type {
	ScheduledTask,
	ScheduledTaskHandler,
	Scheduler,
} from "../ports/scheduler.js";

class SandboxClock implements Clock {
	private currentTime: number;

	public constructor(startAt: number) {
		this.currentTime = startAt;
	}

	public advanceBy(milliseconds: number): void {
		this.currentTime += milliseconds;
	}

	public now(): UnixMillis {
		return this.currentTime as UnixMillis;
	}
}

class SandboxIdGenerator implements IdGenerator {
	private eventCounter = 0;
	private sessionCounter = 0;
	private timerCounter = 0;

	public createEventId(): EventId {
		this.eventCounter += 1;
		return `event-${this.eventCounter}` as EventId;
	}

	public createIncidentId(): IncidentId {
		throw new Error(
			"Incident IDs are outside the Phase 1 sandbox.",
		);
	}

	public createPlayerId(sourceId: string): PlayerId {
		return `player-${sourceId}` as PlayerId;
	}

	public createSessionId(): SessionId {
		this.sessionCounter += 1;
		return `session-${this.sessionCounter}` as SessionId;
	}

	public createTimerId(): TimerId {
		this.timerCounter += 1;
		return `timer-${this.timerCounter}` as TimerId;
	}
}

class SandboxRandomSource implements RandomSource {
	public readonly seed = "phase-1-sandbox";

	public nextFloat(): number {
		return 0.5;
	}

	public nextInteger(
		minInclusive: number,
		maxInclusive: number,
	): number {
		void maxInclusive;

		return minInclusive;
	}
}

class SandboxScheduler implements Scheduler {
	private readonly tasks = new Map<
		TimerId,
		ScheduledTask & {
			readonly handler: ScheduledTaskHandler;
		}
	>();

	public cancel(taskId: TimerId): boolean {
		return this.tasks.delete(taskId);
	}

	public cancelBySession(sessionId: SessionId): number {
		let cancelled = 0;

		for (const [taskId, task] of this.tasks) {
			if (task.sessionId === sessionId) {
				this.tasks.delete(taskId);
				cancelled += 1;
			}
		}

		return cancelled;
	}

	public scheduleAt(
		_timestamp: UnixMillis,
		handler: ScheduledTaskHandler,
		sessionId?: SessionId,
	): ScheduledTask {
		return this.store(handler, sessionId);
	}

	public scheduleOnce(
		_delayMs: number,
		handler: ScheduledTaskHandler,
		sessionId?: SessionId,
	): ScheduledTask {
		return this.store(handler, sessionId);
	}

	private store(
		handler: ScheduledTaskHandler,
		sessionId?: SessionId,
	): ScheduledTask {
		const id =
			`sandbox-timer-${this.tasks.size + 1}` as TimerId;
		const task: ScheduledTask & {
			readonly handler: ScheduledTaskHandler;
		} =
			sessionId === undefined
				? { handler, id }
				: { handler, id, sessionId };

		this.tasks.set(id, task);

		return task;
	}
}

function createPlayer(
	idGenerator: IdGenerator,
	sourceId: string,
	displayName: string,
	joinedAt: UnixMillis,
): Player {
	return {
		displayName,
		id: idGenerator.createPlayerId(sourceId),
		joinedAt,
	};
}

function requireOk<TValue>(
	result:
		| {
				readonly error: { readonly message: string };
				readonly ok: false;
		  }
		| { readonly ok: true; readonly result: TValue },
): TValue {
	if (!result.ok) {
		throw new Error(result.error.message);
	}

	return result.result;
}

export async function runSessionLifecycleSandbox(): Promise<
	readonly GameEvent[]
> {
	const clock = new SandboxClock(1_764_000_000_000);
	const eventBus = new InMemoryEventBus();
	const emittedEvents: GameEvent[] = [];

	eventBus.subscribeAll((event) => {
		emittedEvents.push(event);
	});

	const idGenerator = new SandboxIdGenerator();
	const kernel = EngineKernel.createLifecycleKernel({
		clock,
		eventBus,
		idGenerator,
		randomSource: new SandboxRandomSource(),
		scheduler: new SandboxScheduler(),
	});

	const created = requireOk(
		await kernel.sessionManager.createSession({}),
	);
	const sessionId = created.value.id;

	clock.advanceBy(10);
	requireOk(
		await kernel.sessionManager.joinSession({
			player: createPlayer(
				idGenerator,
				"mohammad",
				"Mohammad",
				clock.now(),
			),
			sessionId,
		}),
	);

	clock.advanceBy(10);
	requireOk(
		await kernel.sessionManager.joinSession({
			player: createPlayer(
				idGenerator,
				"ahmed",
				"Ahmed",
				clock.now(),
			),
			sessionId,
		}),
	);

	clock.advanceBy(10);
	requireOk(
		await kernel.sessionManager.startSession({
			firstTickDelayMs: 1_000,
			minimumPlayers: 2,
			sessionId,
		}),
	);

	clock.advanceBy(10);
	requireOk(
		await kernel.sessionManager.endSession({
			reason: "survived",
			sessionId,
		}),
	);

	return emittedEvents;
}

if (
	process.argv[1]?.endsWith(
		"session-lifecycle-sandbox.ts",
	) === true
) {
	const events = await runSessionLifecycleSandbox();
	console.log(JSON.stringify(events, null, 2));
}
