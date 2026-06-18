import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";
import { safeFetch } from "#ChatCommands";

const urlScanSchema = z.object({
  url: textInputSchema(2000),
});

export const urlScanCommand = subcommand({
  name: "url-scan",
  aliases: ["scan-url", "check-url"],
  description: "Scan a URL to check its safety and response status.",
  category: "Network / Security Tools",
  cooldown: 5_000,
  inputLimits: { maxInputLength: 2000 },
  availability: {
    contexts: ["guild", "dm"],
  },
  usage: {
    formats: ["url-scan <url>"],
    arguments: [{ name: "url", description: "Full URL to scan (https://...).", required: true }],
    examples: [
      { command: "url-scan https://example.com", description: "Check URL safety." },
    ],
  },
  async execute({ invocation, message }) {
    const raw = invocation.positionalArgs.join(" ").trim();
    const parsed = urlScanSchema.safeParse({ url: raw });

    if (!parsed.success) {
      await message.reply(parsed.error.issues.map((i) => i.message).join(", "));
      return;
    }

    const url = parsed.data.url;

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      await message.reply("URL must start with http:// or https://");
      return;
    }

    try {
      const startTime = Date.now();
      const response = await safeFetch(url);
      const elapsed = Date.now() - startTime;

      const headers: Record<string, string> = {};

      for (const [key, value] of Object.entries(response.headers)) {
        headers[key] = value.length > 100 ? value.slice(0, 100) + "..." : value;
      }

      const lines = [
        `url=${url}`,
        `status=${response.status}`,
        `status_text=${response.statusText || "OK"}`,
        `timing=${elapsed}ms`,
        `content_type=${headers["content-type"] ?? "(unknown)"}`,
        `        content_length=${headers["content-length"] ?? "(unknown)"}`,
        `server=${headers.server ?? "(unknown)"}`,
      ];

      if (headers["x-frame-options"]) {
        lines.push(`x_frame_options=${headers["x-frame-options"]}`);
      }

      if (headers["strict-transport-security"]) {
        lines.push(`hsts_present=true`);
      }

      await message.reply(safeInline(lines.join("\n"), 1900));
    } catch (error) {
      const err = error as Error;

      if (err.message.includes("blocked") || err.message.includes("private") || err.message.includes("loopback")) {
        await message.reply("URL blocked: targets a private or internal network address.");
      } else if (err.message.includes("ENOTFOUND")) {
        await message.reply("URL could not be resolved.");
      } else if (err.message.includes("timeout")) {
        await message.reply("URL request timed out.");
      } else if (err.message.includes("certificate")) {
        await message.reply("SSL/TLS certificate error.");
      } else {
        await message.reply(`Scan failed: ${err.message}`);
      }
    }
  },
});
