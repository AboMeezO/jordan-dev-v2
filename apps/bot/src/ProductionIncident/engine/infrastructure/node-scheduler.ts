import type {
	ScheduledTask,
	ScheduledTaskHandler,
	Scheduler,
	SessionId,
	TimerId,
	UnixMillis,
} from "../index.js";

export class NodeScheduler implements Scheduler {
	private counter = 0;
	private readonly timeouts = new Map<
		TimerId,
		NodeJS.Timeout
	>();
	private readonly tasks = new Map<
		TimerId,
		ScheduledTask
	>();

	public cancel(taskId: TimerId): boolean {
		const timeout = this.timeouts.get(taskId);

		if (timeout === undefined) {
			return false;
		}

		clearTimeout(timeout);
		this.timeouts.delete(taskId);
		this.tasks.delete(taskId);
		return true;
	}

	public cancelBySession(sessionId: SessionId): number {
		let cancelled = 0;

		for (const task of this.tasks.values()) {
			if (
				task.sessionId === sessionId &&
				this.cancel(task.id)
			) {
				cancelled += 1;
			}
		}

		return cancelled;
	}

	public scheduleAt(
		timestamp: UnixMillis,
		handler: ScheduledTaskHandler,
		sessionId?: SessionId,
	): ScheduledTask {
		return this.scheduleOnce(
			Math.max(0, timestamp - Date.now()),
			handler,
			sessionId,
		);
	}

	public scheduleOnce(
		delayMs: number,
		handler: ScheduledTaskHandler,
		sessionId?: SessionId,
	): ScheduledTask {
		this.counter += 1;
		const task =
			sessionId === undefined
				? { id: `timer-${this.counter}` as TimerId }
				: {
						id: `timer-${this.counter}` as TimerId,
						sessionId,
					};
		const timeout = setTimeout(() => {
			this.timeouts.delete(task.id);
			this.tasks.delete(task.id);
			void Promise.resolve(handler()).catch(
				() => undefined,
			);
		}, delayMs);

		this.timeouts.set(task.id, timeout);
		this.tasks.set(task.id, task);
		return task;
	}
}
