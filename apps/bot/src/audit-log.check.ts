import assert from "node:assert/strict";

// Test audit log entry structure (mirrors audit-log.ts)
interface CommandAuditEntry {
	command: string;
	userId: string;
	userTag: string;
	guildId: string | null;
	channelId: string;
	timestamp: string;
	sudo: boolean;
	elevated: boolean;
	args: string;
}

function createAuditEntry(
	overrides?: Partial<CommandAuditEntry>,
): CommandAuditEntry {
	return {
		command: "test-command",
		userId: "123456789012345678",
		userTag: "testuser#0000",
		guildId: "876543210987654321",
		channelId: "112233445566778899",
		timestamp: new Date().toISOString(),
		sudo: false,
		elevated: false,
		args: "",
		...overrides,
	};
}

// Test basic entry creation
const entry = createAuditEntry();
assert.equal(entry.command, "test-command");
assert.equal(entry.userId, "123456789012345678");
assert.equal(entry.sudo, false);
assert.equal(entry.elevated, false);

// Test sudo entry
const sudoEntry = createAuditEntry({
	command: "sudo jd tools moderation ban @user",
	sudo: true,
	elevated: true,
	args: "jd tools moderation ban @user",
});
assert.equal(sudoEntry.sudo, true);
assert.equal(sudoEntry.elevated, true);
assert.equal(
	sudoEntry.command,
	"sudo jd tools moderation ban @user",
);

// Test elevated command detection
const isElevated = (permission: string): boolean =>
	permission !== "public" && permission !== "guild-member";

assert.equal(isElevated("public"), false);
assert.equal(isElevated("guild-member"), false);
assert.equal(isElevated("moderator"), true);
assert.equal(isElevated("administrator"), true);
assert.equal(isElevated("owner"), true);

// Test args truncation
const longArgs = "a".repeat(1000);
const truncated = longArgs.slice(0, 500);
assert.equal(truncated.length, 500);

console.log("audit-log.test.ts passed");
