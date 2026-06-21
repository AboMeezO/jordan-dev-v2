import {
	type Permission,
	permissions,
} from "@jordan-devs/shared";
import { describe, expect, it, vi } from "vitest";

import type {
	DatabaseService,
	DatabaseTransactionClient,
} from "../../database/database.service.js";
import type { AuthorizationRepository } from "./authorization.repository.js";
import { AuthorizationService } from "./authorization.service.js";

const transaction = {} as DatabaseTransactionClient;

describe("AuthorizationService", () => {
	it("syncs known permissions without assigning an admin role when no admin IDs are configured", async () => {
		const {
			assignRoleToClerkUsers,
			repository: authorization,
			syncKnownPermissions,
			upsertRoleWithPermissions,
		} = createAuthorizationRepository();
		const database = createDatabaseService();
		const service = new AuthorizationService(
			authorization,
			database,
		);

		await expect(
			service.bootstrapPermissions([]),
		).resolves.toEqual({
			adminRoleAssignedUsers: 0,
			adminRoleName: "admin",
			knownPermissionsSynced:
				Object.values(permissions).length,
		});

		expect(syncKnownPermissions).toHaveBeenCalledWith(
			Object.values(permissions),
			transaction,
		);
		expect(
			upsertRoleWithPermissions,
		).not.toHaveBeenCalled();
		expect(assignRoleToClerkUsers).not.toHaveBeenCalled();
	});

	it("creates the admin role with all permissions and assigns configured Clerk users", async () => {
		const {
			assignRoleToClerkUsers,
			repository: authorization,
			upsertRoleWithPermissions,
		} = createAuthorizationRepository();
		const database = createDatabaseService();
		const service = new AuthorizationService(
			authorization,
			database,
		);

		await expect(
			service.bootstrapPermissions(["clerk_1", "clerk_2"]),
		).resolves.toEqual({
			adminRoleAssignedUsers: 2,
			adminRoleName: "admin",
			knownPermissionsSynced:
				Object.values(permissions).length,
		});

		expect(upsertRoleWithPermissions).toHaveBeenCalledWith(
			{
				description:
					"Initial administrator role with all known permissions.",
				name: "admin",
				permissions: Object.values(permissions),
			},
			transaction,
		);
		expect(assignRoleToClerkUsers).toHaveBeenCalledWith(
			{
				clerkUserIds: ["clerk_1", "clerk_2"],
				roleId: "role_admin",
			},
			transaction,
		);
	});
});

type AuthorizationRepositoryMock = Pick<
	AuthorizationRepository,
	| "assignRoleToClerkUsers"
	| "syncKnownPermissions"
	| "upsertRoleWithPermissions"
	| "getUserPermissions"
>;

function createAuthorizationRepository(): {
	assignRoleToClerkUsers: AuthorizationRepositoryMock["assignRoleToClerkUsers"];
	repository: AuthorizationRepository;
	syncKnownPermissions: AuthorizationRepositoryMock["syncKnownPermissions"];
	upsertRoleWithPermissions: AuthorizationRepositoryMock["upsertRoleWithPermissions"];
} {
	const assignRoleToClerkUsers: AuthorizationRepositoryMock["assignRoleToClerkUsers"] =
		vi.fn(() => Promise.resolve(2));
	const syncKnownPermissions: AuthorizationRepositoryMock["syncKnownPermissions"] =
		vi.fn(() => Promise.resolve());
	const upsertRoleWithPermissions: AuthorizationRepositoryMock["upsertRoleWithPermissions"] =
		vi.fn(() => Promise.resolve("role_admin"));
	const repository: AuthorizationRepositoryMock = {
		assignRoleToClerkUsers,
		getUserPermissions: vi.fn(() =>
			Promise.resolve([
				permissions.dashboardRead,
			] satisfies Permission[]),
		),
		syncKnownPermissions,
		upsertRoleWithPermissions,
	};

	return {
		assignRoleToClerkUsers,
		repository: repository as AuthorizationRepository,
		syncKnownPermissions,
		upsertRoleWithPermissions,
	};
}

type DatabaseServiceMock = Pick<
	DatabaseService,
	"transaction"
>;

function createDatabaseService(): DatabaseService {
	const database: DatabaseServiceMock = {
		transaction: (callback) => callback(transaction),
	};

	return database as DatabaseService;
}
