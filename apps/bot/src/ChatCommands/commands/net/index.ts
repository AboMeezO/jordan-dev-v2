import { commandTree } from "#ChatCommands";

import { dnsCommand } from "./dns.js";
import { jwtCommand } from "./jwt.js";
import { regexCommand } from "./regex_.js";
import { urlScanCommand } from "./url-scan.js";
import { whoisCommand } from "./whois.js";

export const netCommandTree = commandTree({
	name: "net",
	aliases: ["network", "security"],
	description: "Network and security tools.",
	category: "Network / Security Tools",
	cooldown: 1_000,
	availability: {
		contexts: ["guild", "dm"],
	},
	subcommands: [
		dnsCommand,
		regexCommand,
		urlScanCommand,
		whoisCommand,
		jwtCommand,
	],
});
