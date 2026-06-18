import type { ChatCommandDefinition } from "#ChatCommands";

import { discordCommandTrees } from "./discord/index.js";
import { githubCommandTree } from "./github/index.js";
import { jdCommand } from "./jd/index.js";
import { netCommandTree } from "./net/index.js";
import { remindCommand, remindersCommand } from "./reminders/index.js";
import { shellCommandTrees } from "./shell/index.js";
import { toolsCommandTree } from "./tools/root.js";

export const chatCommandTrees: readonly ChatCommandDefinition[] =
	[
		remindCommand,
		remindersCommand,
		jdCommand,
		...shellCommandTrees,
		toolsCommandTree,
		...discordCommandTrees,
		githubCommandTree,
		netCommandTree,
	];
