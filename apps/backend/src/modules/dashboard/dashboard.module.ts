import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { AuthorizationModule } from "../authorization/authorization.module.js";
import { DashboardController } from "./dashboard.controller.js";
import { DashboardRepository } from "./dashboard.repository.js";
import { DashboardService } from "./dashboard.service.js";

@Module({
	controllers: [DashboardController],
	imports: [AuthModule, AuthorizationModule, DatabaseModule],
	providers: [DashboardRepository, DashboardService],
})
export class DashboardModule {}
