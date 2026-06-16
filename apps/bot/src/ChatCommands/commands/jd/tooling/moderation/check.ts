import { subcommand } from "#ChatCommands";

import { shellOutput } from "../../../shell/format.js";
import {
  parseModerationArgs,
  permissionNamesForMember,
  requireGuild,
  resolveModerationTarget,
  roleNamesForMember,
  targetLabel,
} from "./moderation-utils.js";

export const checkCommand = subcommand({
  description: "Check moderation action availability for a user.",
  name: "check",
  permission: "moderator",
  usage: {
    arguments: [
      { description: "User mention or Discord user ID.", name: "user" },
    ],
    examples: [
      {
        command: "jd tools moderation check @user",
        description: "Check whether the bot can ban, kick, or timeout the member.",
      },
    ],
    formats: ["jd tools moderation check <user>"],
    useCases: ["Verify hierarchy and permissions before moderation actions."],
  },
  async execute(context) {
    const guild = await requireGuild(context);

    if (!guild) {
      return;
    }

    const { targetId } = parseModerationArgs(context.invocation.rawArgs);
    const target = await resolveModerationTarget(context, guild, targetId);

    if (!target) {
      return;
    }

    const member = target.member;

    await context.message.reply(shellOutput([
      `target=${targetLabel(target)}`,
      `id=${target.id}`,
      `member=${member ? "yes" : "no"}`,
      `bannable=${member?.bannable ?? "id-ban-only"}`,
      `kickable=${member?.kickable ?? false}`,
      `moderatable=${member?.moderatable ?? false}`,
      `roles=${member ? roleNamesForMember(member).join(", ") || "none" : "not-member"}`,
      `permissions=${member ? permissionNamesForMember(member).join(", ") || "standard" : "not-member"}`,
    ]));
  },
});

