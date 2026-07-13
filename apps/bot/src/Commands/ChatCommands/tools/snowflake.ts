import { subcommand } from "#ChatCommands";

const DISCORD_EPOCH = 1420070400000n;

function deconstructSnowflake(snowflake: string): {
	id: string;
	timestamp: Date;
	workerId: number;
	processId: number;
	increment: number;
} | null {
	try {
		const id = BigInt(snowflake);
		const timestamp = Number((id >> 22n) + DISCORD_EPOCH);
		const workerId = Number((id >> 17n) & 0x1fn);
		const processId = Number((id >> 12n) & 0x1fn);
		const increment = Number(id & 0xfffn);
		return {
			id: snowflake,
			timestamp: new Date(timestamp),
			workerId,
			processId,
			increment,
		};
	} catch {
		return null;
	}
}

export const snowflakeCommand = subcommand({
	description: "Deconstruct a Discord snowflake ID.",
	name: "snowflake",
	usage: {
		arguments: [
			{
				description: "Discord snowflake ID to inspect.",
				name: "id",
				required: true,
			},
		],
		examples: [
			{
				command: "tools snowflake 175928847299117063",
				description: "Deconstruct a snowflake.",
			},
		],
		formats: ["tools snowflake <id>"],
		useCases: [
			"Inspect Discord snowflake IDs to see creation time and internal data.",
		],
	},
	async execute({ invocation, message }) {
		const id = invocation.positionalArgs.join(" ");
		if (!id) {
			await message.reply("Usage: `tools snowflake <id>`");
			return;
		}

		const result = deconstructSnowflake(id);
		if (!result) {
			await message.reply(
				`Invalid snowflake ID: \`${id}\``,
			);
			return;
		}

		await message.reply(
			[
				`ID: \`${result.id}\``,
				`Created: \`${result.timestamp.toISOString()}\``,
				`Worker: \`${result.workerId}\``,
				`Process: \`${result.processId}\``,
				`Increment: \`${result.increment}\``,
			].join("\n"),
		);
	},
});
