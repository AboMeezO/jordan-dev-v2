import { Octokit } from "@octokit/rest";

import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const ISSUE_PATTERN = /^([\w.-]+)\/([\w.-]+)(?:#|\s+)(\d+)$/;

const issueSchema = z.object({
  input: textInputSchema(300),
});

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
      const labels = issue.labels
        .map((l) => (typeof l === "string" ? l : l.name))
        .filter(Boolean)
        .join(", ");

      const bodyExcerpt = (issue.body ?? "(no description)")
        .replace(/```[\s\S]*?```/g, "[code]")
        .slice(0, 500);

      const lines = [
        `title=${issue.title}`,
        `number=#${issue.number}`,
        `state=${issue.state}`,
        `author=${issue.user?.login ?? "unknown"}`,
        `created=${new Date(issue.created_at).toISOString().split("T")[0]}`,
        `comments=${issue.comments}`,
        `labels=${labels || "(none)"}`,
      ];

      if (isPr) {
        lines.push("type=pull-request");
      }

      if (issue.assignee) {
        lines.push(`assignee=${issue.assignee.login}`);
      }

      if (issue.milestone) {
        lines.push(`milestone=${issue.milestone.title}`);
      }

      if (issue.closed_at) {
        lines.push(`closed=${new Date(issue.closed_at).toISOString().split("T")[0]}`);
      }

      lines.push(`body=${bodyExcerpt}`);
      lines.push(`url=${issue.html_url}`);

      await message.reply(safeInline(lines.join("\n"), 1900));
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
