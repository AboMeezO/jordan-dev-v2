import {
	Injectable,
	Logger,
	OnApplicationBootstrap,
} from "@nestjs/common";

import { BackendConfigService } from "../../config/app.config.js";
import { AuthorizationService } from "./authorization.service.js";

@Injectable()
export class AuthorizationBootstrapService implements OnApplicationBootstrap {
	private readonly logger = new Logger(
		AuthorizationBootstrapService.name,
	);

	constructor(
		private readonly authorization: AuthorizationService,
		private readonly config: BackendConfigService,
	) {}

	async onApplicationBootstrap(): Promise<void> {
		const adminClerkUserId =
			this.config.initialAdminClerkUserId;
		const adminClerkUserIds =
			adminClerkUserId !== undefined
				? [adminClerkUserId]
				: [];

		if (adminClerkUserIds.length === 0) {
			this.logger.log(
				"INITIAL_ADMIN_CLERK_USER_ID not configured; syncing permissions without admin role assignment.",
			);
		} else {
			this.logger.log(
				`INITIAL_ADMIN_CLERK_USER_ID configured: ${adminClerkUserId}`,
			);
		}

		const result =
			await this.authorization.bootstrapPermissions(
				adminClerkUserIds,
			);

		this.logger.log(
			`Authorization bootstrap completed. ${result.knownPermissionsSynced} permission(s) synced, admin role: "${result.adminRoleName}", users assigned: ${result.adminRoleAssignedUsers}.`,
		);
	}
}
