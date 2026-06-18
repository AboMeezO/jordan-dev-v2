import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ProductionIncidentEmojiKey =
	| "api"
	| "auth"
	| "backend"
	| "cache"
	| "cancel"
	| "cdn"
	| "cost"
	| "cpu"
	| "danger"
	| "database"
	| "deploy"
	| "devops"
	| "downtime"
	| "employee"
	| "end"
	| "engineer"
	| "failure"
	| "frontend"
	| "hotfix"
	| "incident"
	| "inspect"
	| "intern"
	| "join"
	| "lockdown"
	| "logs"
	| "memory"
	| "network"
	| "payment"
	| "pressure"
	| "qa"
	| "queue"
	| "report"
	| "rollback"
	| "sanity"
	| "scale"
	| "security"
	| "securityRole"
	| "server"
	| "skull"
	| "spark"
	| "stability"
	| "start"
	| "status"
	| "success"
	| "timer"
	| "trophy"
	| "users"
	| "vote"
	| "warning"
	| "webhook";

export interface AvailableDiscordEmoji {
	readonly animated?: boolean;
	readonly id: string;
	readonly name: string | null;
	readonly source?: "application" | "guild";
}

export interface ProductionIncidentEmojiConfigEntry {
	readonly animated: boolean;
	readonly fallback: string;
	readonly id: string | null;
	readonly name: string;
}

export type ProductionIncidentEmojiConfig = Readonly<
	Record<
		ProductionIncidentEmojiKey,
		ProductionIncidentEmojiConfigEntry
	>
>;

export interface ProductionIncidentEmojiSyncSummary {
	readonly fallback: readonly ProductionIncidentEmojiKey[];
	readonly found: readonly ProductionIncidentEmojiKey[];
	readonly missing: readonly ProductionIncidentEmojiKey[];
	readonly staleId: readonly ProductionIncidentEmojiKey[];
}

const CONFIG_PATH = resolve(
	process.cwd(),
	"src",
	"ProductionIncident",
	"discord",
	"emojis",
	"production-incident-emojis.json",
);

export class ProductionIncidentEmojiRegistry {
	private readonly config: ProductionIncidentEmojiConfig;
	private readonly customByKey = new Map<
		ProductionIncidentEmojiKey,
		string
	>();
	private lastSummary: ProductionIncidentEmojiSyncSummary =
		{
			fallback: [],
			found: [],
			missing: [],
			staleId: [],
		};

	public constructor(
		config: ProductionIncidentEmojiConfig = loadEmojiConfig(),
	) {
		this.config = config;
	}

	public emoji(key: string | undefined): string {
		if (
			key === undefined ||
			!Object.hasOwn(this.config, key)
		) {
			return "";
		}

		const emojiKey = key as ProductionIncidentEmojiKey;
		return (
			this.customByKey.get(emojiKey) ??
			this.config[emojiKey].fallback
		);
	}

	public sync(
		available: readonly AvailableDiscordEmoji[],
	): ProductionIncidentEmojiSyncSummary {
		this.customByKey.clear();

		const applicationEmojis = available.filter(
			(emoji) => emoji.source !== "guild",
		);
		const found: ProductionIncidentEmojiKey[] = [];
		const missing: ProductionIncidentEmojiKey[] = [];
		const staleId: ProductionIncidentEmojiKey[] = [];
		const fallback: ProductionIncidentEmojiKey[] = [];

		for (const key of Object.keys(
			this.config,
		) as ProductionIncidentEmojiKey[]) {
			const entry = this.config[key];
			const byId =
				entry.id === null
					? undefined
					: applicationEmojis.find(
							(emoji) => emoji.id === entry.id,
						);
			const byName = applicationEmojis.find(
				(emoji) => emoji.name === entry.name,
			);
			const resolved = byId ?? byName;

			if (resolved === undefined) {
				missing.push(key);
				fallback.push(key);
				continue;
			}

			if (
				entry.id !== null &&
				byId === undefined &&
				byName !== undefined
			) {
				staleId.push(key);
			}

			found.push(key);
			this.customByKey.set(
				key,
				this.formatEmoji(entry, resolved),
			);
		}

		this.lastSummary = {
			fallback,
			found,
			missing,
			staleId,
		};
		return this.lastSummary;
	}

	public summary(): ProductionIncidentEmojiSyncSummary {
		return this.lastSummary;
	}

	private formatEmoji(
		entry: ProductionIncidentEmojiConfigEntry,
		emoji: AvailableDiscordEmoji,
	): string {
		const animated = emoji.animated ?? entry.animated;
		return `${animated ? "<a" : "<"}:${entry.name}:${emoji.id}>`;
	}
}

export function loadEmojiConfig(): ProductionIncidentEmojiConfig {
	const parsed: unknown = JSON.parse(
		readFileSync(CONFIG_PATH, "utf8"),
	);

	if (!isEmojiConfig(parsed)) {
		throw new Error(
			"Production Incident emoji config is invalid.",
		);
	}

	return parsed;
}

function isEmojiConfig(
	value: unknown,
): value is ProductionIncidentEmojiConfig {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	return (
		Object.entries(value) as [string, unknown][]
	).every(([, entry]) => isEmojiConfigEntry(entry));
}

function isEmojiConfigEntry(
	value: unknown,
): value is ProductionIncidentEmojiConfigEntry {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const candidate =
		value as Partial<ProductionIncidentEmojiConfigEntry>;
	return (
		typeof candidate.animated === "boolean" &&
		typeof candidate.fallback === "string" &&
		(typeof candidate.id === "string" ||
			candidate.id === null) &&
		typeof candidate.name === "string"
	);
}
