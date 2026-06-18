import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import type {
	DatabaseAdapter,
	DatabasePrimitive,
	DatabaseRow,
	DatabaseTransaction,
	DatabaseValue,
} from "./types.js";

export class SqliteDatabaseAdapter implements DatabaseAdapter {
	public readonly driver = "sqlite" as const;
	private readonly database: DatabaseSync;

	public constructor(url: string) {
		const filename = sqliteFilenameFromUrl(url);

		if (filename !== ":memory:") {
			fs.mkdirSync(path.dirname(filename), {
				recursive: true,
			});
		}

		this.database = new DatabaseSync(filename);
		this.database.exec("PRAGMA journal_mode = WAL");
		this.database.exec("PRAGMA foreign_keys = ON");
	}

	public migrate(): Promise<void> {
		this.database.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
		return Promise.resolve();
	}

	public async transaction<T>(
		work: (tx: DatabaseTransaction) => Promise<T>,
	): Promise<T> {
		this.database.exec("BEGIN IMMEDIATE");

		try {
			const result = await work(
				new SqliteDatabaseTransaction(this.database),
			);
			this.database.exec("COMMIT");
			return result;
		} catch (error) {
			this.database.exec("ROLLBACK");
			throw error;
		}
	}

	public close(): Promise<void> {
		this.database.close();
		return Promise.resolve();
	}
}

class SqliteDatabaseTransaction implements DatabaseTransaction {
	public constructor(
		private readonly database: DatabaseSync,
	) {}

	public execute(
		sql: string,
		params: readonly DatabaseValue[] = [],
	): Promise<void> {
		this.database
			.prepare(sql)
			.run(...normalizeParams(params));
		return Promise.resolve();
	}

	public query<T extends DatabaseRow>(
		sql: string,
		params: readonly DatabaseValue[] = [],
	): Promise<readonly T[]> {
		return Promise.resolve(
			this.database
				.prepare(sql)
				.all(...normalizeParams(params)) as T[],
		);
	}

	public get<T extends DatabaseRow>(
		sql: string,
		params: readonly DatabaseValue[] = [],
	): Promise<T | undefined> {
		return Promise.resolve(
			this.database
				.prepare(sql)
				.get(...normalizeParams(params)) as T | undefined,
		);
	}
}

function sqliteFilenameFromUrl(url: string): string {
	if (url === ":memory:" || url === "file::memory:") {
		return ":memory:";
	}

	if (url.startsWith("file:")) {
		try {
			return fileURLToPath(url);
		} catch (error) {
			if (error instanceof TypeError) {
				return path.resolve(url.slice("file:".length));
			}

			throw error;
		}
	}

	return path.resolve(url);
}

function normalizeParams(
	params: readonly DatabaseValue[],
): readonly DatabasePrimitive[] {
	return params.map((value) => {
		if (value instanceof Date) {
			return value.toISOString();
		}

		if (typeof value === "boolean") {
			return value ? 1 : 0;
		}

		return value;
	});
}
