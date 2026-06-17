import { loadDatabaseConfig } from "./config.js";
import { UnsupportedDatabaseDriverError } from "./errors.js";
import { SqliteDatabaseAdapter } from "./sqlite-adapter.js";
import type { DatabaseAdapter, DatabaseConfig } from "./types.js";

let adapter: DatabaseAdapter | undefined;

export async function getDatabase(): Promise<DatabaseAdapter> {
  if (!adapter) {
    adapter = createDatabaseAdapter(loadDatabaseConfig());
    await adapter.migrate();
  }

  return adapter;
}

export function createDatabaseAdapter(config: DatabaseConfig): DatabaseAdapter {
  if (config.driver === "sqlite") {
    return new SqliteDatabaseAdapter(config.url);
  }

  throw new UnsupportedDatabaseDriverError(config.driver);
}

export type {
  DatabaseAdapter,
  DatabaseConfig,
  DatabaseDriver,
  DatabaseRow,
  DatabaseTransaction,
  DatabaseValue,
} from "./types.js";
