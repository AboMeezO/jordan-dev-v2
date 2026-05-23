import type { SessionId, TimerId, UnixMillis } from "../domain/ids.js";

export interface ScheduledTask {
  readonly id: TimerId;
  readonly sessionId?: SessionId;
}

export type ScheduledTaskHandler = () => void | Promise<void>;

export interface Scheduler {
  cancel(taskId: TimerId): boolean;
  cancelBySession(sessionId: SessionId): number;
  scheduleAt(
    timestamp: UnixMillis,
    handler: ScheduledTaskHandler,
    sessionId?: SessionId,
  ): ScheduledTask;
  scheduleOnce(
    delayMs: number,
    handler: ScheduledTaskHandler,
    sessionId?: SessionId,
  ): ScheduledTask;
}

