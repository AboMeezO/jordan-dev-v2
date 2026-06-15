import { commandGroup } from "#ChatCommands";

import { auditCommand } from "./audit.js";

export const moderationGroup = commandGroup({
  description: "Nested moderation examples.",
  name: "moderation",
  permission: "moderator",
  subcommands: [auditCommand],
  usage: {
    formats: ["jd tools moderation <subcommand>"],
    useCases: ["Keep moderator-only tooling below a nested group."],
  },
});

