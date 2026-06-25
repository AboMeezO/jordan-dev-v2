import type { ChatInputCommandInteraction } from "discord.js";

import {
	productionIncidentCommandData,
	ProductionIncidentDiscordService,
} from "../../ProductionIncident/discord/index.js";

export const data = productionIncidentCommandData;

export async function run({
	interaction,
}: {
	readonly interaction: ChatInputCommandInteraction;
}): Promise<void> {
	if (interaction.options.getSubcommand() !== "incident") {
		await interaction.reply({
			content: "Unknown developer command.",
			ephemeral: true,
		});
		return;
	}

	const service =
		ProductionIncidentDiscordService.getInstance();
	service.attachClient(interaction.client);
	await service.handleStartCommand(interaction);
}
