import { verifyToken } from "@clerk/backend";
import { UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BackendConfigService } from "../../config/app.config.js";
import type { UserService } from "../users/user.service.js";
import { AuthService } from "./auth.service.js";

vi.mock("@clerk/backend", () => ({
	verifyToken: vi.fn(),
}));

const verifyTokenMock = vi.mocked(verifyToken);

describe("AuthService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it.each([
		["invalid token", new Error("invalid token")],
		["expired token", new Error("token expired")],
		["verification failure", new Error("verification failed")],
	])("%s fails safely", async (_label, error) => {
		verifyTokenMock.mockRejectedValueOnce(error);
		const service = createAuthService();

		await expect(
			service.authenticateBearerToken("bad-token"),
		).rejects.toBeInstanceOf(UnauthorizedException);
	});

	it("fails safely when the verified token has no subject", async () => {
		mockVerifiedClaims({
			email: "user@example.com",
		});
		const service = createAuthService();

		await expect(
			service.authenticateBearerToken("token"),
		).rejects.toBeInstanceOf(UnauthorizedException);
	});

	it("maps primary Clerk profile claims into local user identity", async () => {
		const users = createUserService();
		mockVerifiedClaims({
			sub: "clerk_123",
			email: "user@example.com",
			email_address: "fallback@example.com",
			name: "Primary Name",
			full_name: "Fallback Name",
			image_url: "https://example.com/primary.png",
			picture: "https://example.com/fallback.png",
		});
		const service = createAuthService(users);

		await service.authenticateBearerToken("token");

		expect(users.upsertFromClerkIdentity).toHaveBeenCalledWith({
			clerkUserId: "clerk_123",
			email: "user@example.com",
			displayName: "Primary Name",
			avatarUrl: "https://example.com/primary.png",
		});
	});

	it("uses fallback Clerk profile claims when primary claims are missing", async () => {
		const users = createUserService();
		mockVerifiedClaims({
			sub: "clerk_123",
			email_address: "fallback@example.com",
			full_name: "Fallback Name",
			picture: "https://example.com/fallback.png",
		});
		const service = createAuthService(users);

		await service.authenticateBearerToken("token");

		expect(users.upsertFromClerkIdentity).toHaveBeenCalledWith({
			clerkUserId: "clerk_123",
			email: "fallback@example.com",
			displayName: "Fallback Name",
			avatarUrl: "https://example.com/fallback.png",
		});
	});

	it("maps missing optional claims to null values", async () => {
		const users = createUserService();
		mockVerifiedClaims({
			sub: "clerk_123",
		});
		const service = createAuthService(users);

		await service.authenticateBearerToken("token");

		expect(users.upsertFromClerkIdentity).toHaveBeenCalledWith({
			clerkUserId: "clerk_123",
			email: null,
			displayName: null,
			avatarUrl: null,
		});
	});

	it("builds authenticated user context from persisted user data", async () => {
		mockVerifiedClaims({
			sub: "clerk_123",
			email: "user@example.com",
			name: "User",
			image_url: "https://example.com/avatar.png",
		});
		const service = createAuthService();

		await expect(
			service.authenticateBearerToken("token"),
		).resolves.toEqual({
			clerkUserId: "clerk_123",
			localUserId: "user_123",
			email: "persisted@example.com",
			displayName: "Persisted User",
			avatarUrl: "https://example.com/persisted.png",
		});
	});
});

function mockVerifiedClaims(claims: Record<string, unknown>): void {
	verifyTokenMock.mockResolvedValueOnce(
		claims as Awaited<ReturnType<typeof verifyToken>>,
	);
}

function createAuthService(
	users: UserService = createUserService(),
): AuthService {
	const config = {
		clerkAuthorizedParties: ["http://localhost:3000"],
		clerkJwtKey: "jwt-key",
		clerkSecretKey: "secret-key",
	} as BackendConfigService;

	return new AuthService(config, users);
}

type UserServiceMock = Pick<UserService, "upsertFromClerkIdentity">;

function createUserService(): UserService {
	const users: UserServiceMock = {
		upsertFromClerkIdentity: vi.fn(async () => ({
			id: "user_123",
			clerkUserId: "clerk_123",
			email: "persisted@example.com",
			displayName: "Persisted User",
			avatarUrl: "https://example.com/persisted.png",
			createdAt: new Date("2026-01-01T00:00:00.000Z"),
			updatedAt: new Date("2026-01-01T00:00:00.000Z"),
		})),
	};

	return users as UserService;
}
