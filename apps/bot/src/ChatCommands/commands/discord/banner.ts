import { z } from "zod";

import { commandTree } from "#ChatCommands";
import { discordSnowflakeSchema, extractOptionString } from "#ChatCommands";

const SUPPORTED_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096] as const;

const bannerSchema = z.object({
  userId: discordSnowflakeSchema().optional(),
  size: z.coerce.number().int().refine((s) => (SUPPORTED_SIZES as readonly number[]).includes(s), {
    message: `Size must be one of: ${SUPPORTED_SIZES.join(", ")}`,
  }).default(1024).optional(),
});

export const bannerCommand = commandTree({
  aliases: ["user-banner"],
  allowPrefixless: true,
  description: "Display a user's Discord profile banner or accent color.",
  name: "banner",
  permission: "public",
  category: "Discord Tools",
  cooldown: 2_000,
  availability: {
    contexts: ["guild", "dm"],
  },
  usage: {
    formats: ["banner [user mention or ID] [--size=1024]"],
    arguments: [
      { name: "user", description: "User mention or ID. Defaults to you.", required: false },
    ],
    options: [
      { name: "size", description: "Image size (16-4096)", valueName: "px" },
    ],
    examples: [
      { command: "banner", description: "Your banner." },
      { command: "banner <@123456789012345678>", description: "Another user's banner." },
    ],
  },
  async execute({ invocation, message, client }) {
    const rawId = invocation.positionalArgs[0]?.replace(/[<@!>]/g, "") ?? message.author.id;

    const result = bannerSchema.safeParse({
      userId: rawId,
      size: extractOptionString(invocation.options, "size"),
    });

    if (!result.success) {
      await message.reply(result.error.issues.map((i) => i.message).join(", "));
      return;
    }

    const size = result.data.size ?? 1024;

    try {
      const user = await client.users.fetch(rawId, { force: true });

      if (!user) {
        await message.reply("User not found.");
        return;
      }

      const bannerUrl = user.bannerURL({ size, extension: "png" });
      const gifBannerUrl = user.banner?.startsWith("a_")
        ? user.bannerURL({ size, extension: "gif" })
        : undefined;

      if (bannerUrl) {
        const links = [`user=${user.username}`, `banner=${bannerUrl}`];

        if (gifBannerUrl) {
          links.push(`animated=${gifBannerUrl}`);
        }

        await message.reply(links.join("\n"));
      } else if (user.hexAccentColor) {
        await message.reply(
          `user=${user.username}\naccent_color=${user.hexAccentColor}\nNo banner set.`,
        );
      } else {
        await message.reply("This user has no banner or accent color.");
      }
    } catch {
      await message.reply("Could not fetch that user's banner.");
    }
  },
});
