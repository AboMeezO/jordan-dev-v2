import { commandTree } from "#ChatCommands";

import { base64Command } from "./base64.js";
import { caseCommand } from "./case_.js";
import { colorCommand } from "./color.js";
import { hashCommand } from "./hash.js";
import { jsonCommand } from "./json.js";
import { morseCommand } from "./morse.js";
import { slugCommand } from "./slug.js";
import { snowflakeCommand } from "./snowflake.js";
import { timestampCommand } from "./timestamp.js";
import { urlCommand } from "./url.js";
import { uuidCommand } from "./uuid.js";

export const toolsCommandTree = commandTree({
  name: "tools",
  aliases: ["tool"],
  description: "Developer utility tools.",
  category: "Dev Utilities",
  cooldown: 1_000,
  availability: {
    contexts: ["guild", "dm"],
  },
  subcommands: [
    jsonCommand,
    base64Command,
    urlCommand,
    hashCommand,
    uuidCommand,
    timestampCommand,
    caseCommand,
    slugCommand,
    morseCommand,
    snowflakeCommand,
    colorCommand,
  ],
});
