import { randomUUID } from "node:crypto";

import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import {
	extractOptionString,
} from "#ChatCommands";

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uuidSchema = z.object({
	mode: z
		.enum(["generate", "validate"])
		.default("generate"),
	input: z.string().max(500).optional(),
	count: z.coerce.number().int().min(1).max(10).default(1),
});

export const uuidCommand = subcommand({
	name: "uuid",
	aliases: ["guid"],
	description: "Generate and validate UUIDs.",
	category: "Dev Utilities",
	cooldown: 1_000,
	inputLimits: { maxInputLength: 500 },
	usage: {
		formats: ["uuid [mode] [--count=N] [<input>]"],
		arguments: [
			{
				name: "input",
				description: "UUID to validate.",
				required: false,
			},
		],
		options: [
			{
				name: "mode",
				description: "generate or validate",
				valueName: "mode",
			},
			{
				name: "count",
				description: "Number of UUIDs to generate (max 10)",
				valueName: "N",
			},
		],
		examples: [
			{
				command: "uuid generate",
				description: "Generate a UUID v4.",
			},
			{
				command: "uuid generate --count=3",
				description: "Generate 3 UUIDs.",
			},
			{
				command:
					"uuid validate 550e8400-e29b-41d4-a716-446655440000",
				description: "Validate a UUID.",
			},
		],
		useCases: [
			"Generate unique identifiers.",
			"Check if a string is a valid UUID.",
		],
	},
	async execute({ invocation, message }) {
		const mode =
			extractOptionString(invocation.options, "mode") ??
			"generate";
		const countStr =
			extractOptionString(invocation.options, "count") ??
			"1";

		const result = uuidSchema.safeParse({
			mode,
			input: invocation.positionalArgs[0],
			count: countStr,
		});

		if (!result.success) {
			await message.reply(
				result.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		if (result.data.mode === "generate") {
			const count = result.data.count;
			const uuids = Array.from({ length: count }, () =>
				randomUUID(),
			);
			const output = uuids.join("\n");

			await message.reply(safeInline(output, 1900));
			return;
		}

		const input = result.data.input;

		if (!input) {
			await message.reply(
				"Please provide a UUID string to validate.",
			);
			return;
		}

		const isValid = UUID_PATTERN.test(input);
		let versionInfo = "";

		if (isValid) {
			const version = parseInt(input[14] ?? "0", 16);
			versionInfo = ` version=${version}`;
		}

		await message.reply(
			isValid
				? `Valid UUID.${versionInfo}`
				: "Invalid UUID format.",
		);
	},
});
