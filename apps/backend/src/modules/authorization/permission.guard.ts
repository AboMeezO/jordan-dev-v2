import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import {
	PERMISSIONS_METADATA_KEY,
	type PermissionRequirement,
} from "../../common/types/permission-requirement.js";
import type { AuthenticatedRequest } from "../../common/types/authenticated-request.js";
import { AuthorizationService } from "./authorization.service.js";

@Injectable()
export class PermissionGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly authorization: AuthorizationService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const requirement =
			this.reflector.getAllAndOverride<PermissionRequirement>(
				PERMISSIONS_METADATA_KEY,
				[context.getHandler(), context.getClass()],
			);

		if (
			requirement === undefined ||
			requirement.permissions.length === 0
		) {
			return true;
		}

		const request = context
			.switchToHttp()
			.getRequest<AuthenticatedRequest>();

		if (request.user === undefined) {
			throw new UnauthorizedException("Authentication is required.");
		}

		const effectivePermissions =
			await this.authorization.getEffectivePermissions(
				request.user.localUserId,
			);
		request.user.permissions = effectivePermissions;

		const allowed =
			requirement.mode === "any"
				? this.authorization.canAny(
						effectivePermissions,
						requirement.permissions,
					)
				: this.authorization.canAll(
						effectivePermissions,
						requirement.permissions,
					);

		if (!allowed) {
			throw new ForbiddenException("Missing required permission.");
		}

		return true;
	}
}
