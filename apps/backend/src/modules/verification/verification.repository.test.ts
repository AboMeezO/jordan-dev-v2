import { VerificationStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { DatabaseService } from "../../database/database.service.js";
import { VerificationRepository } from "./verification.repository.js";

describe("VerificationRepository", () => {
	it("upserts verification state, writes events, and creates a pending role grant job", async () => {
		const mocks = createDatabaseMocks();
		const repository = new VerificationRepository(
			mocks.database,
		);

		await expect(
			repository.completeVerification({
				discordUserId: "discord_123",
				guildId: "guild_123",
				userId: "user_123",
			}),
		).resolves.toEqual({
			roleGrantJobId: "job_123",
			status: VerificationStatus.ROLE_GRANT_PENDING,
		});

		expect(mocks.verificationUpsert).toHaveBeenCalledOnce();
		expect(mocks.roleGrantJobUpsert).toHaveBeenCalledOnce();
		expect(
			mocks.verificationEventCreate,
		).toHaveBeenCalledTimes(2);
	});
});

function createDatabaseMocks(): {
	readonly database: DatabaseService;
	readonly roleGrantJobUpsert: ReturnType<typeof vi.fn>;
	readonly verificationEventCreate: ReturnType<
		typeof vi.fn
	>;
	readonly verificationUpsert: ReturnType<typeof vi.fn>;
} {
	const verificationUpsert = vi.fn(() =>
		Promise.resolve({
			id: "verification_123",
			status: VerificationStatus.ROLE_GRANT_PENDING,
		}),
	);
	const verificationEventCreate = vi.fn(() =>
		Promise.resolve({}),
	);
	const roleGrantJobUpsert = vi.fn(() =>
		Promise.resolve({
			id: "job_123",
		}),
	);
	const database = {
		verification: {
			upsert: verificationUpsert,
		},
		verificationEvent: {
			create: verificationEventCreate,
		},
		verificationRoleGrantJob: {
			upsert: roleGrantJobUpsert,
		},
	};

	return {
		database: database as unknown as DatabaseService,
		roleGrantJobUpsert,
		verificationEventCreate,
		verificationUpsert,
	};
}
