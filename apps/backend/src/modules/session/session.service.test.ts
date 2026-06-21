import { beforeEach, describe, expect, it, vi } from "vitest";

import { sessionBootstrapSchema } from "@jordan-devs/shared";
import type { SessionBootstrap } from "@jordan-devs/shared";

import {
	ApiErrorException,
	createApiError,
} from "../../common/errors/api-error.js";
import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import type { AuthorizationService } from "../authorization/authorization.service.js";
import type { UserService } from "../users/user.service.js";
import { SessionService } from "./session.service.js";

describe("SessionService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	const authenticatedUser: AuthenticatedUser = {
		clerkUserId: "clerk_123",
		localUserId: "user_123",
		email: "user@example.com",
		displayName: "User",
		avatarUrl: "https://example.com/avatar.png",
	};

	it("returns local user and effective permissions", async () => {
		const service = createSessionService();

		const result = await service.getSessionBootstrap(authenticatedUser);

		expect(result.user).toEqual({
			id: "user_123",
			clerkUserId: "clerk_123",
			email: "persisted@example.com",
			displayName: "Persisted User",
			avatarUrl: "https://example.com/persisted.png",
			createdAt: expect.any(String),
			updatedAt: expect.any(String),
		});
		expect(result.permissions).toEqual(["dashboard:read", "guild:read"]);
	});

	it("maps createdAt and updatedAt to ISO strings", async () => {
		const service = createSessionService();

		const result = await service.getSessionBootstrap(authenticatedUser);

		expect(result.user.createdAt).toBe("2026-01-01T00:00:00.000Z");
		expect(result.user.updatedAt).toBe("2026-01-01T00:00:00.000Z");
	});

	it("output passes sessionBootstrapSchema", async () => {
		const service = createSessionService();

		const result = await service.getSessionBootstrap(authenticatedUser);

		expect(() => sessionBootstrapSchema.parse(result)).not.toThrow();
	});

	it("returns permissions: [] when the user has no effective permissions", async () => {
		const authorization = createAuthorizationService([]);
		const service = createSessionService(authorization);

		const result = await service.getSessionBootstrap(authenticatedUser);

		expect(result.permissions).toEqual([]);
	});

	it("does not expose raw Clerk claims", async () => {
		const service = createSessionService();

		const result = await service.getSessionBootstrap(authenticatedUser);

		expect(result).not.toHaveProperty("sessionClaims");
		expect(result).not.toHaveProperty("clerkToken");
		expect(result).not.toHaveProperty("rawClaims");
	});

	it("throws controlled error when local user is missing", async () => {
		const users = createUserService(null);
		const service = createSessionService(undefined, users);

		await expect(
			service.getSessionBootstrap(authenticatedUser),
		).rejects.toBeInstanceOf(ApiErrorException);

		await expect(
			service.getSessionBootstrap(authenticatedUser),
		).rejects.toMatchObject({
			statusCode: 500,
			error: createApiError(
				"SESSION_USER_NOT_FOUND",
				"Authenticated user record could not be loaded.",
			),
		});
	});
});

function createSessionService(
	authorization?: AuthorizationService,
	users?: UserService,
): SessionService {
	return new SessionService(
		authorization ?? createAuthorizationService(),
		users ?? createUserService(),
	);
}

function createAuthorizationService(
	permissions?: string[],
): AuthorizationService {
	const authorization: Pick<
		AuthorizationService,
		"getEffectivePermissions"
	> = {
		getEffectivePermissions: vi.fn(async () =>
			permissions !== undefined
				? permissions
				: (["dashboard:read", "guild:read"] as string[]),
		),
	};

	return authorization as AuthorizationService;
}

type UserServiceMock = Pick<UserService, "findById">;

function createUserService(returnValue: object | null = undefined): UserService {
	const user = returnValue !== undefined ? returnValue : {
		id: "user_123",
		clerkUserId: "clerk_123",
		email: "persisted@example.com",
		displayName: "Persisted User",
		avatarUrl: "https://example.com/persisted.png",
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	};

	const users: UserServiceMock = {
		findById: vi.fn(async () => user),
	};

	return users as UserService;
}
