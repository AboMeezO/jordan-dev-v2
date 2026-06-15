import type { ChatCommandDefinition } from "#ChatCommands";

import { jdCommand } from "./jd/index.js";
import { remindCommand } from "./remind.js";
import { remindersCommand } from "./reminders.js";

export const chatCommandTrees: readonly ChatCommandDefinition[] = [
  remindCommand,
  remindersCommand,
  jdCommand,
];
