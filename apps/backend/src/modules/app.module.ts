import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { HealthController } from "./health.controller.js";
import { VerificationModule } from "./verification/verification.module.js";

@Module({
	controllers: [HealthController],
	imports: [
		ConfigModule.forRoot({
			envFilePath: ["../../.env", ".env"],
			isGlobal: true,
		}),
		VerificationModule,
	],
})
export class AppModule {}
