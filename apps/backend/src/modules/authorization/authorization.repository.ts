import { Injectable } from "@nestjs/common";
import type { Permission } from "@jordan-devs/shared";

import {
	DatabaseService,
	type DatabaseTransactionClient,
} from "../../database/database.service.js";

type DatabaseClient = DatabaseService | DatabaseTransactionClient;

@Injectable()
export class AuthorizationRepository {
	constructor(private readonly database: DatabaseService) {}

	async getUserPermissions(
		userId: string,
		client: DatabaseClient = this.database,
	): Promise<readonly Permission[]> {
		const rolePermissions = await client.rolePermission.findMany({
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
}

