import { Logger } from "#Logger";
import { getDatabase } from "#Database";
import type { DatabaseAdapter, DatabaseTransaction } from "#Database";

const log = new Logger("audit-log");

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

let adapter: DatabaseAdapter | undefined;

async function getAuditDb(): Promise<DatabaseAdapter> {
	if (!adapter) {
		adapter = await getDatabase();
	}
	return adapter;
}

export async function migrateAuditSchema(): Promise<void> {
	const db = await getAuditDb();
	await db.transaction(async (tx: DatabaseTransaction) => {
		await tx.execute(`
			CREATE TABLE IF NOT EXISTS command_audit_log (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				command TEXT NOT NULL,
				user_id TEXT NOT NULL,
				user_tag TEXT NOT NULL DEFAULT '',
				guild_id TEXT,
				channel_id TEXT NOT NULL,
				timestamp TEXT NOT NULL,
				sudo INTEGER NOT NULL DEFAULT 0,
				elevated INTEGER NOT NULL DEFAULT 0,
				args TEXT NOT NULL DEFAULT ''
			);
		`);
		await tx.execute(`
			CREATE INDEX IF NOT EXISTS idx_audit_user
			ON command_audit_log(user_id, timestamp);
		`);
		await tx.execute(`
			CREATE INDEX IF NOT EXISTS idx_audit_command
			ON command_audit_log(command, timestamp);
		`);
		await tx.execute(`
			CREATE INDEX IF NOT EXISTS idx_audit_guild
			ON command_audit_log(guild_id, timestamp);
		`);
	});
}

export async function logCommandExecution(
	entry: CommandAuditEntry,
): Promise<void> {
	try {
		const db = await getAuditDb();
		await db.transaction(async (tx: DatabaseTransaction) => {
			await tx.execute(
				`
				INSERT INTO command_audit_log (
					command, user_id, user_tag, guild_id, channel_id,
					timestamp, sudo, elevated, args
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
				`,
				[
					entry.command,
					entry.userId,
					entry.userTag,
					entry.guildId,
					entry.channelId,
					entry.timestamp,
					entry.sudo ? 1 : 0,
					entry.elevated ? 1 : 0,
					entry.args.slice(0, 500),
				],
			);
		});
	} catch (error) {
		log.error("Failed to write audit entry:", error);
	}
}
