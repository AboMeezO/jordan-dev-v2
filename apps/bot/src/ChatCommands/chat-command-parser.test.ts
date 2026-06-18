import assert from "node:assert/strict";

import {
	commandGroup,
	commandTree,
	subcommand,
} from "./hierarchy.js";
import { parseChatCommandInput } from "./parser.js";
import { ChatCommandRegistry } from "./registry.js";
import { renderUsageGuide } from "./usage-guide.js";

const parsed = parseChatCommandInput(
	"!dev incident start --channel=ops 'quoted reason' | grep fail",
	"!",
);

assert.ok(parsed);
assert.deepEqual(parsed.segments[0]?.words, [
	"dev",
	"incident",
	"start",
	"--channel=ops",
	"quoted reason",
]);
assert.deepEqual(parsed.segments[0]?.operators, [
	{ index: 5, value: "|" },
]);
assert.deepEqual(parsed.segments[1]?.words, [
	"grep",
	"fail",
]);

const registry = new ChatCommandRegistry();
registry.register(
	commandTree({
		allowPrefixless: true,
		description: "Developer tools.",
		name: "dev",
		permission: "guild-member",
		subcommands: [
			commandGroup({
				description: "Production Incident tools.",
				name: "incident",
				permission: "moderator",
				subcommands: [
					subcommand({
						description: "Start an incident.",
						name: "start",
						permission: "administrator",
						execute() {
							return undefined;
						},
					}),
				],
			}),
		],
	}),
);

registry.register(
	commandTree({
		description: "Prefix-only reminder tree.",
		name: "remind",
		subcommands: [
			subcommand({
				description: "Nested prefix-only example.",
				name: "later",
				execute() {
					return undefined;
				},
			}),
		],
	}),
);

const singleCommand = parseChatCommandInput(
	"!dev incident start --channel=ops 'quoted reason'",
	"!",
);

assert.ok(singleCommand);

const resolution = registry.resolve(singleCommand);

assert.ok(resolution);
assert.deepEqual(resolution.invocation.commandPath, [
	"dev",
	"incident",
	"start",
]);
assert.equal(resolution.permission, "administrator");
assert.equal(resolution.allowPrefixless, true);
assert.deepEqual(resolution.invocation.options.channel, [
	"ops",
]);
assert.deepEqual(resolution.invocation.positionalArgs, [
	"quoted reason",
]);

const prefixless = parseChatCommandInput(
	"dev incident start --channel=war-room deploy",
	"",
);

assert.ok(prefixless);

const prefixlessResolution = registry.resolve(prefixless);

assert.ok(prefixlessResolution);
assert.equal(prefixlessResolution.allowPrefixless, true);
assert.deepEqual(
	prefixlessResolution.invocation.commandPath,
	["dev", "incident", "start"],
);
assert.deepEqual(prefixlessResolution.invocation.rawArgs, [
	"--channel=war-room",
	"deploy",
]);

const prefixOnly = parseChatCommandInput(
	"remind later 10m deploy",
	"",
);

assert.ok(prefixOnly);
assert.equal(
	registry.resolve(prefixOnly)?.allowPrefixless,
	true,
);
assert.equal(
	registry.find(["remind", "later"], "!")?.invocation
		.prefix,
	"",
);

const reminderGuide = renderUsageGuide({
	command: {
		description: "Inspect reminders.",
		name: "reminders",
		usage: {
			examples: [
				{
					command: "!reminders",
					description: "Open reminders.",
				},
			],
			formats: ["!reminders"],
		},
	},
	commandPath: ["reminders"],
	prefix: "!",
});

assert.ok(
	reminderGuide.includes(
		"- `!reminders` - Open reminders.",
	),
);
assert.ok(!reminderGuide.includes("!reminders !reminders"));

const prefixedLookalike = parseChatCommandInput(
	"!remindera 10m nope",
	"!",
);

assert.equal(
	prefixedLookalike?.segments[0]?.words[0],
	"remindera",
);

const moderationMention = parseChatCommandInput(
	"jd tools mod ban <@1496359129986371674> مزاج",
	"",
);

assert.ok(moderationMention);
assert.deepEqual(moderationMention.segments[0]?.words, [
	"jd",
	"tools",
	"mod",
	"ban",
	"<@1496359129986371674>",
	"مزاج",
]);
assert.deepEqual(
	moderationMention.segments[0]?.redirects,
	[],
);

console.log("chat-command-parser.test.ts passed");
