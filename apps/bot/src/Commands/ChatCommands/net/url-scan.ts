import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";
import { botConfig } from "#Config";

import { scanUrl } from "./url-scan-scanner.js";

const urlScanSchema = z.object({
	url: textInputSchema(2000),
});

export const urlScanCommand = subcommand({
	name: "url-scan",
	aliases: ["scan-url", "check-url"],
	description:
		"Scan a URL to check its safety. Uses VirusTotal (if configured) or local heuristics.",
	category: "Network / Security Tools",
	cooldown: 10_000,
	inputLimits: { maxInputLength: 2000 },
	availability: {
		contexts: ["guild", "dm"],
	},
	usage: {
		formats: ["url-scan <url>"],
		arguments: [
			{
				name: "url",
				description: "Full URL to scan (https://...).",
				required: true,
			},
		],
		examples: [
			{
				command: "url-scan https://example.com",
				description:
					"Check URL safety with available scanners.",
			},
		],
	},
	async execute({ invocation, message }) {
		const raw = invocation.positionalArgs.join(" ").trim();
		const parsed = urlScanSchema.safeParse({ url: raw });

		if (!parsed.success) {
			await message.reply(
				parsed.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		const url = parsed.data.url;

		if (
			!url.startsWith("http://") &&
			!url.startsWith("https://")
		) {
			await message.reply(
				"URL must start with http:// or https://",
			);
			return;
		}

		const isVtConfigured =
			!!botConfig.scanning.virustotalApiKey;

		const result = await scanUrl(url);

		const lines: string[] = [
			isVtConfigured &&
				"privacy=URL was sent to VirusTotal for analysis",
			`url=${url}`,
			`scanner=${result.scanner}`,
			`safe=${result.safe}`,
			`cached=${result.cached}`,
		].filter(Boolean) as string[];

		if (
			result.positives !== undefined &&
			result.total !== undefined
		) {
			lines.push(
				`virustotal_positives=${result.positives}/${result.total}`,
			);
		}

		lines.push(...result.scanDetails);

		await message.reply(safeInline(lines.join("\n"), 1900));
	},
});
