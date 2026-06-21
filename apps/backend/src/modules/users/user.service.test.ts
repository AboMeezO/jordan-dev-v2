import { describe, expect, it, vi } from "vitest";

import type { UserRepository } from "./user.repository.js";
import { UserService } from "./user.service.js";

describe("UserService", () => {
	it("upserts a user from Clerk identity through the repository", async () => {
		const repository: Pick<
			UserRepository,
			"upsertFromClerkIdentity"
		> = {
			upsertFromClerkIdentity: vi.fn(async () => ({
				id: "user_123",
				clerkUserId: "clerk_123",
				email: "user@example.com",
				displayName: "User",
				avatarUrl: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			})),
		};
		const service = new UserService(repository as UserRepository);

		await expect(
			service.upsertFromClerkIdentity({
				clerkUserId: "clerk_123",
				email: "user@example.com",
			}),
		).resolves.toMatchObject({
			id: "user_123",
			clerkUserId: "clerk_123",
		});
		expect(repository.upsertFromClerkIdentity).toHaveBeenCalledWith(
			{
				clerkUserId: "clerk_123",
				email: "user@example.com",
			},
			undefined,
		);
	});
});

