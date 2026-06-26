import {
	type Permission,
	permissions as knownPermissions,
} from "@jordan-devs/shared";
import { sessionBootstrapSchema } from "@jordan-devs/shared";
import type { User } from "@prisma/client";
import {
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

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

		const result = await service.getSessionBootstrap(
			authenticatedUser,
		);

		expect(result.user).toEqual({
			id: "user_123",
			clerkUserId: "clerk_123",
			email: "persisted@example.com",
			displayName: "Persisted User",
			avatarUrl: "https://example.com/persisted.png",
			createdAt: result.user.createdAt,
			updatedAt: result.user.updatedAt,
		});
		expect(result.permissions).toEqual([
			"dashboard:read",
			"guild:read",
		]);
	});

	it("maps createdAt and updatedAt to ISO strings", async () => {
		const service = createSessionService();

		const result = await service.getSessionBootstrap(
			authenticatedUser,
		);

		expect(result.user.createdAt).toBe(
			"2026-01-01T00:00:00.000Z",
		);
		expect(result.user.updatedAt).toBe(
			"2026-01-01T00:00:00.000Z",
		);
	});

	it("output passes sessionBootstrapSchema", async () => {
		const service = createSessionService();

		const result = await service.getSessionBootstrap(
			authenticatedUser,
		);

		expect(() =>
			sessionBootstrapSchema.parse(result),
		).not.toThrow();
	});

	it("returns permissions: [] when the user has no effective permissions", async () => {
		const authorization = createAuthorizationService([]);
		const service = createSessionService(authorization);

		const result = await service.getSessionBootstrap(
			authenticatedUser,
		);

		expect(result.permissions).toEqual([]);
	});

	it("does not expose raw Clerk claims", async () => {
		const service = createSessionService();

		const result = await service.getSessionBootstrap(
			authenticatedUser,
		);

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
		users ?? createUserService(mockUserData()),
	);
}

function createAuthorizationService(
	permissions?: readonly Permission[],
): AuthorizationService {
	const authorization: Pick<
		AuthorizationService,
		"getEffectivePermissions"
	> = {
		getEffectivePermissions: vi.fn(() =>
			Promise.resolve(
				permissions ?? [
					knownPermissions.dashboardRead,
					knownPermissions.guildRead,
				],
			),
		),
	};

	return authorization as AuthorizationService;
}

function mockUserData(): User {
	return {
		id: "user_123",
		clerkUserId: "clerk_123",
		discordUserId: null,
		email: "persisted@example.com",
		displayName: "Persisted User",
		avatarUrl: "https://example.com/persisted.png",
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	};
}

type UserServiceMock = Pick<UserService, "findById">;

function createUserService(
	returnValue: User | null,
): UserService {
	const users: UserServiceMock = {
		findById: vi.fn(() => Promise.resolve(returnValue)),
	};

	return users as UserService;
}
