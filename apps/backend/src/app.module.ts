import { Module } from "@nestjs/common";

import { BackendConfigModule } from "./config/config.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { VerificationModule } from "./modules/verification/verification.module.js";

@Module({
	imports: [
		BackendConfigModule,
		HealthModule,
		VerificationModule,
	],
})
export class AppModule {}
