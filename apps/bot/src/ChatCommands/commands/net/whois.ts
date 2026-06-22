import { whoisDomain } from "whoiser";
import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeOutput } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const PRIVACY_KEYWORDS = [
	"redacted for privacy",
	"whoisguard",
	"whoisprotect",
	"privacyprotect",
	"privacy service",
	"data redacted",
	"personal data",
	"gdrp",
	"redacted",
] as const;

const DOMAIN_COOLDOWN_MS = 15_000;
const domainCooldowns = new Map<string, number>();

const whoisSchema = z.object({
	domain: textInputSchema(253),
});

export const whoisCommand = subcommand({
	name: "whois",
	aliases: ["who-is"],
	description: "Perform a WHOIS lookup for a domain.",
	category: "Network / Security Tools",
	cooldown: 10_000,
	inputLimits: { maxInputLength: 253 },
	availability: {
		contexts: ["guild", "dm"],
	},
	usage: {
		formats: ["whois <domain>"],
		arguments: [
			{
				name: "domain",
				description:
					"Domain to look up (e.g. example.com).",
				required: true,
			},
		],
		examples: [
			{
				command: "whois example.com",
				description: "WHOIS lookup.",
			},
		],
	},
	async execute({ invocation, message }) {
		const raw = invocation.positionalArgs.join(" ").trim();
		const parsed = whoisSchema.safeParse({ domain: raw });

		if (!parsed.success) {
			await message.reply(
				parsed.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		const domain = parsed.data.domain;
	const domainKey = domain.toLowerCase();

	const lastQuery = domainCooldowns.get(domainKey);
	if (lastQuery && Date.now() - lastQuery < DOMAIN_COOLDOWN_MS) {
		await message.reply(
			`WHOIS for "${domain}" was queried recently. Please wait before querying it again.`,
		);
		return;
	}

		try {
			domainCooldowns.set(domainKey, Date.now());

			const result = await whoisDomain(domain, {
				timeout: 10000,
			});

			const flat: string[] = [];
			let hasPrivacy = false;

			for (const [, data] of Object.entries(result) as [
				string,
				Record<string, unknown>,
			][]) {
				if (typeof data === "object" && data !== null) {
					for (const [key, value] of Object.entries(data)) {
						if (value === null || value === undefined) {
							continue;
						}
						const str = String(value).slice(0, 200);
						const lower = str.toLowerCase();
						if (
							!hasPrivacy &&
							PRIVACY_KEYWORDS.some((kw) => lower.includes(kw))
						) {
							hasPrivacy = true;
						}
						flat.push(`${key}=${str}`);
					}
				}
			}

			if (flat.length === 0) {
				await message.reply("No WHOIS data returned.");
				return;
			}

			if (hasPrivacy) {
				flat.unshift("whois_privacy=true");
			}

			const truncated = flat.slice(0, 15);
			if (flat.length > 15) {
				truncated.push(`... and ${flat.length - 15} more fields (use attachment for full data)`);
			}

			const output = safeOutput(truncated.join("\n"));

			if ("content" in output) {
				await message.reply(output.content);
			} else {
				await message.reply({ files: [output.attachment] });
			}
		} catch (error) {
			const err = error as Error;
			await message.reply(
				`WHOIS lookup failed: ${err.message}`,
			);
		}
	},
});
