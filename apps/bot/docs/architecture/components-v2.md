# Components V2 Usage

## Overview

Discord's Components V2 (containers, text displays, separators, buttons) are used for rich interactive messages. Reusable helpers are in `src/ComponentsV2/`.

## Helpers

| Function                       | File           | Purpose                                        |
| ------------------------------ | -------------- | ---------------------------------------------- |
| `buildContainer()`             | `container.ts` | Build a ContainerBuilder with text and buttons |
| `buildButtonRow()`             | `buttons.ts`   | Build an ActionRow with ButtonBuilders         |
| `buildButtonRows()`            | `buttons.ts`   | Split buttons into multiple rows               |
| `buildTextDisplay()`           | `text.ts`      | Build a TextDisplayBuilder                     |
| `componentsV2Flags()`          | `flags.ts`     | MessageFlags.IsComponentsV2                    |
| `componentsV2EphemeralFlags()` | `flags.ts`     | IsComponentsV2 + Ephemeral                     |

## Usage

```ts
import {
	buildContainer,
	componentsV2Flags,
} from "#ComponentsV2";

const container = buildContainer({
	accentColor: 0x02fe97,
	content: "Hello world",
	buttons: [
		[{ customId: "btn_ok", label: "OK", style: "primary" }],
	],
});

await message.reply({
	components: [container],
	flags: componentsV2Flags(),
});
```

## Real Examples

- `src/Reminders/reminder-panel.ts` — reminder list/detail panel with select menu and action buttons
- `src/ProductionIncident/discord/runtime/production-incident-discord-service.ts` — incident message rendering
