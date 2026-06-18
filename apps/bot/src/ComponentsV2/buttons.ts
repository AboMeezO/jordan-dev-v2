import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} from "discord.js";

import type { ButtonInput } from "./types.js";

const STYLE_MAP: Record<
	ButtonInput["style"],
	ButtonStyle
> = {
	danger: ButtonStyle.Danger,
	primary: ButtonStyle.Primary,
	secondary: ButtonStyle.Secondary,
	success: ButtonStyle.Success,
};

export function buildButtonRow(
	buttons: ButtonInput[],
): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		...buttons.map(buildButton),
	);
}

export function buildButtonRows(
	buttons: ButtonInput[],
	perRow: number = 5,
): ActionRowBuilder<ButtonBuilder>[] {
	const rows: ActionRowBuilder<ButtonBuilder>[] = [];

	for (let i = 0; i < buttons.length; i += perRow) {
		const row = buttons.slice(i, i + perRow);
		rows.push(buildButtonRow(row));
	}

	return rows;
}

function buildButton(input: ButtonInput): ButtonBuilder {
	return new ButtonBuilder()
		.setCustomId(input.customId)
		.setLabel(input.label)
		.setStyle(STYLE_MAP[input.style])
		.setDisabled(input.disabled ?? false);
}
