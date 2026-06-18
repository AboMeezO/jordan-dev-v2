import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type {
	EmojiConfigEntry,
	EmojiSyncSummary,
} from "./types.js";

export type { EmojiConfigEntry, EmojiSyncSummary } from "./types.js";

export interface AvailableEmoji {
	readonly animated?: boolean;
	readonly id: string;
	readonly name: string | null;
	readonly source?: "application" | "guild";
}

export class EmojiRegistry {
	private readonly config: Record<string, EmojiConfigEntry>;
	private readonly customByKey = new Map<string, string>();
	private lastSummary: EmojiSyncSummary = {
		fallback: [],
		found: [],
		missing: [],
		staleId: [],
	};

	public constructor(
		config: Record<string, EmojiConfigEntry> = {},
	) {
		this.config = config;
	}

	public emoji(key: string | undefined): string {
		if (key === undefined || !Object.hasOwn(this.config, key)) {
			return "";
		}

		return (
			this.customByKey.get(key) ??
			this.config[key]!.fallback
		);
	}

	public sync(
		available: readonly AvailableEmoji[],
	): EmojiSyncSummary {
		this.customByKey.clear();

		const applicationEmojis = available.filter(
			(emoji) => emoji.source !== "guild",
		);
		const found: string[] = [];
		const missing: string[] = [];
		const staleId: string[] = [];
		const fallback: string[] = [];

		for (const key of Object.keys(this.config)) {
			const entry = this.config[key]!;
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

	public summary(): EmojiSyncSummary {
		return this.lastSummary;
	}

	private formatEmoji(
		entry: EmojiConfigEntry,
		emoji: AvailableEmoji,
	): string {
		const animated = emoji.animated ?? entry.animated;
		return `${animated ? "<a" : "<"}:${entry.name}:${emoji.id}>`;
	}
}

export function loadEmojiConfig(
	configPath?: string,
): Record<string, EmojiConfigEntry> {
	const path =
		configPath ??
		resolve(
			process.cwd(),
			"src",
			"ProductionIncident",
			"discord",
			"emojis",
			"production-incident-emojis.json",
		);
	const parsed: unknown = JSON.parse(
		readFileSync(path, "utf8"),
	);

	if (!isEmojiConfig(parsed)) {
		throw new Error("Emoji config is invalid.");
	}

	return parsed;
}

function isEmojiConfig(
	value: unknown,
): value is Record<string, EmojiConfigEntry> {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	return (
		Object.entries(value) as [string, unknown][]
	).every(([, entry]) => isEmojiConfigEntry(entry));
}

function isEmojiConfigEntry(
	value: unknown,
): value is EmojiConfigEntry {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	const candidate = value as Partial<EmojiConfigEntry>;
	return (
		typeof candidate.animated === "boolean" &&
		typeof candidate.fallback === "string" &&
		(typeof candidate.id === "string" ||
			candidate.id === null) &&
		typeof candidate.name === "string"
	);
}
