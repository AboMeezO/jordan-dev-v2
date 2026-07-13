import type { Config } from "@jordan-devs/config";
import { createConfig } from "@jordan-devs/config";

const cfg: Config = createConfig({
	configPath: "Config.yaml",
	schemaPath: "schema.yaml",
	autoSyncEnabled: true,
	envFilePath: ".env",
	env: process.env,
});

export const botConfig = {
	discord: {
		get token() { return cfg.get<string>("discord.token"); },
		prefix: cfg.get<string>("discord.prefix"),
		devGuildId: cfg.get<string | undefined>("discord.devGuildId"),
	},
	owners: {
		ids: commaSplit(cfg.get<string | undefined>("owners.ids")),
		devIds: commaSplit(cfg.get<string | undefined>("owners.devIds")),
	},
	github: {
		token: cfg.get<string | undefined>("github.token"),
	},
	scanning: {
		virustotalApiKey: cfg.get<string | undefined>("scanning.virustotalApiKey"),
		cacheTtlMs: cfg.get<number>("scanning.cacheTtlMs"),
		rateLimitPerUser: cfg.get<number>("scanning.rateLimit"),
		timeoutMs: cfg.get<number>("scanning.timeoutMs"),
		maxRedirects: cfg.get<number>("scanning.maxRedirects"),
	},
	database: {
		driver: cfg.get<string>("database.driver"),
		url: cfg.get<string>("database.url"),
	},
	backend: {
		baseUrl: cfg.get<string>("backend.baseUrl"),
		token: cfg.get<string | undefined>("backend.token"),
	},
	suspiciousTlds: [
		"xyz", "top", "gq", "ml", "cf", "ga", "tk",
		"work", "win", "bid", "loan", "date", "men",
		"click", "download", "review", "stream",
	] as readonly string[],
};

export function getOwnerIds(): ReadonlySet<string> {
	return new Set(botConfig.owners.ids);
}

export function getDevIds(): ReadonlySet<string> {
	return new Set(botConfig.owners.devIds);
}

export function getPrivilegedIds(): ReadonlySet<string> {
	const ids = new Set(botConfig.owners.ids);
	for (const devId of botConfig.owners.devIds) {
		ids.add(devId);
	}
	return ids;
}

export function validateConfig(): void {
	if (!botConfig.scanning.virustotalApiKey) {
		console.warn("[config] VIRUSTOTAL_API_KEY not set — url-scan will use local heuristics only");
	}
}

function commaSplit(value: string | undefined): readonly string[] {
	if (!value) return [];
	return value.split(",").map((s) => s.trim()).filter(Boolean);
}
