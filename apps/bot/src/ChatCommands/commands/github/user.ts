import { Octokit } from "@octokit/rest";

import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { extractOptionString, textInputSchema } from "#ChatCommands";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const userSchema = z.object({
  input: textInputSchema(200),
});

export const githubUserCommand = subcommand({
  name: "user",
  aliases: ["u"],
  description: "Fetch and display a GitHub user profile summary.",
  category: "Git / GitHub Tools",
  cooldown: 5_000,
  inputLimits: { maxInputLength: 200 },
  availability: {
    contexts: ["guild", "dm"],
  },
  usage: {
    formats: ["github user <username>"],
    arguments: [{ name: "username", description: "GitHub username or profile URL.", required: true }],
    examples: [
      { command: "github user octocat", description: "Show GitHub profile for octocat." },
    ],
  },
  async execute({ invocation, message }) {
    const raw = invocation.positionalArgs.join(" ").trim();
    const result = userSchema.safeParse({ input: raw });

    if (!result.success) {
      await message.reply(result.error.issues.map((i) => i.message).join(", "));
      return;
    }

    let username = result.data.input;

    if (username.startsWith("https://") || username.startsWith("http://")) {
      try {
        const parsed = new URL(username);
        const parts = parsed.pathname.replace(/\/$/, "").split("/");
        username = parts[parts.length - 1] ?? "";
      } catch {
        await message.reply("Invalid GitHub profile URL.");
        return;
      }
    }

    try {
      const response = await octokit.rest.users.getByUsername({ username });
      const user = response.data;

      const lines = [
        `login=${user.login}`,
        `name=${user.name ?? "(not set)"}`,
        `bio=${(user.bio ?? "(no bio)").slice(0, 200)}`,
        `public_repos=${user.public_repos}`,
        `followers=${user.followers}`,
        `following=${user.following}`,
        `created=${new Date(user.created_at).toISOString().split("T")[0]}`,
        `url=${user.html_url}`,
      ];

      if (user.company) {
        lines.splice(3, 0, `company=${user.company}`);
      }

      if (user.location) {
        lines.splice(4, 0, `location=${user.location}`);
      }

      await message.reply(safeInline(lines.join("\n"), 1900));
    } catch (error) {
      const status = (error as { status?: number }).status;

      if (status === 404) {
        await message.reply(`GitHub user "${username}" not found.`);
      } else if (status === 403) {
        await message.reply("GitHub API rate limit exceeded. Try again later.");
      } else {
        await message.reply("Could not fetch GitHub user information.");
      }
    }
  },
});
