import { describe, expect, it } from "vitest";

import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import { VerificationService } from "./verification.service.js";

describe("VerificationService", () => {
	it("returns the verified user profile and does not fake Discord role granting", () => {
		const service = new VerificationService();
		const user: AuthenticatedUser = {
			clerkUserId: "clerk_123",
			localUserId: "user_123",
			email: "user@example.com",
			displayName: "User",
			avatarUrl: null,
		};

		expect(
			service.completeVerification(user, {
				discordUserId: "discord_123",
				guildId: "guild_123",
			}),
		).toEqual({
			profile: {
				clerkUserId: "clerk_123",
				discordUserId: "discord_123",
				email: "user@example.com",
				guildId: "guild_123",
			},
			roleGranted: false,
		});
	});
});
