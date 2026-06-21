import { dashboardOverviewSchema } from "@jordan-devs/shared";
import {
	VerificationEventType,
	VerificationStatus,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import type { DatabaseService } from "../../database/database.service.js";
import type { DashboardRepository } from "./dashboard.repository.js";
import { DashboardService } from "./dashboard.service.js";

describe("DashboardService", () => {
	it("returns real persisted overview metrics", async () => {
		const service = new DashboardService(
			mockDatabase(),
			mockDashboardRepository(),
		);

		const result = await service.getOverview();

		expect(result.stats).toEqual({
			totalUsers: 3,
			totalRoles: 2,
			totalPermissions: 9,
			verifiedUsers: 1,
			unverifiedUsers: 2,
			pendingRoleGrants: 1,
		});
		expect(result.verificationStatusCounts).toEqual([
			{ label: "ROLE_GRANT_PENDING", value: 1 },
		]);
		expect(result.usersByRole).toEqual([
			{ role: "admin", users: 1 },
		]);
		expect(result.recentUsers[0]?.createdAt).toBe(
			"2026-01-01T00:00:00.000Z",
		);
		expect(result.recentVerificationEvents[0]?.createdAt).toBe(
			"2026-01-02T00:00:00.000Z",
		);
		expect(result.system.databaseReady).toBe(true);
		expect(() =>
			dashboardOverviewSchema.parse(result),
		).not.toThrow();
	});
});

function mockDatabase(): DatabaseService {
	const database: Pick<DatabaseService, "checkConnection"> = {
		checkConnection: vi.fn(() => Promise.resolve()),
	};

	return database as DatabaseService;
}

function mockDashboardRepository(): DashboardRepository {
	type DashboardRepositoryMock = {
		readonly countPendingRoleGrants: () => Promise<number>;
		readonly countPermissions: () => Promise<number>;
		readonly countRoles: () => Promise<number>;
		readonly countUsers: () => Promise<number>;
		readonly countVerifiedUsers: () => Promise<number>;
		readonly getRecentUsers: () => Promise<
			Array<{
				readonly avatarUrl: string | null;
				readonly clerkUserId: string;
				readonly createdAt: Date;
				readonly displayName: string | null;
				readonly email: string | null;
				readonly id: string;
			}>
		>;
		readonly getRecentVerificationEvents: () => Promise<
			Array<{
				readonly createdAt: Date;
				readonly id: string;
				readonly message: string | null;
				readonly status: VerificationStatus;
				readonly type: VerificationEventType;
				readonly user: {
					readonly avatarUrl: string | null;
					readonly clerkUserId: string;
					readonly createdAt: Date;
					readonly displayName: string | null;
					readonly email: string | null;
					readonly id: string;
				} | null;
			}>
		>;
		readonly getUsersByRole: () => Promise<
			Array<{
				readonly role: string;
				readonly users: number;
			}>
		>;
		readonly getVerificationStatusCounts: () => Promise<
			Array<{
				readonly _count: {
					readonly _all: number;
				};
				readonly status: VerificationStatus;
			}>
		>;
	};

	const dashboard: DashboardRepositoryMock = {
		countPendingRoleGrants: vi.fn(() => Promise.resolve(1)),
		countPermissions: vi.fn(() => Promise.resolve(9)),
		countRoles: vi.fn(() => Promise.resolve(2)),
		countUsers: vi.fn(() => Promise.resolve(3)),
		countVerifiedUsers: vi.fn(() => Promise.resolve(1)),
		getRecentUsers: vi.fn(() =>
			Promise.resolve([
				{
					id: "user_1",
					clerkUserId: "clerk_1",
					email: "user@example.com",
					displayName: "User",
					avatarUrl: "https://example.com/avatar.png",
					createdAt: new Date("2026-01-01T00:00:00.000Z"),
				},
			]),
		),
		getRecentVerificationEvents: vi.fn(() =>
			Promise.resolve([
				{
					id: "event_1",
					type: VerificationEventType.ROLE_GRANT_PENDING,
					status: VerificationStatus.ROLE_GRANT_PENDING,
					message:
						"Discord role grant is pending bot-side processing.",
					createdAt: new Date("2026-01-02T00:00:00.000Z"),
					user: {
						id: "user_1",
						clerkUserId: "clerk_1",
						email: "user@example.com",
						displayName: "User",
						avatarUrl: "https://example.com/avatar.png",
						createdAt: new Date(
							"2026-01-01T00:00:00.000Z",
						),
					},
				},
			]),
		),
		getUsersByRole: vi.fn(() =>
			Promise.resolve([{ role: "admin", users: 1 }]),
		),
		getVerificationStatusCounts: vi.fn(() =>
			Promise.resolve([
				{
					status: VerificationStatus.ROLE_GRANT_PENDING,
					_count: {
						_all: 1,
					},
				},
			]),
		),
	};

	return dashboard as unknown as DashboardRepository;
}
