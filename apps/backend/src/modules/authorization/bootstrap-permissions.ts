import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "../../app.module.js";
import { BackendConfigService } from "../../config/app.config.js";
import { AuthorizationService } from "./authorization.service.js";

const app = await NestFactory.createApplicationContext(
	AppModule,
	{
		logger: ["error", "warn", "log"],
	},
);

try {
	const config = app.get(BackendConfigService);
	const authorization = app.get(AuthorizationService);
	const adminClerkUserIds = config.initialAdminClerkUserId
		? [config.initialAdminClerkUserId]
		: [];
	const result = await authorization.bootstrapPermissions(
		adminClerkUserIds,
	);

	const adminIdPresent = config.initialAdminClerkUserId !== undefined;

	console.log("Permission bootstrap complete.");
	console.log(`  known_permissions_synced=${result.knownPermissionsSynced}`);
	console.log(`  admin_role=${result.adminRoleName}`);
	console.log(`  INITIAL_ADMIN_CLERK_USER_ID present=${adminIdPresent}`);

	if (adminIdPresent) {
		console.log(`  target_clerk_user_id=${config.initialAdminClerkUserId}`);
		console.log(`  admin_users_assigned=${result.adminRoleAssignedUsers}`);
	}

	if (result.adminRoleAssignedUsers === 0 && adminIdPresent) {
		console.log("  WARNING: No admin users were assigned. Check logs above for details.");
	}
} finally {
	await app.close();
}
