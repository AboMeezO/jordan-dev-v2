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

	console.log(
		[
			`known_permissions_synced=${result.knownPermissionsSynced}`,
			`admin_role=${result.adminRoleName}`,
			`admin_users_assigned=${result.adminRoleAssignedUsers}`,
		].join("\n"),
	);
} finally {
	await app.close();
}
