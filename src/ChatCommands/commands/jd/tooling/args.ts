import { subcommand } from "#ChatCommands";

export const argsCommand = subcommand({
  description: "Show how the shell-like parser understood your input.",
  name: "args",
  usage: {
    arguments: [
      {
        description: "Any free-form text to inspect.",
        name: "input",
        required: false,
      },
    ],
    examples: [
      {
        command: 'jd tools args --env=prod "quoted text"',
        description: "Show parsed options and positional args.",
      },
    ],
    formats: ["jd tools args [options] [input]"],
    options: [
      {
        description: "Example environment option.",
        name: "env",
        valueName: "name",
      },
    ],
    useCases: ["Debug command parsing while building new commands."],
  },
  async execute({ invocation, message }) {
    await message.reply(
      [
        `path: ${invocation.commandPath.join(" ")}`,
        `args: ${JSON.stringify(invocation.positionalArgs)}`,
        `options: ${JSON.stringify(invocation.options)}`,
      ].join("\n"),
    );
  },
});

