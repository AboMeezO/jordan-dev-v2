import { Module } from "@nestjs/common";

import { BackendConfigModule } from "../../config/config.module.js";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { AuthorizationModule } from "../authorization/authorization.module.js";
import { UserModule } from "../users/user.module.js";
import { MembershipApplicationController } from "./membership-application.controller.js";
import { MembershipApplicationRepository } from "./membership-application.repository.js";
import { MembershipApplicationService } from "./membership-application.service.js";

@Module({
	controllers: [MembershipApplicationController],
	imports: [
		AuthModule,
		AuthorizationModule,
		BackendConfigModule,
		DatabaseModule,
		UserModule,
	],
	providers: [
		MembershipApplicationRepository,
		MembershipApplicationService,
	],
	exports: [
		MembershipApplicationService,
		MembershipApplicationRepository,
	],
})
export class MembershipApplicationModule {}
