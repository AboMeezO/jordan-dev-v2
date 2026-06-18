import { vi } from "vitest";

export function createMockMessage(
	overrides: Partial<{
		content: string;
		author: Partial<{
			id: string;
			tag: string;
			bot: boolean;
		}>;
		guild: { id: string } | null;
		channel: { id: string };
	}> = {},
) {
	const author = {
		id: overrides.author?.id ?? "user_123",
		tag: overrides.author?.tag ?? "TestUser#0000",
		bot: overrides.author?.bot ?? false,
	};

	return {
		content: overrides.content ?? "",
		author,
		guild: overrides.guild ?? { id: "guild_123" },
		channelId: overrides.channel?.id ?? "channel_123",
		reply: vi.fn().mockResolvedValue(undefined),
	};
}

export function createMockClient() {
	return {
		user: { tag: "Bot#0000", id: "bot_123" },
		login: vi.fn().mockResolvedValue(undefined),
	};
}
