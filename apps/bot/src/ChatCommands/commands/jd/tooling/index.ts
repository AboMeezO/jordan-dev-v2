import { commandGroup } from "#ChatCommands";

import { argsCommand } from "./args.js";
import { moderationGroup } from "./moderation/index.js";
import { base64Command } from "../../tools/base64.js";
import { caseCommand } from "../../tools/case_.js";
import { colorCommand } from "../../tools/color.js";
import { hashCommand } from "../../tools/hash.js";
import { jsonCommand } from "../../tools/json.js";
import { morseCommand } from "../../tools/morse.js";
import { slugCommand } from "../../tools/slug.js";
import { snowflakeCommand } from "../../tools/snowflake.js";
import { timestampCommand } from "../../tools/timestamp.js";
import { urlCommand } from "../../tools/url.js";
import { uuidCommand } from "../../tools/uuid.js";

export const toolsGroup = commandGroup({
  description: "Developer utility tools.",
  name: "tools",
  category: "Dev Utilities",
  subcommands: [
    argsCommand,
    moderationGroup,
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
  usage: {
    examples: [
      {
        command: 'jd tools args --env=prod "quoted text"',
        description: "Inspect parsed positional args and options.",
      },
      {
        command: 'jd tools json format \'{"a":1}\'',
        description: "Format JSON.",
      },
      {
        command: "jd tools base64 encode hello",
        description: "Encode Base64.",
      },
    ],
    formats: ["jd tools <subcommand>"],
    useCases: ["Developer-oriented utilities for everyday tasks."],
  },
});

