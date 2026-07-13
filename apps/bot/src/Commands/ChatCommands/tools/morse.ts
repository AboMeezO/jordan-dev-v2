import { subcommand } from "#ChatCommands";

const morseAlphabet: Record<string, string> = {
	a: ".-",
	b: "-...",
	c: "-.-.",
	d: "-..",
	e: ".",
	f: "..-.",
	g: "--.",
	h: "....",
	i: "..",
	j: ".---",
	k: "-.-",
	l: ".-..",
	m: "--",
	n: "-.",
	o: "---",
	p: ".--.",
	q: "--.-",
	r: ".-.",
	s: "...",
	t: "-",
	u: "..-",
	v: "...-",
	w: ".--",
	x: "-..-",
	y: "-.--",
	z: "--..",
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
	"!": "-.-.--",
	":": "---...",
	";": "-.-.-.",
	"'": ".----.",
	'"': ".-..-.",
	"(": "-.--.",
	")": "-.--.-",
	"[": "-.--.",
	"]": "-.--.-",
	"{": "-.--.",
	"}": "-.--.-",
	"&": ".-...",
	"*": "-..-",
	"@": ".--.-.",
	" ": "/",
};

const reverseMorse: Record<string, string> = {};
for (const [char, code] of Object.entries(morseAlphabet)) {
	reverseMorse[code] = char;
}

function encodeToMorse(text: string): string {
	return text
		.toLowerCase()
		.split("")
		.map((ch) => morseAlphabet[ch] ?? ch)
		.join(" ");
}

function decodeFromMorse(code: string): string {
	return code
		.split(" ")
		.map((symbol) => reverseMorse[symbol] ?? symbol)
		.join("");
}

export const morseCommand = subcommand({
	description: "Encode or decode Morse code.",
	name: "morse",
	usage: {
		arguments: [
			{
				description: "Action: encode or decode.",
				name: "action",
				required: true,
			},
			{
				description: "Text or Morse code to convert.",
				name: "input",
				required: true,
			},
		],
		examples: [
			{
				command: "tools morse encode hello",
				description: "Encode text to Morse.",
			},
			{
				command: "tools morse decode .... . .-.. .-.. ---",
				description: "Decode Morse to text.",
			},
		],
		formats: ["tools morse <encode|decode> <input>"],
		useCases: [
			"Encode or decode Morse code messages.",
		],
	},
	async execute({ invocation, message }) {
		const [action, ...rest] = invocation.positionalArgs;
		const input = rest.join(" ");
		if (!action || !input) {
			await message.reply("Usage: `tools morse <encode|decode> <input>`");
			return;
		}

		try {
			const result =
				action === "encode"
					? encodeToMorse(input)
					: action === "decode"
						? decodeFromMorse(input)
						: null;

			if (result === null) {
				await message.reply("Action must be `encode` or `decode`.");
				return;
			}

			await message.reply(`\`\`\`\n${result}\n\`\`\``);
		} catch {
			await message.reply("Failed to process Morse code.");
		}
	},
});
