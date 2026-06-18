import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const DISCORD_EPOCH = 1420070400000n;

const snowflakeSchema = z.object({
	input: textInputSchema(100),
});

export const snowflakeCommand = subcommand({
	name: "snowflake",
	aliases: ["sf", "idinfo"],
	description: "Decode Discord snowflake IDs.",
	category: "Discord Tools",
	cooldown: 1_000,
	inputLimits: { maxInputLength: 100 },
	usage: {
		formats: ["snowflake <id or mention>"],
		arguments: [
			{
				name: "id",
				description:
					"Discord snowflake ID, mention, or channel/role mention.",
				required: true,
			},
		],
		examples: [
			{
				command: "snowflake 123456789012345678",
				description: "Decode a snowflake ID.",
			},
			{
				command: "snowflake <@123456789012345678>",
				description: "Decode a user mention.",
			},
		],
		useCases: [
			"Find when a Discord ID was created.",
			"Get internal snowflake components.",
		],
	},
	async execute({ invocation, message }) {
		const raw = invocation.positionalArgs[0] ?? "";
		const cleaned = raw.replace(/[<@!&#>]/g, "");

		const result = snowflakeSchema.safeParse({
			input: cleaned,
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
			const id = BigInt(result.data.input);
			const timestampMs = (id >> 22n) + DISCORD_EPOCH;
			const date = new Date(Number(timestampMs));
			const unixSeconds = Math.floor(date.getTime() / 1000);
			const workerId = Number((id >> 17n) & 0x1fn);
			const processId = Number((id >> 12n) & 0x1fn);
			const increment = Number(id & 0xfffn);

			const lines = [
				`id=${result.data.input}`,
				`created=${date.toISOString()}`,
				`unix=${unixSeconds}`,
				`discord=<t:${unixSeconds}:F>`,
				`worker_id=${workerId}`,
				`process_id=${processId}`,
				`increment=${increment}`,
			];

			await message.reply(
				safeInline(lines.join("\n"), 1900),
			);
		} catch {
			await message.reply(
				"Invalid snowflake ID. IDs must be numeric Discord snowflakes.",
			);
		}
	},
});
