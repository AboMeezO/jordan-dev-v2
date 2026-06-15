import type { Client, Interaction } from "discord.js";

import { ProductionIncidentDiscordService } from "../../ProductionIncident/discord/index.js";

export default async function (
  interaction: Interaction,
  client: Client,
): Promise<void> {
  if (!interaction.isButton() || !interaction.customId.startsWith("pi:")) {
    return;
  }

  const service = ProductionIncidentDiscordService.getInstance();
  service.attachClient(client);
  await service.handleButtonInteraction(interaction);
}

