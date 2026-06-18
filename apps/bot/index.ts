import { resolve } from "node:path";

import { config } from "dotenv";

config({ path: resolve(import.meta.dirname, "../../.env") });
config({ path: resolve(import.meta.dirname, ".env") });
config({ path: resolve(import.meta.dirname, ".env.local"), override: true });

import { Bot } from "./src/app.js";

const bot = new Bot();

bot.initialize();
await bot.login(process.env.TOKEN!);
