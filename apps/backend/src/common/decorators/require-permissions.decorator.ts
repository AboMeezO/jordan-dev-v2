import type { Permission } from "@jordan-devs/shared";
import {
	applyDecorators,
	SetMetadata,
	UseGuards,
} from "@nestjs/common";

import { ClerkAuthGuard } from "../../modules/auth/clerk-auth.guard.js";
import { PermissionGuard } from "../../modules/authorization/permission.guard.js";
import type { PermissionRequirement } from "../types/permission-requirement.js";
import { PERMISSIONS_METADATA_KEY } from "../types/permission-requirement.js";

export function RequirePermissions(
	...requiredPermissions: readonly Permission[]
) {
	return applyDecorators(
		SetMetadata(PERMISSIONS_METADATA_KEY, {
			mode: "all",
			permissions: requiredPermissions,
		} satisfies PermissionRequirement),
		UseGuards(ClerkAuthGuard, PermissionGuard),
	);
}

export function RequireAnyPermission(
	...requiredPermissions: readonly Permission[]
) {
	return applyDecorators(
		SetMetadata(PERMISSIONS_METADATA_KEY, {
			mode: "any",
			permissions: requiredPermissions,
		} satisfies PermissionRequirement),
		UseGuards(ClerkAuthGuard, PermissionGuard),
	);
}
