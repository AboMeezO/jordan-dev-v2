import { type DashboardOverview,permissions } from "@jordan-devs/shared";
import { Controller, Get } from "@nestjs/common";

import { RequirePermissions } from "../../common/decorators/require-permissions.decorator.js";
import { DashboardService } from "./dashboard.service.js";

@Controller("admin/dashboard")
export class DashboardController {
	public constructor(private readonly dashboard: DashboardService) {}

	@Get("overview")
	@RequirePermissions(permissions.dashboardRead)
	public getOverview(): Promise<DashboardOverview> {
		return this.dashboard.getOverview();
	}
}
