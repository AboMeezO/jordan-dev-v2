import type { Message } from "discord.js";

const LOVE_YOU_PATTERN = /\blove\s+(?:you|u)\b/i;
const LOVE_REPLIES = [
  "Love you too babe",
  "Love you more",
  "Always, babe",
  "Right back at you",
  "You know I do",
] as const;

export default async function (message: Message): Promise<void> {
  if (message.author.bot) {
    return;
  }

  if (!LOVE_YOU_PATTERN.test(message.content)) {
    return;
  }

  await message.reply(randomLoveReply());
}

function randomLoveReply(): string {
  return LOVE_REPLIES[Math.floor(Math.random() * LOVE_REPLIES.length)] ?? LOVE_REPLIES[0];
}
