import { Bot } from "./src/app.js";

process.on("unhandledRejection", (reason) => {
	console.error(
		"[FATAL] Unhandled promise rejection:",
		reason,
	);
});

process.on("uncaughtException", (error) => {
	console.error("[FATAL] Uncaught exception:", error);
});

import { botConfig } from "#Config";

if (!botConfig.discord.token) {
	console.error(
		"FATAL: DISCORD.TOKEN environment variable is required.",
	);
	process.exit(1);
}

const bot = new Bot();

bot.initialize();
await bot.login(botConfig.discord.token);
