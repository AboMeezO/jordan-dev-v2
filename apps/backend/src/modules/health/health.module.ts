import { Module } from "@nestjs/common";

import { BackendConfigModule } from "../../config/config.module.js";
import { DatabaseModule } from "../../database/database.module.js";
import { HealthController } from "./health.controller.js";

@Module({
	imports: [BackendConfigModule, DatabaseModule],
	controllers: [HealthController],
})
export class HealthModule {}
