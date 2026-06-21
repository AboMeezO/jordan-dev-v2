import { HttpStatus, Injectable } from "@nestjs/common";
import { sessionBootstrapSchema } from "@jordan-devs/shared";
import type { SessionBootstrap } from "@jordan-devs/shared";

import {
	ApiErrorException,
	createApiError,
} from "../../common/errors/api-error.js";
import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import { AuthorizationService } from "../authorization/authorization.service.js";
import { UserService } from "../users/user.service.js";

@Injectable()
export class SessionService {
	constructor(
		private readonly authorization: AuthorizationService,
		private readonly users: UserService,
	) {}

	async getSessionBootstrap(
		authenticatedUser: AuthenticatedUser,
	): Promise<SessionBootstrap> {
		const user = await this.users.findById(authenticatedUser.localUserId);

		if (user === null) {
			throw new ApiErrorException(
				HttpStatus.INTERNAL_SERVER_ERROR,
				createApiError(
					"SESSION_USER_NOT_FOUND",
					"Authenticated user record could not be loaded.",
				),
			);
		}

		const permissions =
			await this.authorization.getEffectivePermissions(user.id);

		return sessionBootstrapSchema.parse({
			user: {
				id: user.id,
				clerkUserId: user.clerkUserId,
				email: user.email,
				displayName: user.displayName,
				avatarUrl: user.avatarUrl,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt.toISOString(),
			},
			permissions: [...permissions],
		});
	}
}
