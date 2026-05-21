import "dotenv/config";

import { Bot } from "./src/app.js";

const bot = new Bot();

bot.initialize();
await bot.login(process.env.TOKEN!);
