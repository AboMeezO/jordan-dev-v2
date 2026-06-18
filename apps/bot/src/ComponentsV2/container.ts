import {
	ContainerBuilder,
	SeparatorBuilder,
} from "discord.js";

import { buildButtonRow } from "./buttons.js";
import { buildTextDisplay } from "./text.js";
import type { ContainerInput } from "./types.js";

export function buildContainer(
	input: ContainerInput,
): ContainerBuilder {
	const container = new ContainerBuilder();

	if (input.accentColor !== undefined) {
		container.setAccentColor(input.accentColor);
	}

	container.addTextDisplayComponents(
		buildTextDisplay(input.content),
	);

	if (input.buttons && input.buttons.length > 0) {
		container.addSeparatorComponents(
			new SeparatorBuilder().setDivider(true),
		);

		for (const row of input.buttons) {
			container.addActionRowComponents(
				buildButtonRow(row),
			);
		}
	}

	return container;
}
