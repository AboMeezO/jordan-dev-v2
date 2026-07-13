import { subcommand } from "#ChatCommands";
import { colord } from "colord";

export const colorCommand = subcommand({
	description: "Parse, convert, and manipulate colors.",
	name: "color",
	usage: {
		arguments: [
			{
				description: "Color value in any format (hex, rgb, hsl, etc.).",
				name: "value",
				required: true,
			},
		],
		examples: [
			{
				command: "tools color #ff6600",
				description: "Show color info for an orange hex.",
			},
			{
				command: "tools color rgb(255, 0, 0)",
				description: "Show color info for red.",
			},
		],
		formats: ["tools color <value>"],
		useCases: [
			"Convert colors between formats or inspect their components.",
		],
	},
	async execute({ invocation, message }) {
		const value = invocation.positionalArgs.join(" ");
		if (!value) {
			await message.reply("Usage: `tools color <color-value>`");
			return;
		}

		const c = colord(value);
		if (!c.isValid()) {
			await message.reply(`Invalid color value: \`${value}\``);
			return;
		}

		await message.reply(
			[
				`Input: \`${value}\``,
				`Hex: \`${c.toHex()}\``,
				`RGB: \`${c.toRgbString()}\``,
				`HSL: \`${c.toHslString()}\``,
				`Alpha: \`${c.alpha()}\``,
			].join("\n"),
		);
	},
});
