import { Injectable } from "@nestjs/common";
import { RoleGrantJobStatus } from "@prisma/client";

import { DatabaseService } from "../../database/database.service.js";

@Injectable()
export class DashboardRepository {
	public constructor(
		private readonly database: DatabaseService,
	) {}

	public countUsers(): Promise<number> {
		return this.database.user.count();
	}

	public countRoles(): Promise<number> {
		return this.database.role.count();
	}

	public countPermissions(): Promise<number> {
		return this.database.permission.count();
	}

	public countVerifiedUsers(): Promise<number> {
		return this.database.user.count({
			where: {
				verifications: {
					some: {
						verifiedAt: {
							not: null,
						},
					},
				},
			},
		});
	}

	public countPendingRoleGrants(): Promise<number> {
		return this.database.verificationRoleGrantJob.count({
			where: {
				status: RoleGrantJobStatus.PENDING,
			},
		});
	}

	public getVerificationStatusCounts() {
		return this.database.verification.groupBy({
			by: ["status"],
			_count: {
				_all: true,
			},
		});
	}

	public async getUsersByRole() {
		const roles = await this.database.role.findMany({
			orderBy: {
				name: "asc",
			},
			select: {
				name: true,
				_count: {
					select: {
						users: true,
					},
				},
			},
		});

		return roles.map((role) => ({
			role: role.name,
			users: role._count.users,
		}));
	}

	public getRecentUsers() {
		return this.database.user.findMany({
			orderBy: {
				createdAt: "desc",
			},
			take: 5,
			select: {
				id: true,
				clerkUserId: true,
				email: true,
				displayName: true,
				avatarUrl: true,
				createdAt: true,
			},
		});
	}

	public getRecentVerificationEvents() {
		return this.database.verificationEvent.findMany({
			orderBy: {
				createdAt: "desc",
			},
			take: 5,
			select: {
				id: true,
				type: true,
				status: true,
				message: true,
				createdAt: true,
				user: {
					select: {
						id: true,
						clerkUserId: true,
						email: true,
						displayName: true,
						avatarUrl: true,
						createdAt: true,
					},
				},
			},
		});
	}
}
