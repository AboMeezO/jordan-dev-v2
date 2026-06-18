import { strict as assert } from "node:assert";

import {
	type Clock,
	type EngineCommandResult,
	EngineKernel,
	type EventId,
	type GameEvent,
	type GameEventType,
	type GameSession,
	type IdGenerator,
	type IncidentId,
	InMemoryEventBus,
	type Player,
	type PlayerId,
	type RandomSource,
	type ScheduledTask,
	type ScheduledTaskHandler,
	type Scheduler,
	type SessionId,
	type SessionState,
	type TimerId,
	type UnixMillis,
} from "../../engine/index.js";

export class TestClock implements Clock {
	private currentTime: number;

	public constructor(startAt: number = 1_764_000_000_000) {
		this.currentTime = startAt;
	}

	public advanceBy(milliseconds: number): void {
		this.currentTime += milliseconds;
	}

	public now(): UnixMillis {
		return this.currentTime as UnixMillis;
	}
}

export class TestIdGenerator implements IdGenerator {
	private eventCounter = 0;
	private incidentCounter = 0;
	private sessionCounter = 0;
	private timerCounter = 0;

	public createEventId(): EventId {
		this.eventCounter += 1;
		return `event-${this.eventCounter}` as EventId;
	}

	public createIncidentId(): IncidentId {
		this.incidentCounter += 1;
		return `incident-${this.incidentCounter}` as IncidentId;
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

export class SeededRandomSource implements RandomSource {
	private state: number;

	public constructor(public readonly seed: string) {
		this.state = hashSeed(seed);
	}

	public nextFloat(): number {
		this.state =
			(1_664_525 * this.state + 1_013_904_223) >>> 0;
		return this.state / 0x1_0000_0000;
	}

	public nextInteger(
		minInclusive: number,
		maxInclusive: number,
	): number {
		const range = maxInclusive - minInclusive + 1;
		return (
			minInclusive + Math.floor(this.nextFloat() * range)
		);
	}
}

export interface RecordedScheduledTask extends ScheduledTask {
	readonly delayMs?: number;
	readonly handler: ScheduledTaskHandler;
	readonly timestamp?: UnixMillis;
}

export class RecordingScheduler implements Scheduler {
	private counter = 0;
	private readonly tasks = new Map<
		TimerId,
		RecordedScheduledTask
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

	public get activeTasks(): readonly RecordedScheduledTask[] {
		return [...this.tasks.values()];
	}

	public scheduleAt(
		timestamp: UnixMillis,
		handler: ScheduledTaskHandler,
		sessionId?: SessionId,
	): ScheduledTask {
		return this.store(
			sessionId === undefined
				? { handler, timestamp }
				: { handler, sessionId, timestamp },
		);
	}

	public scheduleOnce(
		delayMs: number,
		handler: ScheduledTaskHandler,
		sessionId?: SessionId,
	): ScheduledTask {
		return this.store(
			sessionId === undefined
				? { delayMs, handler }
				: { delayMs, handler, sessionId },
		);
	}

	private store(
		task: Omit<RecordedScheduledTask, "id">,
	): RecordedScheduledTask {
		this.counter += 1;
		const recordedTask: RecordedScheduledTask = {
			...task,
			id: `timer-${this.counter}` as TimerId,
		};

		this.tasks.set(recordedTask.id, recordedTask);
		return recordedTask;
	}
}

export interface Phase1Harness {
	readonly clock: TestClock;
	readonly events: readonly GameEvent[];
	readonly idGenerator: TestIdGenerator;
	readonly kernel: EngineKernel;
	readonly scheduler: RecordingScheduler;
}

export function createPhase1Harness(
	seed = "phase-1-test",
): Phase1Harness {
	const clock = new TestClock();
	const eventBus = new InMemoryEventBus();
	const events: GameEvent[] = [];
	const idGenerator = new TestIdGenerator();
	const scheduler = new RecordingScheduler();

	eventBus.subscribeAll((event) => {
		events.push(event);
	});

	const kernel = EngineKernel.createLifecycleKernel({
		clock,
		eventBus,
		idGenerator,
		randomSource: new SeededRandomSource(seed),
		scheduler,
	});

	return {
		clock,
		events,
		idGenerator,
		kernel,
		scheduler,
	};
}

export function createPlayer(
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

export function requireOk<TValue>(
	result: EngineCommandResult<TValue>,
): {
	readonly events: readonly GameEvent[];
	readonly value: TValue;
} {
	assert.equal(
		result.ok,
		true,
		result.ok ? undefined : result.error.message,
	);
	return result.result;
}

export function requireFailure<TValue>(
	result: EngineCommandResult<TValue>,
): Exclude<
	EngineCommandResult<TValue>,
	{ readonly ok: true }
>["error"] {
	assert.equal(
		result.ok,
		false,
		"Expected command to fail.",
	);
	return result.error;
}

export function assertEventTypes(
	events: readonly GameEvent[],
	expectedTypes: readonly GameEventType[],
): void {
	assert.deepEqual(
		events.map((event) => event.type),
		expectedTypes,
	);
}

export function assertSessionStatus<
	TStatus extends GameSession["state"]["status"],
>(
	session: GameSession | undefined,
	expectedStatus: TStatus,
): asserts session is GameSession & {
	readonly state: Extract<
		SessionState,
		{ readonly status: TStatus }
	>;
} {
	if (session === undefined) {
		assert.fail(
			`Expected session status ${expectedStatus}, but session was undefined.`,
		);
	}

	assert.equal(session.state.status, expectedStatus);
}

function hashSeed(seed: string): number {
	let hash = 2_166_136_261;

	for (const character of seed) {
		hash ^= character.charCodeAt(0);
		hash = Math.imul(hash, 16_777_619);
	}

	return hash >>> 0;
}
