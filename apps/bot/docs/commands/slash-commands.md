# Slash Command Reference

## File Format

Slash command files are standard discord.js slash commands placed in `src/Commands/`. They use the discord.js `SlashCommandBuilder`:

```ts
import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("mycommand")
    .setDescription("Does something");

export async function execute(interaction) {
    await interaction.reply("Done!");
}
```

CommandKit handles registration and discovery automatically.
