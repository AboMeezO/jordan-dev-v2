import path from "node:path";

import type { DatabaseConfig, DatabaseDriver } from "./types.js";

const DEFAULT_SQLITE_PATH = path.resolve(process.cwd(), "data/bot.sqlite");

export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const driver = parseDriver(env.DATABASE_DRIVER);
  const url = env.DATABASE_URL?.trim() || `file:${DEFAULT_SQLITE_PATH}`;

  return { driver, url };
}

function parseDriver(value: string | undefined): DatabaseDriver {
  if (!value) {
    return "sqlite";
  }

  if (
    value === "sqlite" ||
    value === "postgres" ||
    value === "mysql" ||
    value === "json" ||
    value === "memory"
  ) {
    return value;
  }

  throw new Error(
    `Unsupported DATABASE_DRIVER "${value}". Expected sqlite, postgres, mysql, json, or memory.`,
  );
}
