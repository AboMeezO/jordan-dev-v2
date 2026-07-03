import type { Client, Message } from "discord.js";

export class AiContext<T extends Record<string, unknown> = Record<string, unknown>> {
	public params!: T;
	public message!: Message;
	public client!: Client;
	public store = new Map<any, any>();

	public constructor(options: {
		message: Message;
		params: T;
		client: Client;
	}) {
		this.params = options.params;
		this.message = options.message;
		this.client = options.client;
	}

	public setParams(params: T): void {
		this.params = params;
	}
}
