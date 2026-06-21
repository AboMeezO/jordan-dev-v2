import {
	type Permission,
	permissions,
} from "@jordan-devs/shared";
import type { ExecutionContext } from "@nestjs/common";
import {
	ForbiddenException,
	UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host.js";
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

		await expect(
			guard.canActivate(mockContext()),
		).resolves.toBe(true);
	});

	it("requires an authenticated request when permissions are declared", async () => {
		const guard = new PermissionGuard(
			mockReflector({
				mode: "all",
				permissions: [permissions.settingsRead],
			}),
			mockAuthorization([]),
		);

		await expect(
			guard.canActivate(mockContext()),
		).rejects.toBeInstanceOf(UnauthorizedException);
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
			guard.canActivate(
				mockContext({ localUserId: "user_123" }),
			),
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
			guard.canActivate(
				mockContext({ localUserId: "user_123" }),
			),
		).resolves.toBe(true);
	});
});

function mockReflector(
	requirement: PermissionRequirement | undefined,
): Reflector {
	const reflector = new Reflector();
	vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(
		requirement,
	);

	return reflector;
}

type AuthorizationServiceMock = Pick<
	AuthorizationService,
	"getEffectivePermissions" | "canAll" | "canAny"
>;

function mockAuthorization(
	userPermissions: readonly Permission[],
): AuthorizationService {
	const authorization: AuthorizationServiceMock = {
		getEffectivePermissions: vi.fn(() =>
			Promise.resolve(userPermissions),
		),
		canAll: vi.fn(
			(
				granted: readonly string[],
				required: readonly Permission[],
			) =>
				required.every((permission) =>
					granted.includes(permission),
				),
		),
		canAny: vi.fn(
			(
				granted: readonly string[],
				required: readonly Permission[],
			) =>
				required.some((permission) =>
					granted.includes(permission),
				),
		),
	};

	return authorization as AuthorizationService;
}

function mockContext(user?: {
	localUserId: string;
}): ExecutionContext {
	return new ExecutionContextHost(
		[{ user }],
		class {},
		() => undefined,
	);
}
