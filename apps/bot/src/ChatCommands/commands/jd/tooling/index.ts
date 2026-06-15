import { commandGroup } from "#ChatCommands";

import { argsCommand } from "./args.js";
import { moderationGroup } from "./moderation/index.js";

export const toolsGroup = commandGroup({
  description: "Developer utility examples.",
  name: "tools",
  subcommands: [argsCommand, moderationGroup],
  usage: {
    examples: [
      {
        command: 'jd tools args --env=prod "quoted text"',
        description: "Inspect parsed positional args and options.",
      },
    ],
    formats: ["jd tools <subcommand>"],
    useCases: ["Group developer-oriented utilities under one command path."],
  },
});

