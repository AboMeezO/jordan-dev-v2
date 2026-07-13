import { botConfig } from "#Config";

import type {
	DatabaseConfig,
	DatabaseDriver,
} from "./types.js";

export function loadDatabaseConfig(): DatabaseConfig {
	const driver = parseDriver(botConfig.database.driver);
	const url = botConfig.database.url;

	return { driver, url };
}

function parseDriver(
	value: string | undefined,
): DatabaseDriver {
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
