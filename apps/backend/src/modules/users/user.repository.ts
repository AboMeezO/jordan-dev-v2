import { Injectable } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";

import {
	DatabaseService,
	type DatabaseTransactionClient,
} from "../../database/database.service.js";
import type { ClerkUserIdentity, DiscordUserIdentity } from "./user.types.js";

type DatabaseClient = DatabaseService | DatabaseTransactionClient;

@Injectable()
export class UserRepository {
	constructor(private readonly database: DatabaseService) {}

	findById(id: string, client: DatabaseClient = this.database): Promise<User | null> {
		return client.user.findUnique({ where: { id } });
	}

	findByClerkUserId(
		clerkUserId: string,
		client: DatabaseClient = this.database,
	): Promise<User | null> {
		return client.user.findUnique({ where: { clerkUserId } });
	}

	findByDiscordUserId(
		discordUserId: string,
		client: DatabaseClient = this.database,
	): Promise<User | null> {
		return client.user.findUnique({ where: { discordUserId } });
	}

	upsertFromDiscordIdentity(
		identity: DiscordUserIdentity,
		client: DatabaseClient = this.database,
	): Promise<User> {
		const data = {
			discordUserId: identity.discordUserId,
			displayName: identity.displayName ?? null,
			avatarUrl: identity.avatarUrl ?? null,
		};

		return client.user.upsert({
			where: { discordUserId: identity.discordUserId },
			create: data,
			update: data,
		});
	}

	upsertFromClerkIdentity(
		identity: ClerkUserIdentity,
		client: DatabaseClient = this.database,
	): Promise<User> {
		const data = this.toUserData(identity);

		return client.user.upsert({
			where: { clerkUserId: identity.clerkUserId },
			create: data,
			update: data,
		});
	}

	private toUserData(identity: ClerkUserIdentity): Prisma.UserUncheckedCreateInput {
		return {
			clerkUserId: identity.clerkUserId,
			email: identity.email ?? null,
			displayName: identity.displayName ?? null,
			avatarUrl: identity.avatarUrl ?? null,
		};
	}

	async findMany(query: {
		page: number;
		limit: number;
		search: string | undefined;
		roleId: string | undefined;
	}) {
		const where: Prisma.UserWhereInput = {};

		if (query.search) {
			where.OR = [
				{ displayName: { contains: query.search, mode: "insensitive" } },
				{ email: { contains: query.search, mode: "insensitive" } },
			];
		}

		if (query.roleId) {
			where.roles = {
				some: { roleId: query.roleId },
			};
		}

		const [users, total] = await Promise.all([
			this.database.user.findMany({
				where,
				skip: (query.page - 1) * query.limit,
				take: query.limit,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					clerkUserId: true,
					email: true,
					displayName: true,
					avatarUrl: true,
					createdAt: true,
					roles: {
						select: {
							role: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			}),
			this.database.user.count({ where }),
		]);

		return {
			users: users.map((user) => ({
				id: user.id,
				clerkUserId: user.clerkUserId,
				email: user.email,
				displayName: user.displayName,
				avatarUrl: user.avatarUrl,
				createdAt: user.createdAt.toISOString(),
				roles: user.roles.map((ur) => ({
					id: ur.role.id,
					name: ur.role.name,
				})),
			})),
			total,
			page: query.page,
			limit: query.limit,
		};
	}

	async findByIdWithRoles(id: string) {
		const user = await this.database.user.findUnique({
			where: { id },
			select: {
				id: true,
				clerkUserId: true,
				email: true,
				displayName: true,
				avatarUrl: true,
				createdAt: true,
				updatedAt: true,
				roles: {
					select: {
						role: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		});

		if (!user) {
			return null;
		}

		return {
			id: user.id,
			clerkUserId: user.clerkUserId,
			email: user.email,
			displayName: user.displayName,
			avatarUrl: user.avatarUrl,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
			roles: user.roles.map((ur) => ({
				id: ur.role.id,
				name: ur.role.name,
			})),
		};
	}

	async updateUser(
		id: string,
		data: { displayName: string | undefined; email: string | undefined },
	) {
		const updateData: Record<string, string> = {};
		if (data.displayName !== undefined) {
			updateData.displayName = data.displayName;
		}
		if (data.email !== undefined) {
			updateData.email = data.email;
		}

		const user = await this.database.user.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
				clerkUserId: true,
				email: true,
				displayName: true,
				avatarUrl: true,
				createdAt: true,
				updatedAt: true,
				roles: {
					select: {
						role: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
		});

		return {
			id: user.id,
			clerkUserId: user.clerkUserId,
			email: user.email,
			displayName: user.displayName,
			avatarUrl: user.avatarUrl,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
			roles: user.roles.map((ur) => ({
				id: ur.role.id,
				name: ur.role.name,
			})),
		};
	}

	async setUserRoles(userId: string, roleIds: readonly string[]) {
		return this.database.transaction(async (tx) => {
			await tx.userRole.deleteMany({ where: { userId } });

			if (roleIds.length > 0) {
				await tx.userRole.createMany({
					data: roleIds.map((roleId) => ({ userId, roleId })),
				});
			}

			const user = await tx.user.findUnique({
				where: { id: userId },
				select: {
					id: true,
					clerkUserId: true,
					email: true,
					displayName: true,
					avatarUrl: true,
					createdAt: true,
					updatedAt: true,
					roles: {
						select: {
							role: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			});

			return {
				id: user!.id,
				clerkUserId: user!.clerkUserId,
				email: user!.email,
				displayName: user!.displayName,
				avatarUrl: user!.avatarUrl,
				createdAt: user!.createdAt.toISOString(),
				updatedAt: user!.updatedAt.toISOString(),
				roles: user!.roles.map((ur) => ({
					id: ur.role.id,
					name: ur.role.name,
				})),
			};
		});
	}
}

