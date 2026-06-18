import { Octokit } from "@octokit/rest";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  TextDisplayBuilder,
} from "discord.js";
import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const ISSUE_PATTERN = /^([\w.-]+)\/([\w.-]+)(?:#|\s+)(\d+)$/;

const issueSchema = z.object({
  input: textInputSchema(300),
});

const STATE_COLORS: Record<string, number> = {
  open: 0x1f_88_3e,
  closed: 0x82_5a_df,
  merged: 0x6f_42_c1,
};

export const githubIssueCommand = subcommand({
  name: "issue",
  aliases: ["i"],
  description: "Fetch and display a GitHub issue summary.",
  category: "Git / GitHub Tools",
  cooldown: 5_000,
  inputLimits: { maxInputLength: 300 },
  availability: {
    contexts: ["guild", "dm"],
  },
  usage: {
    formats: ["github issue <owner/repo#number>"],
    arguments: [{ name: "issue", description: "Issue in owner/repo#number format or URL.", required: true }],
    examples: [
      { command: "github issue octocat/Hello-World#1", description: "Show issue #1." },
    ],
  },
  async execute({ invocation, message }) {
    const raw = invocation.positionalArgs.join(" ").trim();
    const result = issueSchema.safeParse({ input: raw });

    if (!result.success) {
      await message.reply(result.error.issues.map((i) => i.message).join(", "));
      return;
    }

    let input = result.data.input;

    if (input.startsWith("https://") || input.startsWith("http://")) {
      try {
        const parsed = new URL(input);
        const parts = parsed.pathname.replace(/\/$/, "").split("/");
        const issueIndex = parts.findIndex((p) => p === "issues");

        if (issueIndex === -1 || issueIndex + 2 >= parts.length) {
          await message.reply("Invalid GitHub issue URL.");
          return;
        }

        const owner = parts[issueIndex - 1] ?? "";
        const repo = parts[issueIndex + 1] ?? "";
        const issueNumber = parts[issueIndex + 2] ?? "";
        input = `${owner}/${repo}#${issueNumber}`;
      } catch {
        await message.reply("Invalid GitHub issue URL.");
        return;
      }
    }

    const match = input.match(ISSUE_PATTERN);

    if (!match) {
      await message.reply("Invalid format. Use owner/repo#number.");
      return;
    }

    const [, owner, repo, issueNumberStr] = match as [string, string, string, string];
    const issueNumber = parseInt(issueNumberStr ?? "0", 10);

    if (isNaN(issueNumber) || issueNumber < 1) {
      await message.reply("Invalid issue number.");
      return;
    }

    try {
      const response = await octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      const issue = response.data;
      const isPr = Boolean(issue.pull_request);
      const stateLabel = isPr && issue.state === "closed" && (issue as { merged?: boolean }).merged
        ? "merged"
        : issue.state ?? "open";
      const color = STATE_COLORS[stateLabel] ?? STATE_COLORS.open!;

      const labels = issue.labels
        .map((l) => (typeof l === "string" ? l : l.name))
        .filter(Boolean);

      const infoLines: string[] = [
        `${isPr ? "🔀" : "❕"} **${issue.title}**`,
        `**${stateLabel.toUpperCase()}** · #${issue.number} · ${issue.user?.login ?? "unknown"}`,
        `💬 ${issue.comments} comments · 📅 <t:${Math.floor(new Date(issue.created_at).getTime() / 1000)}:D>`,
      ];

      if (issue.closed_at) {
        infoLines.push(`✅ Closed <t:${Math.floor(new Date(issue.closed_at).getTime() / 1000)}:D>`);
      }

      if (labels.length > 0) {
        infoLines.push("");
        infoLines.push(labels.map((l) => `\`${l}\``).join(" "));
      }

      if (issue.assignee) {
        infoLines.push(`👤 Assigned to **${issue.assignee.login}**`);
      }

      if (issue.milestone) {
        infoLines.push(`🎯 Milestone: **${issue.milestone.title}**`);
      }

      const bodyExcerpt = (issue.body ?? "(no description)")
        .replace(/```[\s\S]*?```/g, "[code]")
        .slice(0, 500);

      if (bodyExcerpt) {
        infoLines.push("");
        infoLines.push(bodyExcerpt);
      }

      const container = new ContainerBuilder()
        .setAccentColor(color)
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(infoLines.join("\n")),
        )
        .addActionRowComponents(
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setLabel(`View ${isPr ? "PR" : "Issue"} #${issue.number}`)
              .setStyle(ButtonStyle.Link)
              .setURL(issue.html_url),
          ),
        );

      await message.reply({
        components: [container],
        content: "",
        embeds: [],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (error) {
      const status = (error as { status?: number }).status;

      if (status === 404) {
        await message.reply("Issue not found. Check the repository and issue number.");
      } else if (status === 403) {
        await message.reply("GitHub API rate limit exceeded.");
      } else {
        await message.reply("Could not fetch issue information.");
      }
    }
  },
});
