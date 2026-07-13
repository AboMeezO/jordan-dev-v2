import {
	camelCase,
	capitalCase,
	constantCase,
	dotCase,
	kebabCase,
	noCase,
	pascalCase,
	pathCase,
	sentenceCase,
	snakeCase,
} from "change-case";

import { subcommand } from "#ChatCommands";

export const caseCommand = subcommand({
	description: "Convert text between string cases.",
	name: "case",
	usage: {
		arguments: [
			{
				description: "Target case type.",
				name: "type",
				required: true,
			},
			{
				description: "Text to convert.",
				name: "text",
				required: true,
			},
		],
		examples: [
			{
				command: "tools case camel hello world",
				description: "Convert to camelCase.",
			},
			{
				command: "tools case kebab hello world",
				description: "Convert to kebab-case.",
			},
		],
		formats: ["tools case <type> <text>"],
		useCases: [
			"Quickly switch between naming conventions.",
		],
	},
	async execute({ invocation, message }) {
		const [type, ...rest] = invocation.positionalArgs;
		const text = rest.join(" ");
		if (!type || !text) {
			await message.reply(
				"Usage: `tools case <camel|capital|constant|dot|kebab|lower|no|pascal|path|sentence|snake|title|upper> <text>`",
			);
			return;
		}

		const cases: Record<string, (s: string) => string> = {
			camel: camelCase,
			constant: constantCase,
			capital: capitalCase,
			dot: dotCase,
			kebab: kebabCase,
			lower: (s) => s.toLowerCase(),
			no: noCase,
			pascal: pascalCase,
			path: pathCase,
			sentence: sentenceCase,
			snake: snakeCase,
			title: capitalCase,
			upper: (s) => s.toUpperCase(),
		};

		const fn = cases[type];
		if (!fn) {
			await message.reply(
				"Unknown case type. Available: camel, capital, constant, dot, kebab, lower, no, pascal, path, sentence, snake, title, upper.",
			);
			return;
		}

		await message.reply(`\`\`\`\n${fn(text)}\n\`\`\``);
	},
});
