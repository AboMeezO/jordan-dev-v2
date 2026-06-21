import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host.js";
import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import type { AuthService } from "./auth.service.js";
import { ClerkAuthGuard } from "./clerk-auth.guard.js";

describe("ClerkAuthGuard", () => {
	it("rejects requests without a bearer token", async () => {
		const guard = new ClerkAuthGuard(mockAuthService(undefined));

		await expect(
			guard.canActivate(mockContext(undefined)),
		).rejects.toBeInstanceOf(UnauthorizedException);
	});

	it("attaches authenticated users to the request", async () => {
		const auth = mockAuthService("token");
		const request = { headers: { authorization: "Bearer token" } };
		const guard = new ClerkAuthGuard(auth);

		await expect(
			guard.canActivate(mockContext(request)),
		).resolves.toBe(true);
		expect(request).toMatchObject({
			user: { clerkUserId: "clerk_123", localUserId: "user_123" },
		});
	});
});

type AuthServiceMock = Pick<
	AuthService,
	"extractBearerToken" | "authenticateBearerToken"
>;

function mockAuthService(token: string | undefined): AuthService {
	const auth: AuthServiceMock = {
		extractBearerToken: vi.fn(() => token),
		authenticateBearerToken: vi.fn(async () => ({
			clerkUserId: "clerk_123",
			localUserId: "user_123",
			email: null,
			displayName: null,
			avatarUrl: null,
		})),
	};

	return auth as AuthService;
}

type MockRequest = {
	headers: { authorization?: string };
	user?: AuthenticatedUser;
};

function mockContext(request?: MockRequest): ExecutionContext {
	const contextRequest = request ?? ({ headers: {} } satisfies MockRequest);

	return new ExecutionContextHost([contextRequest]);
}

