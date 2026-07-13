import type { ChatCommandDefinition } from "#ChatCommands";

import { discordCommandTrees } from "../ChatCommands/discord/index.js";
import { githubCommandTree } from "../ChatCommands/github/index.js";
import { jdCommand } from "../ChatCommands/jd/index.js";
import { netCommandTree } from "../ChatCommands/net/index.js";
import {
	remindCommand,
	remindersCommand,
} from "../ChatCommands/reminders/index.js";
import { shellCommandTrees } from "../ChatCommands/shell/index.js";
import { toolsCommandTree } from "../ChatCommands/tools/root.js";

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
