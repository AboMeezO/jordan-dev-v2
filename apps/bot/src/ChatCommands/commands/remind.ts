import { commandTree } from "#ChatCommands";

import {
  parsePrefixReminderArgs,
  scheduleReminder,
} from "../../Reminders/reminder-command.js";

export const remindCommand = commandTree({
  description: "Schedule a reminder.",
  name: "remind",
  permission: "public",
  usage: {
    arguments: [
      {
        description:
          "When the reminder should fire. Supports multi-part relative times (e.g. `9d 12h`, `in 1w 2d 12h 30m`).",
        name: "time",
      },
      {
        description: "The reminder text.",
        name: "message",
      },
    ],
    examples: [
      {
        command: "!remind 10m check deploy",
        description: "Remind you in this channel after ten minutes.",
      },
      {
        command: "!remind 9d 12h ship it",
        description: "Remind you after 9 days and 12 hours.",
      },
      {
        command: "!remind --dm --time 9d 12h shall i remember my madness",
        description: "Send a DM reminder after 9 days and 12 hours.",
      },
      {
        command: "!remind --time=9d 12h ship it",
        description: "Use an inline flag to specify the time",
      },
      {
        command: "!remind --dm 09:30 standup",
        description: "Send the reminder to your DMs at 09:30.",
      },
    ],
    formats: [
      "!remind <time> <message>",
      "!remind --dm <time> <message>",
      "!remind --time=<time> <message>",
      "!remind --dm --time=<time> <message>",
    ],
    options: [
      {
        description: "Send the reminder privately instead of in this channel.",
        name: "dm",
      },
      {
        description:
          "Explicitly set the time (can also be inline: `--time=<time>`)",
        name: "time",
      },
      {
        description:
          "Explicitly set a date and time (can also be inline: `--at=<date>`)",
        name: "at",
      },
      {
        description:
          "Explicitly set a relative time (can also be inline: `--in=<time>`)",
        name: "in",
      },
    ],
    useCases: [
      "Set a quick follow-up while discussing work in Discord.",
      "Send yourself a private reminder for later.",
      "Schedule a reminder using combined units (e.g. weeks, days, hours, and minutes).",
    ],
  },
  async execute({ client, invocation, message }) {
    const {
      delivery,
      message: reminderMessage,
      time,
    } = parsePrefixReminderArgs(invocation.rawArgs);

    if (!time || reminderMessage.length === 0) {
      await message.reply(
        `Usage: \`${invocation.prefix}remind 10m check deploy\` or \`${invocation.prefix}remind --dm 09:30 standup\`.`,
      );
      return;
    }

    try {
      const result = await scheduleReminder({
        channelId: message.channelId,
        client,
        delivery,
        message: reminderMessage,
        time,
        userId: message.author.id,
      });

      await message.reply(
        `Reminder set for <t:${Math.floor(result.remindAt.getTime() / 1000)}:R> in ${
          result.delivery === "dm" ? "your DMs" : "this channel"
        }.`,
      );
    } catch (error) {
      await message.reply(
        error instanceof Error ? error.message : "Failed to set reminder.",
      );
    }
  },
});
