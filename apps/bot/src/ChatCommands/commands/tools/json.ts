import { z } from "zod";

import { subcommand } from "#ChatCommands";
import {
	safeOutput,
	unknownErrorOutput,
} from "#ChatCommands";
import {
	extractOptionFlag,
	extractOptionString,
	modeSchema,
	textInputSchema,
} from "#ChatCommands";

const jsonSchema = z.object({
	mode: modeSchema(
		["format", "minify", "validate"],
		"format",
	),
	indent: z.coerce
		.number()
		.int()
		.min(2)
		.max(8)
		.default(2)
		.optional(),
	sortKeys: z.boolean().default(false).optional(),
	input: textInputSchema(100_000),
});

export const jsonCommand = subcommand({
	name: "json",
	aliases: ["json-format", "jsonfmt"],
	description: "Format, validate, and minify JSON.",
	category: "Dev Utilities",
	cooldown: 2_000,
	inputLimits: { maxInputLength: 100_000 },
	outputMode: "inline-or-attachment",
	usage: {
		formats: [
			"json [mode] [--indent=2] [--sort-keys] <input>",
		],
		arguments: [
			{
				name: "input",
				description: "JSON string to process.",
				required: true,
			},
		],
		options: [
			{
				name: "mode",
				description: "format, minify, or validate",
				valueName: "mode",
			},
			{
				name: "indent",
				description: "Indentation size (2-8)",
				valueName: "spaces",
			},
			{
				name: "sort-keys",
				description: "Sort object keys alphabetically",
			},
		],
		examples: [
			{
				command: 'json format --indent=4 \'{"a":1,"b":2}\'',
				description: "Format JSON with 4-space indent.",
			},
			{
				command: "json minify '{\"a\": 1}'",
				description: "Minify JSON.",
			},
			{
				command: "json validate '{\"a\":1}'",
				description: "Validate JSON.",
			},
		],
		useCases: [
			"Format messy JSON output.",
			"Validate JSON before using it in code.",
		],
	},
	async execute({ invocation, message }) {
		const result = jsonSchema.safeParse({
			mode: extractOptionString(invocation.options, "mode"),
			indent: extractOptionString(
				invocation.options,
				"indent",
			),
			sortKeys: extractOptionFlag(
				invocation.options,
				"sort-keys",
			),
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
			const parsed = JSON.parse(result.data.input) as unknown;

			if (result.data.mode === "validate") {
				await message.reply("Valid JSON.");
				return;
			}

			const indent = result.data.indent ?? 2;
			const output =
				result.data.mode === "minify"
					? JSON.stringify(parsed)
					: JSON.stringify(
							parsed,
							result.data.sortKeys
								? sortKeysReplacer
								: undefined,
							indent,
						);

			const safe = safeOutput(output);

			if ("content" in safe) {
				await message.reply({ content: safe.content });
			} else {
				await message.reply({ files: [safe.attachment] });
			}
		} catch (error) {
			await message.reply(
				`Invalid JSON: ${error instanceof Error ? error.message : unknownErrorOutput()}`,
			);
		}
	},
});

function sortKeysReplacer(
	this: unknown,
	_key: string,
	value: unknown,
): unknown {
	if (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value)
	) {
		return Object.keys(value)
			.sort()
			.reduce<Record<string, unknown>>((sorted, key) => {
				sorted[key] = (value as Record<string, unknown>)[
					key
				];
				return sorted;
			}, {});
	}
	return value;
}
