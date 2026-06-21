import { z } from "zod";

const permissionValues = [
	"dashboard:read",
	"guild:read",
	"guild:update",
	"user:read",
	"user:update",
	"settings:read",
	"settings:update",
	"moderation:read",
	"moderation:manage",
] as const;

export const permissionSchema = z.enum(permissionValues);

export const permissions = {
	dashboardRead: "dashboard:read",
	guildRead: "guild:read",
	guildUpdate: "guild:update",
	userRead: "user:read",
	userUpdate: "user:update",
	settingsRead: "settings:read",
	settingsUpdate: "settings:update",
	moderationRead: "moderation:read",
	moderationManage: "moderation:manage",
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

export type PermissionClaims = {
	metadata?: {
		permissions?: unknown;
	};
	publicMetadata?: {
		permissions?: unknown;
	};
	permissions?: unknown;
};

const permissionSet = new Set(Object.values(permissions));

export function isPermission(value: unknown): value is Permission {
	return typeof value === "string" && permissionSet.has(value as Permission);
}

export function normalizePermissions(value: unknown): readonly Permission[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const normalized = new Set<Permission>();

	for (const item of value) {
		if (isPermission(item)) {
			normalized.add(item);
		}
	}

	return [...normalized];
}

export function parsePermissionClaims(claims: unknown): readonly Permission[] {
	if (!claims || typeof claims !== "object") {
		return [];
	}

	const permissionClaims = claims as PermissionClaims;

	return normalizePermissions([
		...normalizePermissions(permissionClaims.permissions),
		...normalizePermissions(permissionClaims.metadata?.permissions),
		...normalizePermissions(permissionClaims.publicMetadata?.permissions),
	]);
}

export function can(
	userPermissions: unknown,
	permission: Permission | undefined | null,
): boolean {
	if (!permission) {
		return true;
	}

	return new Set(normalizePermissions(userPermissions)).has(permission);
}

export function canAll(
	userPermissions: unknown,
	requiredPermissions: readonly Permission[] | undefined | null,
): boolean {
	if (!requiredPermissions || requiredPermissions.length === 0) {
		return true;
	}

	const grantedPermissions = new Set(normalizePermissions(userPermissions));

	return requiredPermissions.every((permission) =>
		grantedPermissions.has(permission),
	);
}

export function canAny(
	userPermissions: unknown,
	requiredPermissions: readonly Permission[] | undefined | null,
): boolean {
	if (!requiredPermissions || requiredPermissions.length === 0) {
		return true;
	}

	const grantedPermissions = new Set(normalizePermissions(userPermissions));

	return requiredPermissions.some((permission) =>
		grantedPermissions.has(permission),
	);
}
