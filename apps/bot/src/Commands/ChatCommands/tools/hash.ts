import { createHash } from "node:crypto";

import { subcommand } from "#ChatCommands";

const supportedAlgorithms = [
	"md5",
	"sha1",
	"sha256",
	"sha512",
] as const;

export const hashCommand = subcommand({
	description: "Compute a hash of input text.",
	name: "hash",
	usage: {
		arguments: [
			{
				description:
					"Hash algorithm (md5, sha1, sha256, sha512).",
				name: "algorithm",
				required: true,
			},
			{
				description: "Text to hash.",
				name: "text",
				required: true,
			},
		],
		examples: [
			{
				command: "tools hash md5 hello",
				description: "Compute MD5 hash.",
			},
			{
				command: "tools hash sha256 hello",
				description: "Compute SHA-256 hash.",
			},
		],
		formats: ["tools hash <algorithm> <text>"],
		useCases: [
			"Quickly hash strings without leaving Discord.",
		],
	},
	async execute({ invocation, message }) {
		const [algo, ...rest] = invocation.positionalArgs;
		const text = rest.join(" ");
		if (!algo || !text) {
			await message.reply(
				"Usage: `tools hash <md5|sha1|sha256|sha512> <text>`",
			);
			return;
		}

		const algorithm = algo.toLowerCase();
		if (
			!(supportedAlgorithms as readonly string[]).includes(
				algorithm,
			)
		) {
			await message.reply(
				`Unsupported algorithm \`${algorithm}\`. Supported: ${supportedAlgorithms.join(", ")}.`,
			);
			return;
		}

		const hash = createHash(algorithm)
			.update(text)
			.digest("hex");
		await message.reply(`\`\`\`\n${hash}\n\`\`\``);
	},
});
