import type { Message } from "discord.js";

const LOVE_YOU_PATTERN = /\blove\s+(?:you|u)\b/i;
const LOVE_REPLIES = [
	"Love you too babe",
	"Love you more",
	"Always, babe",
	"Right back at you",
	"You know I do",
] as const;

const LOVE_COOLDOWN_MS = 30_000;
const loveCooldowns = new Map<string, number>();

export default async function (
	message: Message,
): Promise<void> {
	if (message.author.bot) {
		return;
	}

	if (!LOVE_YOU_PATTERN.test(message.content)) {
		return;
	}

	const userId = message.author.id;
	const now = Date.now();
	const lastUsed = loveCooldowns.get(userId);

	if (lastUsed && now - lastUsed < LOVE_COOLDOWN_MS) {
		return;
	}

	loveCooldowns.set(userId, now);
	cleanupCooldowns(now);

	await message.reply(randomLoveReply());
}

function cleanupCooldowns(now: number): void {
	const threshold = now - LOVE_COOLDOWN_MS;
	for (const [userId, ts] of loveCooldowns) {
		if (ts < threshold) {
			loveCooldowns.delete(userId);
		}
	}
}

function randomLoveReply(): string {
	return (
		LOVE_REPLIES[
			Math.floor(Math.random() * LOVE_REPLIES.length)
		] ?? LOVE_REPLIES[0]
	);
}
