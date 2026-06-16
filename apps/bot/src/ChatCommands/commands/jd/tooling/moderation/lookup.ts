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

export const lookupCommand = subcommand({
  aliases: ["user"],
  description: "Lookup a user or server member.",
  name: "lookup",
  permission: "moderator",
  usage: {
    arguments: [
      { description: "User mention or Discord user ID.", name: "user" },
    ],
    examples: [
      {
        command: "jd tools moderation lookup @user",
        description: "Show account, member, role, and timeout state.",
      },
    ],
    formats: ["jd tools moderation lookup <user>"],
    useCases: ["Inspect a user before taking moderation action."],
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
    const user = target.user ?? member?.user;
    const timeoutUntil = member?.communicationDisabledUntil;

    await context.message.reply(shellOutput([
      `target=${targetLabel(target)}`,
      `id=${target.id}`,
      `bot=${user?.bot ?? false}`,
      `created=${user?.createdAt.toISOString() ?? "unknown"}`,
      `member=${member ? "yes" : "no"}`,
      `joined=${member?.joinedAt?.toISOString() ?? "not-member"}`,
      `timeout_until=${timeoutUntil?.toISOString() ?? "none"}`,
      `roles=${member ? roleNamesForMember(member).join(", ") || "none" : "not-member"}`,
      `permissions=${member ? permissionNamesForMember(member).join(", ") || "standard" : "not-member"}`,
    ]));
  },
});

