# Components V2 Panel Example

## File: `src/Reminders/reminder-panel.ts`

The reminder panel uses Components V2 to build an interactive message with:

- Accent-colored container
- Text display with summary
- Select menu to choose a reminder
- Action buttons (Edit message, Edit time, Toggle delivery, Cancel)

### Key Pattern

```ts
import {
	buildContainer,
	buildButtonRow,
} from "#ComponentsV2";
import type { ButtonInput } from "#ComponentsV2";

const container = new ContainerBuilder()
	.setAccentColor(0x02fe97)
	.addTextDisplayComponents(
		new TextDisplayBuilder().setContent(summary),
	)
	.addSeparatorComponents(
		new SeparatorBuilder().setDivider(true),
	)
	.addActionRowComponents(buildButtonRow(actionButtons));
```

See `src/ComponentsV2/` for all available helpers.
