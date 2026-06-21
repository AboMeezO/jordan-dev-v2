import {
	canAll,
	canAny,
	permissions,
	type Permission,
} from "@jordan-devs/shared";
import { Injectable } from "@nestjs/common";

import type { DatabaseTransactionClient } from "../../database/database.service.js";
import { AuthorizationRepository } from "./authorization.repository.js";

@Injectable()
export class AuthorizationService {
	constructor(
		private readonly authorization: AuthorizationRepository,
	) {}

	getEffectivePermissions(
		userId: string,
		transaction?: DatabaseTransactionClient,
	): Promise<readonly Permission[]> {
		return this.authorization.getUserPermissions(userId, transaction);
	}

	canAll(
		userPermissions: unknown,
		requiredPermissions: readonly Permission[],
	): boolean {
		return canAll(userPermissions, requiredPermissions);
	}

	canAny(
		userPermissions: unknown,
		requiredPermissions: readonly Permission[],
	): boolean {
		return canAny(userPermissions, requiredPermissions);
	}

	syncKnownPermissions(
		transaction?: DatabaseTransactionClient,
	): Promise<void> {
		return this.authorization.syncKnownPermissions(
			Object.values(permissions),
			transaction,
		);
	}
}

