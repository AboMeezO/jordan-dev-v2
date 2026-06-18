import { createHash, getHashes } from "node:crypto";

import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import {
	extractOptionString,
	modeSchema,
	textInputSchema,
} from "#ChatCommands";

const WEAK_ALGORITHMS = new Set(["md5", "sha1"]);

const hashSchema = z.object({
	algorithm: modeSchema(
		["md5", "sha1", "sha256", "sha512"],
		"sha256",
	),
	input: textInputSchema(100_000),
});

export const hashCommand = subcommand({
	name: "hash",
	aliases: ["checksum"],
	description: "Generate hashes for text input.",
	category: "Dev Utilities",
	cooldown: 1_000,
	inputLimits: { maxInputLength: 100_000 },
	usage: {
		formats: ["hash [algorithm] <input>"],
		arguments: [
			{
				name: "input",
				description: "Text to hash.",
				required: true,
			},
		],
		options: [
			{
				name: "algorithm",
				description: "md5, sha1, sha256, or sha512",
				valueName: "algo",
			},
		],
		examples: [
			{
				command: 'hash sha256 "hello world"',
				description: "Hash text with SHA-256.",
			},
			{
				command: 'hash md5 "hello"',
				description:
					"Hash text with MD5 (includes warning).",
			},
		],
		useCases: [
			"Verify checksums.",
			"Quick hash computation.",
		],
		notes: [
			"MD5 and SHA1 are not secure for password storage or security purposes.",
		],
	},
	async execute({ invocation, message }) {
		const algorithm =
			extractOptionString(
				invocation.options,
				"algorithm",
			) ??
			extractOptionString(invocation.options, "algo") ??
			"sha256";
		const input = invocation.positionalArgs.join(" ");

		const result = hashSchema.safeParse({
			algorithm,
			input,
		});

		if (!result.success) {
			await message.reply(
				result.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		const algo = result.data.algorithm;
		const available = getHashes();

		if (!available.includes(algo)) {
			await message.reply(
				`Algorithm \`${algo}\` is not available.`,
			);
			return;
		}

		const digest = createHash(algo)
			.update(result.data.input, "utf-8")
			.digest("hex");
		const lines = [
			`algorithm=${algo}`,
			`digest=${digest}`,
			`encoding=hex`,
		];

		if (WEAK_ALGORITHMS.has(algo)) {
			lines.push(
				"warning=This algorithm is not secure for password storage or security purposes.",
			);
		}

		await message.reply(safeInline(lines.join("\n"), 1900));
	},
});
