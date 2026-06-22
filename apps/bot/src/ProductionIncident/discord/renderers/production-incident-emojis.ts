import type { AvailableEmoji } from "../../../EmojiRegistry/index.js";
import {
	EmojiRegistry,
	loadEmojiConfig,
} from "../../../EmojiRegistry/index.js";
import type {
	EmojiConfigEntry,
	EmojiSyncSummary,
} from "../../../EmojiRegistry/types.js";

export type ProductionIncidentEmojiKey = string;

export {
	loadEmojiConfig,
	EmojiRegistry as ProductionIncidentEmojiRegistry,
};

export type {
	AvailableEmoji as AvailableDiscordEmoji,
	EmojiConfigEntry as ProductionIncidentEmojiConfigEntry,
	EmojiSyncSummary as ProductionIncidentEmojiSyncSummary,
};
