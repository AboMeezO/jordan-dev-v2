import slugify from "slugify";
import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import {
	extractOptionFlag,
	extractOptionString,
	textInputSchema,
} from "#ChatCommands";

const slugSchema = z.object({
	input: textInputSchema(5_000),
	separator: z.string().max(1).default("-").optional(),
	strict: z.boolean().default(true).optional(),
});

export const slugCommand = subcommand({
	name: "slug",
	aliases: ["slugify"],
	description: "Convert text into URL-friendly slugs.",
	category: "Dev Utilities",
	cooldown: 1_000,
	inputLimits: { maxInputLength: 5_000 },
	usage: {
		formats: ["slug <input> [--separator=-] [--strict]"],
		arguments: [
			{
				name: "input",
				description: "Text to slugify.",
				required: true,
			},
		],
		options: [
			{
				name: "separator",
				description: "Separator character",
				valueName: "char",
			},
			{
				name: "strict",
				description: "Remove special characters strictly",
			},
		],
		examples: [
			{
				command: 'slug "My Cool Project!"',
				description: "Create a slug.",
			},
			{
				command: 'slug "Hello World" --separator=_',
				description: "Slug with underscores.",
			},
		],
		useCases: [
			"Generate URL-friendly slugs from titles or names.",
		],
	},
	async execute({ invocation, message }) {
		const result = slugSchema.safeParse({
			input: invocation.positionalArgs.join(" "),
			separator: extractOptionString(
				invocation.options,
				"separator",
			),
			strict: extractOptionFlag(
				invocation.options,
				"strict",
			),
		});

		if (!result.success) {
			await message.reply(
				result.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		const output = slugify(result.data.input, {
			lower: true,
			replacement: result.data.separator ?? "-",
			strict: result.data.strict ?? true,
		});

		if (!output) {
			await message.reply(
				"Slug is empty. The input may contain only unsupported characters.",
			);
			return;
		}

		await message.reply(safeInline(output, 1900));
	},
});
