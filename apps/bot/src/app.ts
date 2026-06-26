import { createRequire } from "node:module";

import { CommandKit } from "commandkit";
import type * as DiscordJs from "discord.js" with { "resolution-mode": "require" };
import path from "path";

import { migrateAuditSchema } from "#AuditLog";
import { validateConfig } from "#Config";
import { Logger } from "#Logger";

const log = new Logger("bot");
const require = createRequire(import.meta.url);
const { Client, GatewayIntentBits } = require(
	"discord.js",
) as typeof DiscordJs;

export class Bot {
	private client: DiscordJs.Client;

	constructor() {
		this.client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.DirectMessages,
				GatewayIntentBits.GuildMembers,
			],
		});
	}

	public initialize(): void {
		validateConfig();

		migrateAuditSchema().catch((error) => {
			log.error("Audit schema migration failed:", error);
		});

		new CommandKit({
			client: this.client,
			commandsPath: path.resolve("src/Commands/SlashCommands"),
			eventsPath: path.resolve("src/Events"),
			devGuildIds: process.env.DEV_GUILD_ID
				? [process.env.DEV_GUILD_ID]
				: [],
			bulkRegister: true,
		});
	}

	public async login(token: string): Promise<void> {
		await this.client.login(token);
	}

	public getClient(): DiscordJs.Client {
		return this.client;
	}
}
