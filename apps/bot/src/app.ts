import { CommandKit } from "commandkit";
import { Client, GatewayIntentBits } from "discord.js";
import path from "path";

import { Logger } from "#Logger";
import { migrateAuditSchema } from "#AuditLog";
import { validateConfig } from "#Config";

const log = new Logger("bot");

export class Bot {
	private client: Client;

	constructor() {
		this.client = new Client({
			intents: Object.values(GatewayIntentBits).filter(
				(intent): intent is GatewayIntentBits =>
					typeof intent === "number",
			),
		});
	}

	public initialize(): void {
		validateConfig();

		migrateAuditSchema().catch((error) => {
			log.error("Audit schema migration failed:", error);
		});

		new CommandKit({
			// @ts-expect-error - discord.js ESM/CJS type mismatch in NodeNext
			client: this.client,
			commandsPath: path.resolve("src/Commands"),
			eventsPath: path.resolve("src/Events"),
			validationsPath: path.resolve("src/Validations"),
			devGuildIds: [process.env.DEV_GUILD_ID!],
			bulkRegister: true,
		});
	}

	public async login(token: string): Promise<void> {
		await this.client.login(token);
	}

	public getClient(): Client {
		return this.client;
	}
}
