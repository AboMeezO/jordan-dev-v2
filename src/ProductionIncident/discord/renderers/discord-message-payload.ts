export interface DiscordButtonPayload {
  readonly customId: string;
  readonly disabled?: boolean;
  readonly label: string;
  readonly style: "danger" | "primary" | "secondary" | "success";
}

export interface DiscordMessagePayload {
  readonly buttons?: readonly DiscordButtonPayload[];
  readonly content: string;
  readonly embeds?: readonly DiscordEmbedPayload[];
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
