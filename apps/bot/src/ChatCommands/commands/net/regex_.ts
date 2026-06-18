import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

import safeRegex from "safe-regex2";

const regexSchema = z.object({
	pattern: textInputSchema(500),
	flags: z.string().max(10).default(""),
	testString: z.string().max(200).optional(),
});

export const regexCommand = subcommand({
	name: "regex",
	aliases: ["re"],
	description: "Test and validate regex patterns.",
	category: "Network / Security Tools",
	cooldown: 3_000,
	inputLimits: { maxInputLength: 500 },
	availability: {
		contexts: ["guild", "dm"],
	},
	usage: {
		formats: [
			"regex <pattern> [flags] [--test <string>]",
			"regex --safe <pattern>",
		],
		arguments: [
			{
				name: "pattern",
				description: "Regular expression pattern.",
				required: true,
			},
			{
				name: "flags",
				description: "Regex flags (g, i, m, s, u, y).",
				required: false,
			},
		],
		examples: [
			{
				command: "regex ^\\d+$",
				description: "Validate pattern safety.",
			},
			{
				command: "regex \\w+ g --test 'hello world'",
				description: "Test pattern against string.",
			},
		],
	},
	async execute({ invocation, message }) {
		const testRaw =
			invocation.options.test ?? invocation.options.t;
		const args = invocation.positionalArgs.filter(
			(a) => !a.startsWith("--"),
		);

		let pattern: string;
		let flags: string;

		if (args.length >= 2) {
			pattern = args[0]!;
			flags = args.slice(1).join("");
		} else if (args.length === 1) {
			pattern = args[0]!;
			flags = "";
		} else {
			await message.reply(
				"Required argument missing: pattern.",
			);
			return;
		}

		const parsed = regexSchema.safeParse({
			pattern,
			flags,
			testString:
				typeof testRaw === "string" ? testRaw : undefined,
		});

		if (!parsed.success) {
			await message.reply(
				parsed.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		const isSafe = safeRegex(
			new RegExp(parsed.data.pattern, parsed.data.flags),
		);

		if (!isSafe) {
			await message.reply(
				`Pattern \`/${parsed.data.pattern}/${parsed.data.flags}\` is **unsafe** (potential ReDoS).`,
			);
			return;
		}

		if (parsed.data.testString !== undefined) {
			try {
				const re = new RegExp(
					parsed.data.pattern,
					parsed.data.flags,
				);
				const matches = [
					...parsed.data.testString.matchAll(re),
				].map((m) => ({
					full: m[0],
					groups: m.slice(1).filter((g) => g !== undefined),
				}));

				if (matches.length === 0) {
					await message.reply(
						`No matches found for \`/${parsed.data.pattern}/${parsed.data.flags}\`.`,
					);
					return;
				}

				const lines = matches.map((m, i) => {
					const base = `${i + 1}. "${m.full}"`;
					const groups =
						m.groups.length > 0
							? ` groups=[${m.groups.join(", ")}]`
							: "";
					return base + groups;
				});

				await message.reply(
					safeInline(
						`Pattern \`/${parsed.data.pattern}/${parsed.data.flags}\` (safe) - ${matches.length} match(es):\n${lines.join("\n")}`,
						1900,
					),
				);
			} catch {
				await message.reply("Invalid regex pattern.");
			}
		} else {
			await message.reply(
				`Pattern \`/${parsed.data.pattern}/${parsed.data.flags}\` is **safe**.`,
			);
		}
	},
});
