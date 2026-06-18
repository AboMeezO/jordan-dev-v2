import { colord, type RgbColor } from "colord";

import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const colorSchema = z.object({
  input: textInputSchema(100),
});

export const colorCommand = subcommand({
  name: "color",
  aliases: ["colour", "hex"],
  description: "Parse and convert colors between HEX, RGB, HSL, and decimal.",
  category: "Discord Tools",
  cooldown: 1_000,
  inputLimits: { maxInputLength: 100 },
  usage: {
    formats: ["color <input>"],
    arguments: [{ name: "input", description: "HEX, RGB, HSL, or decimal color.", required: true }],
    examples: [
      { command: "color #5865F2", description: "Convert Discord blurple." },
      { command: "color rgb(88, 101, 242)", description: "Convert RGB color." },
      { command: "color 5793266", description: "Convert decimal color." },
    ],
    useCases: ["Convert colors for Discord embeds or roles.", "Preview color values in different formats."],
  },
  async execute({ invocation, message }) {
    const raw = invocation.positionalArgs.join(" ").trim();
    const result = colorSchema.safeParse({ input: raw });

    if (!result.success) {
      await message.reply(result.error.issues.map((i) => i.message).join(", "));
      return;
    }

    const color = colord(result.data.input);

    if (!color.isValid()) {
      await message.reply("Invalid color input. Try formats like: #5865F2, rgb(88,101,242), hsl(235,86%,65%), or 5793266.");
      return;
    }

    const hex = color.toHex().toUpperCase();
    const rgb = color.toRgb();
    const hsl = color.toHsl();
    const decimal = rgbToDecimal(rgb);

    const lines = [
      `HEX=${hex}`,
      `RGB=rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`,
      `HSL=hsl(${Math.round(hsl.h)}, ${Math.round((hsl.s ?? 0) * 100)}%, ${Math.round((hsl.l ?? 0) * 100)}%)`,
      `decimal=${decimal}`,
    ];

    await message.reply(safeInline(lines.join("\n"), 1900));
  },
});

function rgbToDecimal(rgb: RgbColor): number {
  return (Math.round(rgb.r) << 16) | (Math.round(rgb.g) << 8) | Math.round(rgb.b);
}
