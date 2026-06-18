import type { ChatCommandDefinition } from "#ChatCommands";

import { discordCommandTrees } from "./discord/index.js";
import { jdCommand } from "./jd/index.js";
import { remindCommand } from "./remind.js";
import { remindersCommand } from "./reminders.js";
import { shellCommandTrees } from "./shell/index.js";
import { toolsCommandTree } from "./tools/root.js";

export const chatCommandTrees: readonly ChatCommandDefinition[] = [
  remindCommand,
  remindersCommand,
  jdCommand,
  ...shellCommandTrees,
  toolsCommandTree,
  ...discordCommandTrees,
];
