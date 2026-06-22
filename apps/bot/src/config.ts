import { Logger } from "#Logger";

const log = new Logger("config");

function requireEnv(name: string): () => string {
	return () => {
		const value = process.env[name];
		if (!value) {
			throw new Error(`Missing required environment variable: ${name}`);
		}
		return value;
	};
}

function optionalEnv(name: string): string | undefined {
	return process.env[name]?.trim() || undefined;
}

function commaSplit(value: string | undefined): readonly string[] {
	if (!value) return [];
	return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function numEnv(name: string, defaultVal: number): number {
	const val = process.env[name];
	return val ? Number(val) || defaultVal : defaultVal;
}

export const botConfig = {
	discord: {
		get token() { return requireEnv("TOKEN")(); },
		prefix: process.env.PREFIX ?? "!",
		devGuildId: optionalEnv("DEV_GUILD_ID"),
	},
	owners: {
		ids: commaSplit(process.env.OWNER_IDS ?? process.env.OWNER_ID),
		devIds: commaSplit(process.env.DEV_IDS),
	},
	github: {
		token: optionalEnv("GITHUB_TOKEN"),
	},
	scanning: {
		virustotalApiKey: optionalEnv("VIRUSTOTAL_API_KEY"),
		cacheTtlMs: numEnv("SCAN_CACHE_TTL_MS", 300_000),
		rateLimitPerUser: numEnv("SCAN_RATE_LIMIT", 10),
		timeoutMs: numEnv("NETWORK_TIMEOUT_MS", 10_000),
		maxRedirects: numEnv("MAX_REDIRECTS", 10),
	},
	suspiciousTlds: [
		"xyz", "top", "gq", "ml", "cf", "ga", "tk",
		"work", "win", "bid", "loan", "date", "men",
		"click", "download", "review", "stream",
	] as readonly string[],
};

export function validateConfig(): void {
	if (!botConfig.scanning.virustotalApiKey) {
		log.warn("VIRUSTOTAL_API_KEY not set — url-scan will use local heuristics only");
	}
}
