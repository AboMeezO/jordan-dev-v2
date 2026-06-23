import { randomUUID } from "node:crypto";

import type { Client, Snowflake } from "discord.js";

import { getDatabase } from "#Database";

import { ReminderRepository } from "./reminder-repository.js";

export type ReminderDelivery = "channel" | "dm";
type FetchedChannel = Awaited<
	ReturnType<Client["channels"]["fetch"]>
>;
type SendableFetchedChannel = Extract<
	NonNullable<FetchedChannel>,
	{ send: unknown }
>;

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
	private readonly timers = new Map<
		string,
		NodeJS.Timeout
	>();
	private readonly reminders = new Map<
		string,
		ReminderRecord
	>();
	private readonly repositoryPromise: Promise<ReminderRepository>;
	private initialized = false;

	public constructor(private readonly client: Client) {
		this.repositoryPromise = getDatabase().then(
			async (database) => {
				const repository = new ReminderRepository(database);
				await repository.migrate();
				return repository;
			},
		);
	}

	public async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		const repository = await this.repositoryPromise;
		await repository.resetInterruptedDeliveries();

		for (const reminder of await repository.listPending()) {
			this.reminders.set(reminder.id, reminder);
			this.scheduleTimer(reminder);
		}

		this.initialized = true;
	}

	public async schedule(
		request: ReminderRequest,
	): Promise<ReminderRecord> {
		await this.initialize();

		const id = randomUUID();
		const record = {
			...request,
			createdAt: new Date(),
			id,
		};

		const repository = await this.repositoryPromise;
		await repository.create(record);
		this.reminders.set(id, record);
		this.scheduleTimer(record);
		return record;
	}

	public async listForUser(
		userId: Snowflake,
	): Promise<readonly ReminderRecord[]> {
		await this.initialize();
		const repository = await this.repositoryPromise;
		return repository.listForUser(userId);
	}

	public async get(
		id: string,
	): Promise<ReminderRecord | undefined> {
		await this.initialize();
		const repository = await this.repositoryPromise;
		return repository.get(id);
	}

	public async update(
		id: string,
		updates: Partial<
			Pick<
				ReminderRequest,
				"channelId" | "delivery" | "message" | "remindAt"
			>
		>,
	): Promise<ReminderRecord | undefined> {
		await this.initialize();
		const repository = await this.repositoryPromise;
		const next = await repository.update(id, updates);

		if (!next) {
			return undefined;
		}

		this.clearTimer(id);
		this.reminders.set(id, next);
		this.scheduleTimer(next);
		return next;
	}

	public async cancel(id: string): Promise<boolean> {
		await this.initialize();
		const repository = await this.repositoryPromise;
		const canceled = await repository.cancel(id);

		if (!canceled) {
			return false;
		}

		this.clearTimer(id);
		this.reminders.delete(id);
		return true;
	}

	private scheduleTimer(record: ReminderRecord): void {
		const delay = Math.max(
			0,
			record.remindAt.getTime() - Date.now(),
		);
		const timeout = setTimeout(
			() => {
				void this.deliver(record.id);
			},
			Math.min(delay, MAX_TIMEOUT_MS),
		);

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
		const repository = await this.repositoryPromise;
		const request = await repository.markDelivering(id);

		if (!request) {
			return;
		}

		this.timers.delete(id);

		if (
			request.remindAt.getTime() - Date.now() >
			MAX_TIMEOUT_MS
		) {
			this.scheduleTimer(request);
			return;
		}

		try {
			this.reminders.delete(id);
			await this.sendReminder(request);
			await repository.markDelivered(id);
		} catch (error) {
			await repository.markFailed(
				id,
				error instanceof Error
					? error.message
					: "Unknown reminder delivery failure.",
			);
		}
	}

	private async sendReminder(
		request: ReminderRecord,
	): Promise<void> {
		const content = [
			`<@${request.userId}> reminder`,
			"",
			request.message,
		].join("\n");

		if (request.delivery === "dm") {
			const user = await this.client.users.fetch(
				request.userId,
			);
			await user.send({
				content,
				allowedMentions: { users: [request.userId] },
			});
			return;
		}

		const channel = await this.client.channels.fetch(
			request.channelId,
		);

		if (!isSendableTextChannel(channel)) {
			const user = await this.client.users.fetch(
				request.userId,
			);
			await user.send({
				content,
				allowedMentions: { users: [request.userId] },
			});
			return;
		}

		await channel.send({
			content,
			allowedMentions: { users: [request.userId] },
		});
	}
}

function isSendableTextChannel(
	channel: FetchedChannel,
): channel is SendableFetchedChannel {
	return Boolean(channel && "send" in channel);
}
