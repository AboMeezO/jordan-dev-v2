import { randomUUID } from "node:crypto";

import type { Client, Snowflake } from "discord.js";

export type ReminderDelivery = "channel" | "dm";
type FetchedChannel = Awaited<ReturnType<Client["channels"]["fetch"]>>;
type SendableFetchedChannel = Extract<NonNullable<FetchedChannel>, { send: unknown }>;

export interface ReminderRequest {
  readonly userId: Snowflake;
  readonly channelId: Snowflake;
  readonly message: string;
  readonly remindAt: Date;
  readonly delivery: ReminderDelivery;
}

export interface ReminderRecord extends ReminderRequest {
  readonly id: string;
  readonly createdAt: Date;
}

const MAX_TIMEOUT_MS = 2_147_483_647;

export class ReminderService {
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly reminders = new Map<string, ReminderRecord>();

  public constructor(private readonly client: Client) {}

  public schedule(request: ReminderRequest): ReminderRecord {
    const id = randomUUID();
    const record = {
      ...request,
      createdAt: new Date(),
      id,
    };

    this.reminders.set(id, record);
    this.scheduleTimer(record);
    return record;
  }

  public listForUser(userId: Snowflake): readonly ReminderRecord[] {
    return [...this.reminders.values()]
      .filter((reminder) => reminder.userId === userId)
      .sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime());
  }

  public get(id: string): ReminderRecord | undefined {
    return this.reminders.get(id);
  }

  public update(
    id: string,
    updates: Partial<Pick<ReminderRequest, "delivery" | "message" | "remindAt">>,
  ): ReminderRecord | undefined {
    const current = this.reminders.get(id);

    if (!current) {
      return undefined;
    }

    const next = {
      ...current,
      ...updates,
    };

    this.clearTimer(id);
    this.reminders.set(id, next);
    this.scheduleTimer(next);
    return next;
  }

  public cancel(id: string): boolean {
    this.clearTimer(id);
    return this.reminders.delete(id);
  }

  private scheduleTimer(record: ReminderRecord): void {
    const delay = Math.max(0, record.remindAt.getTime() - Date.now());
    const timeout = setTimeout(() => {
      void this.deliver(record.id);
    }, Math.min(delay, MAX_TIMEOUT_MS));

    this.timers.set(record.id, timeout);
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);

    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  private async deliver(id: string): Promise<void> {
    const request = this.reminders.get(id);

    if (!request) {
      return;
    }

    this.timers.delete(id);

    if (request.remindAt.getTime() - Date.now() > MAX_TIMEOUT_MS) {
      this.scheduleTimer(request);
      return;
    }

    this.reminders.delete(id);

    const content = [
      `<@${request.userId}> reminder`,
      "",
      request.message,
    ].join("\n");

    if (request.delivery === "dm") {
      const user = await this.client.users.fetch(request.userId);
      await user.send({ content, allowedMentions: { users: [request.userId] } });
      return;
    }

    const channel = await this.client.channels.fetch(request.channelId);

    if (!isSendableTextChannel(channel)) {
      const user = await this.client.users.fetch(request.userId);
      await user.send({ content, allowedMentions: { users: [request.userId] } });
      return;
    }

    await channel.send({ content, allowedMentions: { users: [request.userId] } });
  }
}

function isSendableTextChannel(channel: FetchedChannel): channel is SendableFetchedChannel {
  return Boolean(channel && "send" in channel);
}
