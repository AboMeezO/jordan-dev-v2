import type { Client, Snowflake } from "discord.js";

import {
  type ReminderDelivery,
  type ReminderRecord,
} from "./reminder-service.js";
import { getReminderService } from "./reminder-store.js";
import { parseReminderTime } from "./reminder-time.js";

export interface ReminderCommandInput {
  readonly client: Client;
  readonly userId: Snowflake;
  readonly channelId: Snowflake;
  readonly time: string;
  readonly message: string;
  readonly delivery: ReminderDelivery;
}

export interface ReminderCommandResult {
  readonly id: string;
  readonly remindAt: Date;
  readonly delivery: ReminderDelivery;
}

export function normalizeReminderDelivery(
  value: string | null | undefined,
): ReminderDelivery {
  return value === "dm" ? "dm" : "channel";
}

export function parsePrefixReminderArgs(args: readonly string[]): {
  readonly delivery: ReminderDelivery;
  readonly message: string;
  readonly time: string | undefined;
} {
  const remaining = [...args];
  const delivery =
    remaining[0] === "--dm" || remaining[0]?.toLowerCase() === "dm"
      ? "dm"
      : "channel";

  if (delivery === "dm") {
    remaining.shift();
  }

  const time = extractTimeInput(remaining);

  return {
    delivery,
    message: remaining.join(" ").trim(),
    time,
  };
}

export async function scheduleReminder(
  input: ReminderCommandInput,
): Promise<ReminderCommandResult> {
  const parsedTime = parseReminderTime(input.time);

  if (!parsedTime) {
    throw new Error(
      "Use a future time like `10m`, `in 2 hours`, `2026-06-15T09:30:00`, or `09:30`.",
    );
  }

  const record = await getReminderService(input.client).schedule({
    userId: input.userId,
    channelId: input.channelId,
    message: input.message,
    remindAt: parsedTime.date,
    delivery: input.delivery,
  });

  return {
    delivery: record.delivery,
    id: record.id,
    remindAt: record.remindAt,
  };
}

export function listUserReminders(
  client: Client,
  userId: Snowflake,
): Promise<readonly ReminderRecord[]> {
  return getReminderService(client).listForUser(userId);
}

export async function updateReminderTime(
  client: Client,
  reminderId: string,
  time: string,
): Promise<ReminderRecord | undefined> {
  const parsedTime = parseReminderTime(time);

  if (!parsedTime) {
    throw new Error(
      "Use a future time like `10m`, `in 2 hours`, `2026-06-15T09:30:00`, or `09:30`.",
    );
  }

  return getReminderService(client).update(reminderId, {
    remindAt: parsedTime.date,
  });
}

export function updateReminderMessage(
  client: Client,
  reminderId: string,
  message: string,
): Promise<ReminderRecord | undefined> {
  return getReminderService(client).update(reminderId, { message });
}

export async function toggleReminderDelivery(
  client: Client,
  reminderId: string,
): Promise<ReminderRecord | undefined> {
  const service = getReminderService(client);
  const reminder = await service.get(reminderId);

  if (!reminder) {
    return undefined;
  }

  return service.update(reminderId, {
    delivery: reminder.delivery === "dm" ? "channel" : "dm",
  });
}

export function cancelReminder(client: Client, reminderId: string): Promise<boolean> {
  return getReminderService(client).cancel(reminderId);
}

function extractTimeInput(args: string[]): string | undefined {
  const first = args.shift();

  if (!first) {
    return undefined;
  }

  if (/^(?:in|after)$/i.test(first) && args[0]) {
    return `${first} ${args.shift()}`;
  }

  return first;
}
