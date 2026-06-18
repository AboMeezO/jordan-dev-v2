import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import {
	extractOptionString,
	modeSchema,
	textInputSchema,
} from "#ChatCommands";

const urlSchema = z.object({
	mode: modeSchema(["encode", "decode", "parse"], "encode"),
	input: textInputSchema(10_000),
});

export const urlCommand = subcommand({
	name: "url",
	aliases: ["uri"],
	description: "Encode, decode, and parse URLs.",
	category: "Dev Utilities",
	cooldown: 1_000,
	inputLimits: { maxInputLength: 10_000 },
	usage: {
		formats: ["url [mode] <input>"],
		arguments: [
			{
				name: "input",
				description: "URL or text to process.",
				required: true,
			},
		],
		options: [
			{
				name: "mode",
				description: "encode, decode, or parse",
				valueName: "mode",
			},
		],
		examples: [
			{
				command: 'url encode "hello world"',
				description: "URL-encode text.",
			},
			{
				command: 'url decode "hello%20world"',
				description: "URL-decode text.",
			},
			{
				command:
					"url parse https://example.com/path?q=1#hash",
				description: "Parse a URL into components.",
			},
		],
		useCases: [
			"Debug URL encoding issues.",
			"Inspect URL components.",
		],
	},
	async execute({ invocation, message }) {
		const result = urlSchema.safeParse({
			mode: extractOptionString(invocation.options, "mode"),
			input: invocation.positionalArgs.join(" "),
		});

		if (!result.success) {
			await message.reply(
				result.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		try {
			if (result.data.mode === "encode") {
				const encoded = encodeURIComponent(
					result.data.input,
				);
				await message.reply(safeInline(encoded, 1900));
				return;
			}

			if (result.data.mode === "decode") {
				const decoded = decodeURIComponent(
					result.data.input,
				);
				await message.reply(safeInline(decoded, 1900));
				return;
			}

			const parsed = new URL(result.data.input);
			const parts = [
				`protocol=${parsed.protocol.replace(":", "")}`,
				`hostname=${parsed.hostname}`,
				`port=${parsed.port || "(default)"}`,
				`pathname=${parsed.pathname}`,
				`search=${parsed.search || "(none)"}`,
				`hash=${parsed.hash || "(none)"}`,
				`origin=${parsed.origin}`,
			];

			if (parsed.searchParams.size > 0) {
				const queryParts: string[] = [];
				parsed.searchParams.forEach((value, key) => {
					queryParts.push(`  ${key}=${value}`);
				});
				parts.push("query:", ...queryParts);
			}

			await message.reply(
				safeInline(parts.join("\n"), 1900),
			);
		} catch {
			await message.reply(
				"Invalid URL. Make sure it includes a protocol (e.g. https://).",
			);
		}
	},
});
