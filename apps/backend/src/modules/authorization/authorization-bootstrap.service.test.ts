import { permissions } from "@jordan-devs/shared";
import { describe, expect, it, vi } from "vitest";

import type { BackendConfigService } from "../../config/app.config.js";
import type { AuthorizationService } from "./authorization.service.js";

const expectedPermissionCount =
	Object.values(permissions).length;

describe("AuthorizationBootstrapService", () => {
	it("calls bootstrapPermissions with empty array when no admin configured", async () => {
		const { authorization } =
			createAuthorizationServiceMock();
		const config = createConfigServiceMock(undefined);
		const { AuthorizationBootstrapService } =
			await import("./authorization-bootstrap.service.js");
		const service = new AuthorizationBootstrapService(
			authorization as unknown as AuthorizationService,
			config,
		);

		await service.onApplicationBootstrap();

		expect(
			authorization.bootstrapPermissions,
		).toHaveBeenCalledWith([]);
	});

	it("calls bootstrapPermissions with admin user ID when configured", async () => {
		const { authorization } =
			createAuthorizationServiceMock();
		const config = createConfigServiceMock("user_2abc123");
		const { AuthorizationBootstrapService } =
			await import("./authorization-bootstrap.service.js");
		const service = new AuthorizationBootstrapService(
			authorization as unknown as AuthorizationService,
			config,
		);

		await service.onApplicationBootstrap();

		expect(
			authorization.bootstrapPermissions,
		).toHaveBeenCalledWith(["user_2abc123"]);
	});

	it("resolves without error", async () => {
		const { authorization } =
			createAuthorizationServiceMock();
		const config = createConfigServiceMock("user_2abc123");
		const { AuthorizationBootstrapService } =
			await import("./authorization-bootstrap.service.js");
		const service = new AuthorizationBootstrapService(
			authorization as unknown as AuthorizationService,
			config,
		);

		await expect(
			service.onApplicationBootstrap(),
		).resolves.toBeUndefined();
	});
});

function createAuthorizationServiceMock() {
	const authorization = {
		bootstrapPermissions: vi.fn(() =>
			Promise.resolve({
				adminRoleAssignedUsers: 1,
				adminRoleName: "admin",
				knownPermissionsSynced: expectedPermissionCount,
			}),
		),
	};

	return { authorization };
}

function createConfigServiceMock(
	initialAdminClerkUserId: string | undefined,
): BackendConfigService {
	return {
		initialAdminClerkUserId,
	} as unknown as BackendConfigService;
}
