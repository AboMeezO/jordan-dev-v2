import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import {
	extractOptionString,
	modeSchema,
	textInputSchema,
} from "#ChatCommands";

const MORSE_MAP: Record<string, string> = {
	A: ".-",
	B: "-...",
	C: "-.-.",
	D: "-..",
	E: ".",
	F: "..-.",
	G: "--.",
	H: "....",
	I: "..",
	J: ".---",
	K: "-.-",
	L: ".-..",
	M: "--",
	N: "-.",
	O: "---",
	P: ".--.",
	Q: "--.-",
	R: ".-.",
	S: "...",
	T: "-",
	U: "..-",
	V: "...-",
	W: ".--",
	X: "-..-",
	Y: "-.--",
	Z: "--..",
	"0": "-----",
	"1": ".----",
	"2": "..---",
	"3": "...--",
	"4": "....-",
	"5": ".....",
	"6": "-....",
	"7": "--...",
	"8": "---..",
	"9": "----.",
	".": ".-.-.-",
	",": "--..--",
	"?": "..--..",
	"'": ".----.",
	"!": "-.-.--",
	"/": "-..-.",
	"(": "-.--.",
	")": "-.--.-",
	"&": ".-...",
	":": "---...",
	";": "-.-.-.",
	"=": "-...-",
	"+": ".-.-.",
	"-": "-....-",
	_: "..--.-",
	'"': ".-..-.",
	"@": ".--.-.",
};

const REVERSE_MORSE: Record<string, string> = {};

for (const [char, code] of Object.entries(MORSE_MAP)) {
	REVERSE_MORSE[code] = char;
}

const morseSchema = z.object({
	mode: modeSchema(["encode", "decode"], "encode"),
	input: textInputSchema(5_000),
});

export const morseCommand = subcommand({
	name: "morse",
	aliases: ["morse-code"],
	description: "Encode and decode Morse code.",
	category: "Dev Utilities",
	cooldown: 1_000,
	inputLimits: { maxInputLength: 5_000 },
	usage: {
		formats: ["morse [mode] <input>"],
		arguments: [
			{
				name: "input",
				description: "Text or Morse code to convert.",
				required: true,
			},
		],
		options: [
			{
				name: "mode",
				description: "encode or decode",
				valueName: "mode",
			},
		],
		examples: [
			{
				command: 'morse encode "hello world"',
				description: "Encode text to Morse code.",
			},
			{
				command:
					'morse decode ".... . .-.. .-.. --- / .-- --- .-. .-.. -.."',
				description: "Decode Morse to text.",
			},
		],
		useCases: ["Learn or experiment with Morse code."],
	},
	async execute({ invocation, message }) {
		const result = morseSchema.safeParse({
			mode: extractOptionString(invocation.options, "mode"),
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
			if (result.data.mode === "encode") {
				await handleEncode(result.data.input, message);
			} else {
				await handleDecode(result.data.input, message);
			}
		} catch {
			await message.reply(
				"An error occurred while processing Morse code.",
			);
		}
	},
});

async function handleEncode(
	input: string,
	message: {
		reply: (content: string | object) => Promise<unknown>;
	},
): Promise<void> {
	const upper = input.toUpperCase();
	const chars: string[] = [];
	const unsupported: string[] = [];

	for (const char of upper) {
		if (char === " ") {
			chars.push("/");
		} else if (MORSE_MAP[char]) {
			chars.push(MORSE_MAP[char]);
		} else {
			unsupported.push(char);
		}
	}

	const encoded = chars.join(" ");

	if (unsupported.length > 0) {
		const warning = `\nwarning=Unsupported characters: ${Array.from(new Set(unsupported)).join(", ")}`;
		await message.reply(
			safeInline(encoded + warning, 1900),
		);
		return;
	}

	await message.reply(safeInline(encoded, 1900));
}

async function handleDecode(
	input: string,
	message: {
		reply: (content: string | object) => Promise<unknown>;
	},
): Promise<void> {
	const words = input.trim().split(/\s+\/\s+/);
	const decodedWords: string[] = [];

	for (const word of words) {
		const letters = word.trim().split(/\s+/);
		const decodedLetters: string[] = [];

		for (const code of letters) {
			if (code === "/") {
				continue;
			}

			const letter = REVERSE_MORSE[code];

			if (!letter) {
				await message.reply(
					`Unknown Morse code: \`${code}\``,
				);
				return;
			}

			decodedLetters.push(letter);
		}

		decodedWords.push(decodedLetters.join(""));
	}

	await message.reply(
		safeInline(decodedWords.join(" "), 1900),
	);
}
