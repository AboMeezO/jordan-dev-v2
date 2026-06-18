import type {
	ChatCommandInvocation,
	ChatCommandOptionValue,
	ChatCommandParseResult,
	ChatCommandRedirect,
	ChatCommandSegment,
} from "./types.js";

type Token =
	| {
			readonly kind: "word";
			readonly value: string;
	  }
	| {
			readonly kind: "operator";
			readonly value:
				| "|"
				| "&&"
				| "||"
				| ";"
				| ">"
				| ">>"
				| "<"
				| "2>";
	  };

type OperatorTokenValue = Extract<
	Token,
	{ readonly kind: "operator" }
>["value"];

export function parseChatCommandInput(
	content: string,
	prefix: string,
): ChatCommandParseResult | undefined {
	const trimmed = content.trim();

	if (!trimmed.startsWith(prefix)) {
		return undefined;
	}

	const input = trimmed.slice(prefix.length).trim();

	if (input.length === 0) {
		return undefined;
	}

	const tokens = tokenizeShellLike(input);
	const segments = buildSegments(tokens);

	if (
		segments.length === 0 ||
		segments[0]?.words.length === 0
	) {
		return undefined;
	}

	return { prefix, segments };
}

export function createInvocation(
	source: ChatCommandParseResult,
	commandPath: readonly string[],
	rawArgs: readonly string[],
): ChatCommandInvocation {
	const { options, positionalArgs } =
		parseArguments(rawArgs);

	return {
		commandPath,
		options,
		positionalArgs,
		prefix: source.prefix,
		rawArgs,
		source,
	};
}

export function tokenizeShellLike(
	input: string,
): readonly Token[] {
	const tokens: Token[] = [];
	let current = "";
	let quote: "'" | '"' | undefined;
	let escaping = false;

	for (let index = 0; index < input.length; index += 1) {
		const character = input[index];

		if (!character) {
			continue;
		}

		if (escaping) {
			current += character;
			escaping = false;
			continue;
		}

		if (character === "\\") {
			escaping = true;
			continue;
		}

		if (quote) {
			if (character === quote) {
				quote = undefined;
			} else {
				current += character;
			}

			continue;
		}

		if (character === "'" || character === '"') {
			quote = character;
			continue;
		}

		if (/\s/.test(character)) {
			pushWord(tokens, current);
			current = "";
			continue;
		}

		const discordToken = readDiscordAngleToken(
			input,
			index,
		);

		if (discordToken) {
			current += discordToken.value;
			index += discordToken.length - 1;
			continue;
		}

		const operator = readOperator(input, index);

		if (operator) {
			pushWord(tokens, current);
			current = "";
			tokens.push({
				kind: "operator",
				value: operator.value,
			});
			index += operator.length - 1;
			continue;
		}

		current += character;
	}

	if (escaping) {
		current += "\\";
	}

	pushWord(tokens, current);
	return tokens;
}

function readDiscordAngleToken(
	input: string,
	index: number,
):
	| { readonly value: string; readonly length: number }
	| undefined {
	if (
		input[index] !== "<" ||
		!"@#:".includes(input[index + 1] ?? "")
	) {
		return undefined;
	}

	const endIndex = input.indexOf(">", index + 1);

	if (endIndex === -1) {
		return undefined;
	}

	const value = input.slice(index, endIndex + 1);

	return { length: value.length, value };
}

function buildSegments(
	tokens: readonly Token[],
): readonly ChatCommandSegment[] {
	const segments: ChatCommandSegment[] = [];
	let words: string[] = [];
	let operators: ChatCommandSegment["operators"] = [];
	let redirects: ChatCommandRedirect[] = [];

	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index];

		if (!token) {
			continue;
		}

		if (token.kind === "word") {
			words.push(token.value);
			continue;
		}

		if (
			token.value === ">" ||
			token.value === ">>" ||
			token.value === "<" ||
			token.value === "2>"
		) {
			const next = tokens[index + 1];
			redirects.push({
				index,
				operator: token.value,
				target:
					next?.kind === "word" ? next.value : undefined,
			});

			if (next?.kind === "word") {
				index += 1;
			}

			continue;
		}

		operators = [
			...operators,
			{ index, value: token.value },
		];
		segments.push({ operators, redirects, words });
		words = [];
		operators = [];
		redirects = [];
	}

	segments.push({ operators, redirects, words });

	return segments.filter(
		(segment) =>
			segment.words.length > 0 ||
			segment.operators.length > 0 ||
			segment.redirects.length > 0,
	);
}

function parseArguments(args: readonly string[]): {
	readonly options: Readonly<
		Record<string, ChatCommandOptionValue>
	>;
	readonly positionalArgs: readonly string[];
} {
	const options: Record<string, ChatCommandOptionValue> =
		{};
	const positionalArgs: string[] = [];
	let forcePositional = false;

	for (const arg of args) {
		if (forcePositional) {
			positionalArgs.push(arg);
			continue;
		}

		if (arg === "--") {
			forcePositional = true;
			continue;
		}

		if (arg.startsWith("--") && arg.length > 2) {
			const [name, value] = splitOption(arg.slice(2));

			if (name) {
				addOption(options, name, value);
				continue;
			}
		}

		if (/^-[A-Za-z]{2,}$/.test(arg)) {
			for (const name of arg.slice(1)) {
				addOption(options, name, undefined);
			}
			continue;
		}

		if (/^-[^-]=/.test(arg)) {
			addOption(options, arg[1] ?? "", arg.slice(3));
			continue;
		}

		positionalArgs.push(arg);
	}

	return { options, positionalArgs };
}

function splitOption(
	input: string,
): readonly [string, string | undefined] {
	const separatorIndex = input.indexOf("=");

	if (separatorIndex === -1) {
		return [input, undefined];
	}

	return [
		input.slice(0, separatorIndex),
		input.slice(separatorIndex + 1),
	];
}

function addOption(
	options: Record<string, ChatCommandOptionValue>,
	name: string,
	value: string | undefined,
): void {
	if (!name) {
		return;
	}

	const current = options[name];

	if (value === undefined) {
		options[name] = current ?? true;
		return;
	}

	if (current === undefined || current === true) {
		options[name] = [value];
		return;
	}

	options[name] = [...current, value];
}

function readOperator(
	input: string,
	index: number,
):
	| {
			readonly value: OperatorTokenValue;
			readonly length: number;
	  }
	| undefined {
	const twoCharacterOperator = input.slice(
		index,
		index + 2,
	);

	if (
		twoCharacterOperator === "&&" ||
		twoCharacterOperator === "||" ||
		twoCharacterOperator === ">>" ||
		twoCharacterOperator === "2>"
	) {
		return { length: 2, value: twoCharacterOperator };
	}

	const oneCharacterOperator = input[index];

	if (
		oneCharacterOperator === "|" ||
		oneCharacterOperator === ";" ||
		oneCharacterOperator === ">" ||
		oneCharacterOperator === "<"
	) {
		return { length: 1, value: oneCharacterOperator };
	}

	return undefined;
}

function pushWord(tokens: Token[], value: string): void {
	if (value.length > 0) {
		tokens.push({ kind: "word", value });
	}
}
