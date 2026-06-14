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

const MAX_TIMEOUT_MS = 2_147_483_647;

export class ReminderService {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  public constructor(private readonly client: Client) {}

  public schedule(request: ReminderRequest): string {
    const id = randomUUID();
    const delay = Math.max(0, request.remindAt.getTime() - Date.now());
    const timeout = setTimeout(() => {
      void this.deliver(id, request);
    }, Math.min(delay, MAX_TIMEOUT_MS));

    this.timers.set(id, timeout);
    return id;
  }

  private async deliver(id: string, request: ReminderRequest): Promise<void> {
    this.timers.delete(id);

    if (request.remindAt.getTime() - Date.now() > MAX_TIMEOUT_MS) {
      this.schedule(request);
      return;
    }

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
