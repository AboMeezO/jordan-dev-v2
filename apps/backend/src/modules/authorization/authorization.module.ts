import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module.js";
import { AuthorizationRepository } from "./authorization.repository.js";
import { AuthorizationService } from "./authorization.service.js";
import { PermissionGuard } from "./permission.guard.js";

@Module({
	imports: [DatabaseModule],
	providers: [
		AuthorizationRepository,
		AuthorizationService,
		PermissionGuard,
	],
	exports: [
		AuthorizationRepository,
		AuthorizationService,
		PermissionGuard,
	],
})
export class AuthorizationModule {}

