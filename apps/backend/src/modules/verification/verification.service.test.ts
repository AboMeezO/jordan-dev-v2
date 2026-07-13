import { VerificationStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import type {
	DatabaseService,
	DatabaseTransactionClient,
} from "../../database/database.service.js";
import type { VerificationRepository } from "./verification.repository.js";
import { VerificationService } from "./verification.service.js";

describe("VerificationService", () => {
	it("persists verification state and returns a pending role grant", async () => {
		const transaction = {} as DatabaseTransactionClient;
		const database = {
			transaction: async <T>(
				callback: (
					transactionClient: DatabaseTransactionClient,
				) => Promise<T>,
			): Promise<T> => callback(transaction),
		} as Pick<DatabaseService, "transaction">;
		const verifications = {
			completeVerification: vi.fn().mockResolvedValue({
				roleGrantJobId: "job_123",
				status: VerificationStatus.ROLE_GRANT_PENDING,
			}),
		} as Pick<
			VerificationRepository,
			"completeVerification"
		>;
		const service = new VerificationService(
			database as DatabaseService,
			verifications as VerificationRepository,
		);
		const user: AuthenticatedUser = {
			clerkUserId: "clerk_123",
			localUserId: "user_123",
			email: "user@example.com",
			displayName: "User",
			avatarUrl: null,
		};

		await expect(
			service.completeVerification(user, {
				discordUserId: "discord_123",
				guildId: "guild_123",
			}),
		).resolves.toEqual({
			profile: {
				clerkUserId: "clerk_123",
				discordUserId: "discord_123",
				email: "user@example.com",
				guildId: "guild_123",
			},
			status: "ROLE_GRANT_PENDING",
			roleGranted: false,
			roleGrantPending: true,
			roleGrantJobId: "job_123",
		});
		expect(
			verifications.completeVerification,
		).toHaveBeenCalledWith(
			{
				discordUserId: "discord_123",
				guildId: "guild_123",
				userId: "user_123",
			},
			transaction,
		);
	});
});
