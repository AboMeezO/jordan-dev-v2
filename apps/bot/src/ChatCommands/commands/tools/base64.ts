import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { extractOptionString, modeSchema, textInputSchema } from "#ChatCommands";

const base64Schema = z.object({
  mode: modeSchema(["encode", "decode"], "encode"),
  input: textInputSchema(50_000),
});

export const base64Command = subcommand({
  name: "base64",
  aliases: ["b64"],
  description: "Encode and decode Base64 text.",
  category: "Dev Utilities",
  cooldown: 1_000,
  inputLimits: { maxInputLength: 50_000 },
  outputMode: "inline-or-attachment",
  usage: {
    formats: ["base64 [mode] <input>"],
    arguments: [{ name: "input", description: "Text to encode or decode.", required: true }],
    options: [
      { name: "mode", description: "encode or decode", valueName: "mode" },
    ],
    examples: [
      { command: 'base64 encode "hello world"', description: "Encode text to Base64." },
      { command: 'base64 decode "aGVsbG8="', description: "Decode Base64 to text." },
    ],
    useCases: ["Quickly encode or decode Base64 without leaving Discord."],
  },
  async execute({ invocation, message }) {
    const result = base64Schema.safeParse({
      mode: extractOptionString(invocation.options, "mode"),
      input: invocation.positionalArgs.join(" "),
    });

    if (!result.success) {
      await message.reply(result.error.issues.map((i) => i.message).join(", "));
      return;
    }

    try {
      if (result.data.mode === "encode") {
        const encoded = Buffer.from(result.data.input, "utf-8").toString("base64");
        await message.reply(safeInline(encoded, 1900));
      } else {
        const decoded = Buffer.from(result.data.input, "base64").toString("utf-8");
        const hasBinary = /[\x00-\x08\x0E-\x1F]/.test(decoded);

        if (hasBinary) {
          await message.reply("Decoded output contains binary data and cannot be displayed as text.");
          return;
        }

        await message.reply(safeInline(decoded, 1900));
      }
    } catch {
      await message.reply("Invalid input. Check your text or Base64 encoding.");
    }
  },
});
