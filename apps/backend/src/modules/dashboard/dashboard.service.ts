import {
	type DashboardOverview,
	dashboardOverviewSchema,
} from "@jordan-devs/shared";
import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../../database/database.service.js";
import { DashboardRepository } from "./dashboard.repository.js";

@Injectable()
export class DashboardService {
	public constructor(
		private readonly database: DatabaseService,
		private readonly dashboard: DashboardRepository,
	) {}

	public async getOverview(): Promise<DashboardOverview> {
		const [
			totalUsers,
			totalRoles,
			totalPermissions,
			verifiedUsers,
			pendingRoleGrants,
			verificationStatusCounts,
			usersByRole,
			recentUsers,
			recentVerificationEvents,
		] = await Promise.all([
			this.dashboard.countUsers(),
			this.dashboard.countRoles(),
			this.dashboard.countPermissions(),
			this.dashboard.countVerifiedUsers(),
			this.dashboard.countPendingRoleGrants(),
			this.dashboard.getVerificationStatusCounts(),
			this.dashboard.getUsersByRole(),
			this.dashboard.getRecentUsers(),
			this.dashboard.getRecentVerificationEvents(),
		]);

		await this.database.checkConnection();

		const overview: DashboardOverview = {
			stats: {
				totalUsers,
				totalRoles,
				totalPermissions,
				verifiedUsers,
				unverifiedUsers: Math.max(totalUsers - verifiedUsers, 0),
				pendingRoleGrants,
			},
			verificationStatusCounts: verificationStatusCounts.map(
				(statusCount) => ({
					label: statusCount.status,
					value: statusCount._count._all,
				}),
			),
			usersByRole,
			recentUsers: recentUsers.map((user) => ({
				...user,
				createdAt: user.createdAt.toISOString(),
			})),
			recentVerificationEvents: recentVerificationEvents.map(
				(event) => ({
					...event,
					type: event.type,
					status: event.status,
					createdAt: event.createdAt.toISOString(),
					user:
						event.user === null
							? null
							: {
									...event.user,
									createdAt:
										event.user.createdAt.toISOString(),
								},
				}),
			),
			system: {
				databaseReady: true,
				generatedAt: new Date().toISOString(),
			},
		};

		return dashboardOverviewSchema.parse(overview);
	}
}
