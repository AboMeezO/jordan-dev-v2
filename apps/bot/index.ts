import { resolve } from "node:path";

import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "../../.env") });
config({ path: resolve(import.meta.dirname, ".env") });
config({ path: resolve(import.meta.dirname, ".env.local"), override: true });

process.on("unhandledRejection", (reason) => {
	console.error("[FATAL] Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
	console.error("[FATAL] Uncaught exception:", error);
});

import { Bot } from "./src/app.js";

const token = process.env.TOKEN;

if (!token) {
	console.error("FATAL: TOKEN environment variable is required.");
	process.exit(1);
}

const bot = new Bot();

bot.initialize();
await bot.login(token);
