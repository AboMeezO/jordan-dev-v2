import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { HealthModule } from "./modules/health/health.module.js";
import { VerificationModule } from "./modules/verification/verification.module.js";

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: ["../../.env", ".env"],
			isGlobal: true,
		}),
		HealthModule,
		VerificationModule,
	],
})
export class AppModule {}
