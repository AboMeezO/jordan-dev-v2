import assert from "node:assert/strict";

import {
	ChatCommandRegistry,
	parseChatCommandInput,
} from "#ChatCommands";

import { chatCommandTrees } from "./commands/index.js";

const registry = new ChatCommandRegistry();

for (const tree of chatCommandTrees) {
	registry.register(tree);
}

const knownCommands = [
	["github", "user"],
	["github", "repo"],
	["github", "issue"],
	["github", "gitignore"],
	["net", "dns"],
	["net", "regex"],
	["net", "url-scan"],
	["net", "whois"],
	["net", "jwt"],
	["tools", "json"],
	["tools", "base64"],
	["tools", "url"],
	["tools", "hash"],
	["tools", "uuid"],
	["tools", "timestamp"],
	["tools", "case"],
	["tools", "slug"],
	["tools", "morse"],
	["tools", "snowflake"],
	["tools", "color"],
	["which"],
	["context"],
	["avatar"],
	["banner"],
	["serverinfo"],
];

for (const path of knownCommands) {
	const parsed = parseChatCommandInput(path.join(" "), "");
	assert.ok(parsed, `Failed to parse: ${path.join(" ")}`);

	const resolved = registry.resolve(parsed);
	assert.ok(
		resolved,
		`Failed to resolve: ${path.join(" ")}`,
	);
	assert.deepEqual(
		resolved.invocation.commandPath,
		path,
		`Unexpected commandPath for ${path.join(" ")}`,
	);
}

const parsedAll = parseChatCommandInput("github user", "");
assert.ok(parsedAll);
const resolvedAll = registry.resolve(parsedAll);
assert.ok(resolvedAll);
assert.ok(resolvedAll.command.cooldown);
assert.ok(resolvedAll.command.description);
assert.ok(resolvedAll.command.category);
assert.ok(resolvedAll.command.availability);

const aliasTest = parseChatCommandInput(
	"gh repo octocat/Hello-World",
	"",
);
assert.ok(aliasTest);
const resolvedAlias = registry.resolve(aliasTest);
assert.ok(resolvedAlias);
assert.equal(
	resolvedAlias.invocation.commandPath[0],
	"github",
);

assert.equal(
	registry.find(["nonexistent", "command"], "")?.invocation
		.commandPath,
	undefined,
);

const allPaths = knownCommands.map((path) =>
	path.join(" "),
);

for (const raw of allPaths) {
	const p = parseChatCommandInput(raw, "");
	assert.ok(p, `Parse failed for: ${raw}`);
	const r = registry.resolve(p);
	assert.ok(r, `Resolve failed for: ${raw}`);

	assert.equal(
		r.command.name,
		r.invocation.commandPath[
			r.invocation.commandPath.length - 1
		],
		`Name mismatch for: ${raw}`,
	);

	assert.ok(
		typeof r.command.description === "string" &&
			r.command.description.length > 0,
		`Missing description for: ${raw}`,
	);
}

console.log("shell-commands.test.ts passed");
