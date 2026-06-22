import type { Client, Message } from "discord.js";

const URL_AT_START_REGEX = /^\s*(https?:\/\/[^\s<>()]+)/i;

const NO_LINK_ROASTS = [
	"{user}, this is a jobs channel, not your diary. Start with a working job link.",
	"{user}, impressive message. Sadly, zero job links detected. Try again with the link first.",
	"{user}, the hiring manager called. They said this is not LinkedIn, but at least start with a job link.",
	"{user}, you walked into the jobs channel and forgot the job. Bold strategy.",
	"{user}, no link at the start, no mercy. Job link first, commentary after.",
];

const BROKEN_LINK_ROASTS = [
	"{user}, that link is deader than my motivation on Monday morning.",
	"{user}, the link refused to work harder than most interns. Send a reachable one.",
	"{user}, I tried the link. It collapsed immediately. Valid working link only.",
	"{user}, that URL has the structural integrity of wet cardboard.",
	"{user}, the link is not reachable. Even Google Maps could not save this one.",
];

function getStartingUrl(content: string): string | null {
	const match = content.match(URL_AT_START_REGEX);

	return match?.[1] ?? null;
}

function pickRoast(
	roasts: readonly string[],
	userMention: string,
): string {
	const roast =
		roasts[Math.floor(Math.random() * roasts.length)];

	return (roast ?? "{user}, behave.").replace(
		"{user}",
		userMention,
	);
}

async function sendTemporaryRoast(
	message: Message,
	roasts: readonly string[],
): Promise<void> {
	if (!message.channel.isSendable()) return;

	const warning = await message.channel.send({
		content: pickRoast(roasts, message.author.toString()),
	});

	setTimeout(() => {
		warning.delete().catch(() => null);
	}, 8000);
}

async function isWorkingLink(
	url: string,
): Promise<boolean> {
	try {
		const headResponse = await fetch(url, {
			method: "HEAD",
			redirect: "follow",
			signal: AbortSignal.timeout(7000),
		});

		if (headResponse.ok) return true;

		const getResponse = await fetch(url, {
			method: "GET",
			redirect: "follow",
			signal: AbortSignal.timeout(7000),
		});

		return getResponse.ok;
	} catch {
		return false;
	}
}

export default async function (
	message: Message,
): Promise<void> {
	if (message.author.bot) return;
	if (message.channel.id !== process.env.JOBS_CHANNEL)
		return;

	const url = getStartingUrl(message.content);

	if (!url) {
		await message.delete().catch(() => null);
		await sendTemporaryRoast(message, NO_LINK_ROASTS);
		return;
	}

	const working = await isWorkingLink(url);

	if (working) return;

	await message.delete().catch(() => null);
	await sendTemporaryRoast(message, BROKEN_LINK_ROASTS);
}
