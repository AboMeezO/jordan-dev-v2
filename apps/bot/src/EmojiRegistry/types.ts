export interface EmojiConfigEntry {
	readonly animated: boolean;
	readonly fallback: string;
	readonly id: string | null;
	readonly name: string;
	readonly categories?: readonly string[];
}

export interface EmojiRegistryConfig {
	readonly emojis: Record<string, EmojiConfigEntry>;
}

export interface EmojiSyncSummary {
	readonly fallback: readonly string[];
	readonly found: readonly string[];
	readonly missing: readonly string[];
	readonly staleId: readonly string[];
}
