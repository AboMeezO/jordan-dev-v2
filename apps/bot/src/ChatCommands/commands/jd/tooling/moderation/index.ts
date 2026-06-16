import { commandGroup } from "#ChatCommands";

import { auditCommand } from "./audit.js";
import { banCommand } from "./ban.js";
import { checkCommand } from "./check.js";
import { kickCommand } from "./kick.js";
import { lookupCommand } from "./lookup.js";
import { timeoutCommand } from "./timeout.js";
import { unbanCommand } from "./unban.js";
import { untimeoutCommand } from "./untimeout.js";

export const moderationGroup = commandGroup({
  aliases: ["mod"],
  description: "Moderation tools for server staff.",
  name: "moderation",
  permission: "moderator",
  subcommands: [
    auditCommand,
    lookupCommand,
    checkCommand,
    banCommand,
    unbanCommand,
    kickCommand,
    timeoutCommand,
    untimeoutCommand,
  ],
  usage: {
    examples: [
      {
        command: "jd tools moderation lookup @user",
        description: "Inspect a user before taking action.",
      },
      {
        command: "jd tools mod timeout @user 10m cooldown",
        description: "Use the short group alias for a timeout.",
      },
    ],
    formats: ["jd tools moderation <subcommand>", "jd tools mod <subcommand>"],
    useCases: ["Inspect users and perform Discord moderation actions."],
  },
});

