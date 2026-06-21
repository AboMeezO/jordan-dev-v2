import { Module } from "@nestjs/common";

import { BackendConfigModule } from "./config/config.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { VerificationModule } from "./modules/verification/verification.module.js";

@Module({
	imports: [
		BackendConfigModule,
		DatabaseModule,
		HealthModule,
		VerificationModule,
	],
})
export class AppModule {}
