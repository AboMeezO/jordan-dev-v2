import ms from "ms";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { extractOptionString } from "#ChatCommands";

const DISCORD_STYLES = ["t", "T", "d", "D", "f", "F", "R"] as const;

export const timestampCommand = subcommand({
  name: "timestamp",
  aliases: ["time", "discord-time"],
  description: "Generate Discord timestamps from dates or relative durations.",
  category: "Dev Utilities",
  cooldown: 1_000,
  inputLimits: { maxInputLength: 500 },
  usage: {
    formats: ["timestamp [input] [--style=t]"],
    arguments: [{ name: "input", description: "now, a date string, or relative duration like 2h, 30m, 7d.", required: false }],
    options: [
      { name: "style", description: "Discord timestamp style: t, T, d, D, f, F, R", valueName: "style" },
    ],
    examples: [
      { command: "timestamp now", description: "Current Discord timestamp." },
      { command: "timestamp 2h", description: "Timestamp 2 hours from now." },
      { command: "timestamp 2025-01-01 --style=R", description: "Relative timestamp for a date." },
    ],
    useCases: ["Create Discord timestamps for reminders or events.", "Convert relative durations to absolute timestamps."],
  },
  async execute({ invocation, message }) {
    const input = invocation.positionalArgs.join(" ").trim() || "now";
    const style = extractOptionString(invocation.options, "style") ?? "F";

    if (!DISCORD_STYLES.includes(style as typeof DISCORD_STYLES[number])) {
      await message.reply(
        `Invalid style. Use one of: ${DISCORD_STYLES.join(", ")}`,
      );
      return;
    }

    let date: Date;

    if (input === "now") {
      date = new Date();
    } else {
      const durationMs = ms(input as Parameters<typeof ms>[0]);

      if (durationMs !== undefined) {
        date = new Date(Date.now() + durationMs);
      } else {
        const parsed = new Date(input);

        if (isNaN(parsed.getTime())) {
          await message.reply(
            "Could not parse input. Use 'now', a relative duration (e.g. 2h, 30m, 7d), or a date string.",
          );
          return;
        }

        date = parsed;
      }
    }

    const unixSeconds = Math.floor(date.getTime() / 1000);
    const discordTag = `<t:${unixSeconds}:${style}>`;
    const lines = [
      `unix=${unixSeconds}`,
      `iso=${date.toISOString()}`,
      `discord=${discordTag}`,
    ];

    if (style !== "R") {
      lines.push(`relative=<t:${unixSeconds}:R>`);
    }

    if (style !== "F") {
      lines.push(`full=<t:${unixSeconds}:F>`);
    }

    await message.reply(safeInline(lines.join("\n"), 1900));
  },
});
