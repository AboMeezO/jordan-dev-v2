import { Injectable } from "@nestjs/common";

import {
	DatabaseService,
	type DatabaseTransactionClient,
} from "../../database/database.service.js";

type DatabaseClient = DatabaseService | DatabaseTransactionClient;

@Injectable()
export class RolesRepository {
	constructor(private readonly database: DatabaseService) {}

	async findAllWithCount(client: DatabaseClient = this.database) {
		const roles = await client.role.findMany({
			orderBy: { name: "asc" },
			select: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				_count: {
					select: { users: true },
				},
			},
		});

		return roles.map((role) => ({
			id: role.id,
			name: role.name,
			description: role.description,
			createdAt: role.createdAt.toISOString(),
			userCount: role._count.users,
		}));
	}

	async findByIdWithPermissions(id: string, client: DatabaseClient = this.database) {
		const role = await client.role.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				updatedAt: true,
				_count: {
					select: { users: true },
				},
				permissions: {
					select: {
						permissionId: true,
					},
				},
			},
		});

		if (!role) {
			return null;
		}

		return {
			id: role.id,
			name: role.name,
			description: role.description,
			createdAt: role.createdAt.toISOString(),
			updatedAt: role.updatedAt.toISOString(),
			permissions: role.permissions.map((rp) => rp.permissionId),
			userCount: role._count.users,
		};
	}

	async create(
		data: { name: string; description: string | undefined },
		client: DatabaseClient = this.database,
	) {
		const role = await client.role.create({
			data: {
				name: data.name,
				description: data.description ?? null,
			},
			select: { id: true },
		});
		return role.id;
	}

	async update(
		id: string,
		data: { name: string | undefined; description: string | null | undefined },
		client: DatabaseClient = this.database,
	) {
		const updateData: Record<string, unknown> = {};
		if (data.name !== undefined) {
			updateData.name = data.name;
		}
		if (data.description !== undefined) {
			updateData.description = data.description;
		}
		await client.role.update({
			where: { id },
			data: updateData,
		});
	}

	async delete(id: string, client: DatabaseClient = this.database) {
		await client.role.delete({ where: { id } });
	}

	async setPermissions(roleId: string, permissionIds: readonly string[]) {
		return this.database.transaction(async (tx) => {
			await tx.rolePermission.deleteMany({ where: { roleId } });

			if (permissionIds.length > 0) {
				await tx.rolePermission.createMany({
					data: permissionIds.map((permissionId) => ({
						roleId,
						permissionId,
					})),
				});
			}

			const role = await tx.role.findUnique({
				where: { id: roleId },
				select: {
					id: true,
					name: true,
					description: true,
					createdAt: true,
					updatedAt: true,
					_count: { select: { users: true } },
					permissions: {
						select: { permissionId: true },
					},
				},
			});

			return {
				id: role!.id,
				name: role!.name,
				description: role!.description,
				createdAt: role!.createdAt.toISOString(),
				updatedAt: role!.updatedAt.toISOString(),
				permissions: role!.permissions.map((rp) => rp.permissionId),
				userCount: role!._count.users,
			};
		});
	}
}
