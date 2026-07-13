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
	description: "Developer utility tools.",
	name: "tools",
	permission: "public",
	subcommands: [
		base64Command,
		caseCommand,
		colorCommand,
		hashCommand,
		jsonCommand,
		morseCommand,
		slugCommand,
		snowflakeCommand,
		timestampCommand,
		urlCommand,
		uuidCommand,
	],
	usage: {
		examples: [
			{
				command: "tools base64 encode hello",
				description: "Encode Base64.",
			},
			{
				command: "tools json format '{\"a\":1}'",
				description: "Format JSON.",
			},
		],
		formats: ["tools <subcommand>"],
		useCases: [
			"Developer-oriented utilities for everyday tasks.",
		],
	},
});
