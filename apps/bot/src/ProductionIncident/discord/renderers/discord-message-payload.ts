export interface DiscordButtonPayload {
	readonly customId: string;
	readonly disabled?: boolean;
	readonly label: string;
	readonly style:
		| "danger"
		| "primary"
		| "secondary"
		| "success";
}

export interface DiscordButtonRowPayload {
	readonly buttons: readonly DiscordButtonPayload[];
}

export interface DiscordMessagePayload {
	readonly accentColor?: number;
	readonly buttonRows?: readonly DiscordButtonRowPayload[];
	readonly buttons?: readonly DiscordButtonPayload[];
	readonly content: string;
	readonly embeds?: readonly DiscordEmbedPayload[];
	readonly useComponentsV2?: boolean;
}

export interface DiscordEmbedPayload {
	readonly color?: number;
	readonly description?: string;
	readonly fields?: readonly DiscordEmbedFieldPayload[];
	readonly title: string;
}

export interface DiscordEmbedFieldPayload {
	readonly inline?: boolean;
	readonly name: string;
	readonly value: string;
}
