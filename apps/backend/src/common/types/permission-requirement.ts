import type { Permission } from "@jordan-devs/shared";

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

