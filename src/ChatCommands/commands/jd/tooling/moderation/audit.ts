import { subcommand } from "#ChatCommands";

export const auditCommand = subcommand({
  description: "Moderator-only nested command example.",
  name: "audit",
  usage: {
    examples: [
      {
        command: "jd tools moderation audit",
        description: "Reach a deeply nested moderator command.",
      },
    ],
    formats: ["jd tools moderation audit"],
    useCases: ["Verify inherited moderator permissions on nested groups."],
  },
  async execute({ message }) {
    await message.reply("Audit command reached.");
  },
});

