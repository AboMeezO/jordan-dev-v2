import type { ChatCommandDefinition } from "#ChatCommands";

import { jdCommand } from "./jd/index.js";

export const chatCommandTrees: readonly ChatCommandDefinition[] = [
  jdCommand,
];
