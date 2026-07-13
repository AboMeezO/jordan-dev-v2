export type ClerkUserIdentity = {
	clerkUserId: string;
	email?: string | null;
	displayName?: string | null;
	avatarUrl?: string | null;
};

export type DiscordUserIdentity = {
	discordUserId: string;
	displayName?: string | null;
	avatarUrl?: string | null;
};
