import { UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

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

function mockAuthService(token: string | undefined): AuthService {
	return {
		extractBearerToken: vi.fn(() => token),
		authenticateBearerToken: vi.fn(async () => ({
			clerkUserId: "clerk_123",
			localUserId: "user_123",
			email: null,
			displayName: null,
			avatarUrl: null,
		})),
	} as unknown as AuthService;
}

function mockContext(request?: unknown): ExecutionContext {
	return {
		switchToHttp: () => ({
			getRequest: () =>
				request ?? { headers: { authorization: undefined } },
		}),
	} as unknown as ExecutionContext;
}

