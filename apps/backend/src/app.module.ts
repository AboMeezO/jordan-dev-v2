import { Module } from "@nestjs/common";

import { BackendConfigModule } from "./config/config.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { AuthorizationModule } from "./modules/authorization/authorization.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { UserModule } from "./modules/users/user.module.js";
import { SessionModule } from "./modules/session/session.module.js";
import { VerificationModule } from "./modules/verification/verification.module.js";

@Module({
	imports: [
		BackendConfigModule,
		AuthModule,
		AuthorizationModule,
		DatabaseModule,
		HealthModule,
		SessionModule,
		UserModule,
		VerificationModule,
	],
})
export class AppModule {}
