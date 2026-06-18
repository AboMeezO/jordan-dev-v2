import {
	camelCase,
	constantCase,
	kebabCase,
	pascalCase,
	sentenceCase,
	snakeCase,
} from "change-case";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";

const CASE_MODES = [
	"camel",
	"pascal",
	"snake",
	"kebab",
	"constant",
	"sentence",
	"lower",
	"upper",
] as const;

function titleCase(input: string): string {
	return input.replace(
		/\w\S*/g,
		(word) =>
			word.charAt(0).toUpperCase() +
			word.slice(1).toLowerCase(),
	);
}

const caseFunctions: Record<
	string,
	(input: string) => string
> = {
	camel: camelCase,
	pascal: pascalCase,
	snake: snakeCase,
	kebab: kebabCase,
	constant: constantCase,
	title: titleCase,
	sentence: sentenceCase,
	lower: (s: string) => s.toLowerCase(),
	upper: (s: string) => s.toUpperCase(),
};

export const caseCommand = subcommand({
	name: "case",
	description: "Convert text between case styles.",
	category: "Dev Utilities",
	cooldown: 1_000,
	inputLimits: { maxInputLength: 10_000 },
	usage: {
		formats: ["case <target> <input>"],
		arguments: [
			{
				name: "target",
				description:
					"Target case: camel, pascal, snake, kebab, constant, title, sentence, lower, upper",
				required: true,
			},
			{
				name: "input",
				description: "Text to convert.",
				required: true,
			},
		],
		examples: [
			{
				command: 'case camel "hello world"',
				description: "Convert to camelCase.",
			},
			{
				command: 'case snake "HelloWorld"',
				description: "Convert to snake_case.",
			},
			{
				command: 'case kebab "Hello World"',
				description: "Convert to kebab-case.",
			},
		],
		useCases: [
			"Convert text between programming naming conventions.",
		],
	},
	async execute({ invocation, message }) {
		const target =
			invocation.positionalArgs[0]?.toLowerCase();
		const input = invocation.positionalArgs
			.slice(1)
			.join(" ");

		if (!input) {
			await message.reply(
				"Please provide text to convert.",
			);
			return;
		}

		if (input.length > 10_000) {
			await message.reply(
				"Input cannot exceed 10,000 characters.",
			);
			return;
		}

		if (
			!target ||
			!CASE_MODES.includes(
				target as (typeof CASE_MODES)[number],
			)
		) {
			await message.reply(
				`Unknown case target. Use one of: ${CASE_MODES.join(", ")}`,
			);
			return;
		}

		const fn = caseFunctions[target];

		if (!fn) {
			await message.reply(
				`Unknown case target. Use one of: ${CASE_MODES.join(", ")}`,
			);
			return;
		}

		const output = fn(input);
		await message.reply(safeInline(output, 1900));
	},
});
