import { Module } from "@nestjs/common";

import { BackendConfigModule } from "./config/config.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { AuthorizationModule } from "./modules/authorization/authorization.module.js";
import { DashboardModule } from "./modules/dashboard/dashboard.module.js";
import { HealthModule } from "./modules/health/health.module.js";
import { MembershipApplicationModule } from "./modules/membership-application/membership-application.module.js";
import { RolesModule } from "./modules/roles/roles.module.js";
import { SessionModule } from "./modules/session/session.module.js";
import { UserModule } from "./modules/users/user.module.js";
import { VerificationModule } from "./modules/verification/verification.module.js";

@Module({
	imports: [
		BackendConfigModule,
		AuthModule,
		AuthorizationModule,
		DatabaseModule,
		DashboardModule,
		HealthModule,
		MembershipApplicationModule,
		RolesModule,
		SessionModule,
		UserModule,
		VerificationModule,
	],
})
export class AppModule {}
