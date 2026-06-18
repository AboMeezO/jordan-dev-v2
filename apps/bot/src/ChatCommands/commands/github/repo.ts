import { Octokit } from "@octokit/rest";

import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const REPO_PATTERN = /^([\w.-]+)\/([\w.-]+)$/;

const repoSchema = z.object({
  input: textInputSchema(200),
});

export const githubRepoCommand = subcommand({
  name: "repo",
  aliases: ["r"],
  description: "Fetch and display a GitHub repository summary.",
  category: "Git / GitHub Tools",
  cooldown: 5_000,
  inputLimits: { maxInputLength: 200 },
  availability: {
    contexts: ["guild", "dm"],
  },
  usage: {
    formats: ["github repo <owner/repo>"],
    arguments: [{ name: "repo", description: "Repository in owner/repo format or URL.", required: true }],
    examples: [
      { command: "github repo octocat/Hello-World", description: "Show repository info." },
    ],
  },
  async execute({ invocation, message }) {
    const raw = invocation.positionalArgs.join(" ").trim();
    const result = repoSchema.safeParse({ input: raw });

    if (!result.success) {
      await message.reply(result.error.issues.map((i) => i.message).join(", "));
      return;
    }

    let input = result.data.input;

    if (input.startsWith("https://") || input.startsWith("http://")) {
      try {
        const parsed = new URL(input);
        const parts = parsed.pathname.replace(/\/$/, "").split("/");
        const owner = parts[parts.length - 2];
        const repo = parts[parts.length - 1];

        if (!owner || !repo) {
          await message.reply("Invalid GitHub URL.");
          return;
        }

        input = `${owner}/${repo}`;
      } catch {
        await message.reply("Invalid GitHub URL.");
        return;
      }
    }

    const match = input.match(REPO_PATTERN);

    if (!match) {
      await message.reply("Invalid repository format. Use owner/repo.");
      return;
    }

    const [, owner, repo] = match as [string, string, string];

    try {
      const response = await octokit.rest.repos.get({ owner, repo });
      const r = response.data;

      const lines = [
        `name=${r.full_name}`,
        `description=${r.description ?? "(no description)"}`,
        `stars=${r.stargazers_count}`,
        `forks=${r.forks_count}`,
        `open_issues=${r.open_issues_count}`,
        `language=${r.language ?? "(none)"}`,
        `license=${r.license?.spdx_id ?? "(none)"}`,
        `default_branch=${r.default_branch}`,
        `created=${new Date(r.created_at).toISOString().split("T")[0]}`,
        `updated=${new Date(r.updated_at).toISOString().split("T")[0]}`,
        `url=${r.html_url}`,
      ];

      if (r.archived) {
        lines.push("archived=true");
      }

      if (r.fork) {
        lines.push("fork=true");
      }

      if (r.topics && r.topics.length > 0) {
        lines.push(`topics=${r.topics.slice(0, 10).join(", ")}`);
      }

      try {
        const release = await octokit.rest.repos.getLatestRelease({ owner, repo });
        lines.push(`latest_release=${release.data.tag_name}`);
      } catch {
        // No release found, skip
      }

      await message.reply(safeInline(lines.join("\n"), 1900));
    } catch (error) {
      const status = (error as { status?: number }).status;

      if (status === 404) {
        await message.reply(`Repository "${owner}/${repo}" not found.`);
      } else if (status === 403) {
        await message.reply("GitHub API rate limit exceeded.");
      } else {
        await message.reply("Could not fetch repository information.");
      }
    }
  },
});
