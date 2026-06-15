import { subcommand } from "#ChatCommands";

export const pingCommand = subcommand({
  aliases: ["pong"],
  description: "Check that chat command dispatch works.",
  name: "ping",
  usage: {
    examples: [
      {
        command: "jd ping",
        description: "Reply with `pong`.",
      },
    ],
    formats: ["jd ping"],
    useCases: ["Smoke-test the chat command handler."],
  },
  async execute({ message }) {
    await message.reply("pong");
  },
});
