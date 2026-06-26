import type { Client, Interaction } from "discord.js";

import {
	handleButton,
	handleModalSubmit,
} from "../../Verification/index.js";

export default async function (
	interaction: Interaction,
	client: Client,
): Promise<void> {
	if (interaction.isButton()) {
		if (
			!interaction.customId.startsWith("verify:") &&
			!interaction.customId.startsWith("admin:")
		) {
			return;
		}
		await handleButton(interaction, client);
		return;
	}

	if (interaction.isModalSubmit()) {
		if (
			!interaction.customId.startsWith("verify_section:") &&
			!interaction.customId.startsWith("verify_reject:")
		) {
			return;
		}
		await handleModalSubmit(interaction, client);
	}
}
