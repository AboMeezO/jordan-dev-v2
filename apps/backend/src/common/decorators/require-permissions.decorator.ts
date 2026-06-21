import type { Permission } from "@jordan-devs/shared";
import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_METADATA_KEY = "jordan-devs:permissions";

export type PermissionRequirement =
	| {
			mode: "all";
			permissions: readonly Permission[];
	  }
	| {
			mode: "any";
			permissions: readonly Permission[];
	  };

export function RequirePermissions(
	...requiredPermissions: readonly Permission[]
) {
	return SetMetadata(PERMISSIONS_METADATA_KEY, {
		mode: "all",
		permissions: requiredPermissions,
	} satisfies PermissionRequirement);
}

export function RequireAnyPermission(
	...requiredPermissions: readonly Permission[]
) {
	return SetMetadata(PERMISSIONS_METADATA_KEY, {
		mode: "any",
		permissions: requiredPermissions,
	} satisfies PermissionRequirement);
}

