import { Module } from "@nestjs/common";

import { BackendConfigModule } from "../../config/config.module.js";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthorizationRepository } from "./authorization.repository.js";
import { AuthorizationService } from "./authorization.service.js";
import { AuthorizationBootstrapService } from "./authorization-bootstrap.service.js";
import { PermissionGuard } from "./permission.guard.js";

@Module({
	imports: [BackendConfigModule, DatabaseModule],
	providers: [
		AuthorizationBootstrapService,
		AuthorizationRepository,
		AuthorizationService,
		PermissionGuard,
	],
	exports: [
		AuthorizationBootstrapService,
		AuthorizationRepository,
		AuthorizationService,
		PermissionGuard,
	],
})
export class AuthorizationModule {}

