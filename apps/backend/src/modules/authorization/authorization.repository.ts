import type { Permission } from "@jordan-devs/shared";
import { Injectable } from "@nestjs/common";

import {
	DatabaseService,
	type DatabaseTransactionClient,
} from "../../database/database.service.js";

type DatabaseClient =
	| DatabaseService
	| DatabaseTransactionClient;

@Injectable()
export class AuthorizationRepository {
	constructor(private readonly database: DatabaseService) {}

	async getUserPermissions(
		userId: string,
		client: DatabaseClient = this.database,
	): Promise<readonly Permission[]> {
		const rolePermissions =
			await client.rolePermission.findMany({
				where: {
					role: {
						users: {
							some: {
								userId,
							},
						},
					},
				},
				select: {
					permissionId: true,
				},
			});

		return [
			...new Set(
				rolePermissions.map(
					(rolePermission) =>
						rolePermission.permissionId as Permission,
				),
			),
		];
	}

	async syncKnownPermissions(
		permissions: readonly Permission[],
		client: DatabaseClient = this.database,
	): Promise<void> {
		await Promise.all(
			permissions.map((permission) =>
				client.permission.upsert({
					where: { id: permission },
					create: { id: permission },
					update: {},
				}),
			),
		);
	}

	async upsertRoleWithPermissions(
		{
			description,
			name,
			permissions,
		}: {
			description: string;
			name: string;
			permissions: readonly Permission[];
		},
		client: DatabaseClient = this.database,
	): Promise<string> {
		const role = await client.role.upsert({
			where: { name },
			create: { name, description },
			update: { description },
			select: { id: true },
		});

		await Promise.all(
			permissions.map((permission) =>
				client.rolePermission.upsert({
					where: {
						roleId_permissionId: {
							roleId: role.id,
							permissionId: permission,
						},
					},
					create: {
						roleId: role.id,
						permissionId: permission,
					},
					update: {},
				}),
			),
		);

		return role.id;
	}

	async assignRoleToClerkUsers(
		{
			clerkUserIds,
			roleId,
		}: {
			clerkUserIds: readonly string[];
			roleId: string;
		},
		client: DatabaseClient = this.database,
	): Promise<number> {
		let assignedUsers = 0;

		for (const clerkUserId of clerkUserIds) {
			const user = await client.user.upsert({
				where: { clerkUserId },
				create: { clerkUserId },
				update: {},
				select: { id: true },
			});

			await client.userRole.upsert({
				where: {
					userId_roleId: {
						userId: user.id,
						roleId,
					},
				},
				create: {
					userId: user.id,
					roleId,
				},
				update: {},
			});

			assignedUsers += 1;
		}

		return assignedUsers;
	}
}
