import {
	canAll,
	canAny,
	type Permission,
	permissions,
} from "@jordan-devs/shared";
import { Injectable } from "@nestjs/common";

import {
	DatabaseService,
	type DatabaseTransactionClient,
} from "../../database/database.service.js";
import { AuthorizationRepository } from "./authorization.repository.js";

export type PermissionBootstrapResult = {
	readonly adminRoleAssignedUsers: number;
	readonly adminRoleName: string;
	readonly knownPermissionsSynced: number;
};

@Injectable()
export class AuthorizationService {
	constructor(
		private readonly authorization: AuthorizationRepository,
		private readonly database: DatabaseService,
	) {}

	getEffectivePermissions(
		userId: string,
		transaction?: DatabaseTransactionClient,
	): Promise<readonly Permission[]> {
		return this.authorization.getUserPermissions(
			userId,
			transaction,
		);
	}

	canAll(
		userPermissions: unknown,
		requiredPermissions: readonly Permission[],
	): boolean {
		return canAll(userPermissions, requiredPermissions);
	}

	canAny(
		userPermissions: unknown,
		requiredPermissions: readonly Permission[],
	): boolean {
		return canAny(userPermissions, requiredPermissions);
	}

	syncKnownPermissions(
		transaction?: DatabaseTransactionClient,
	): Promise<void> {
		return this.authorization.syncKnownPermissions(
			Object.values(permissions),
			transaction,
		);
	}

	bootstrapPermissions(
		adminClerkUserIds: readonly string[],
	): Promise<PermissionBootstrapResult> {
		const knownPermissions = Object.values(permissions);
		const adminRoleName = "admin";

		return this.database.transaction(
			async (transaction) => {
				await this.authorization.syncKnownPermissions(
					knownPermissions,
					transaction,
				);

				if (adminClerkUserIds.length === 0) {
					return {
						adminRoleAssignedUsers: 0,
						adminRoleName,
						knownPermissionsSynced: knownPermissions.length,
					};
				}

				const roleId =
					await this.authorization.upsertRoleWithPermissions(
						{
							description:
								"Initial administrator role with all known permissions.",
							name: adminRoleName,
							permissions: knownPermissions,
						},
						transaction,
					);
				const assignedUsers =
					await this.authorization.assignRoleToClerkUsers(
						{
							clerkUserIds: adminClerkUserIds,
							roleId,
						},
						transaction,
					);

				return {
					adminRoleAssignedUsers: assignedUsers,
					adminRoleName,
					knownPermissionsSynced: knownPermissions.length,
				};
			},
		);
	}
}
