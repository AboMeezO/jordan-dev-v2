import {
	ForbiddenException,
	UnauthorizedException,
} from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { permissions, type Permission } from "@jordan-devs/shared";
import { describe, expect, it, vi } from "vitest";

import type { PermissionRequirement } from "../../common/types/permission-requirement.js";
import type { AuthorizationService } from "./authorization.service.js";
import { PermissionGuard } from "./permission.guard.js";

describe("PermissionGuard", () => {
	it("allows routes without permission metadata", async () => {
		const guard = new PermissionGuard(
			mockReflector(undefined),
			mockAuthorization([]),
		);

		await expect(guard.canActivate(mockContext())).resolves.toBe(true);
	});

	it("requires an authenticated request when permissions are declared", async () => {
		const guard = new PermissionGuard(
			mockReflector({
				mode: "all",
				permissions: [permissions.settingsRead],
			}),
			mockAuthorization([]),
		);

		await expect(guard.canActivate(mockContext())).rejects.toBeInstanceOf(
			UnauthorizedException,
		);
	});

	it("denies missing permissions", async () => {
		const guard = new PermissionGuard(
			mockReflector({
				mode: "all",
				permissions: [permissions.settingsRead],
			}),
			mockAuthorization([]),
		);

		await expect(
			guard.canActivate(mockContext({ localUserId: "user_123" })),
		).rejects.toBeInstanceOf(ForbiddenException);
	});

	it("allows matching permissions", async () => {
		const guard = new PermissionGuard(
			mockReflector({
				mode: "all",
				permissions: [permissions.settingsRead],
			}),
			mockAuthorization([permissions.settingsRead]),
		);

		await expect(
			guard.canActivate(mockContext({ localUserId: "user_123" })),
		).resolves.toBe(true);
	});
});

function mockReflector(
	requirement: PermissionRequirement | undefined,
): Reflector {
	return {
		getAllAndOverride: vi.fn(() => requirement),
	} as unknown as Reflector;
}

function mockAuthorization(
	userPermissions: readonly string[],
): AuthorizationService {
	return {
		getEffectivePermissions: vi.fn(async () => userPermissions),
		canAll: vi.fn(
			(granted: readonly string[], required: readonly Permission[]) =>
				required.every((permission) =>
					granted.includes(permission),
				),
		),
		canAny: vi.fn(
			(granted: readonly string[], required: readonly Permission[]) =>
				required.some((permission) =>
					granted.includes(permission),
				),
		),
	} as unknown as AuthorizationService;
}

function mockContext(user?: { localUserId: string }): ExecutionContext {
	return {
		getHandler: vi.fn(),
		getClass: vi.fn(),
		switchToHttp: () => ({
			getRequest: () => ({ user }),
		}),
	} as unknown as ExecutionContext;
}
