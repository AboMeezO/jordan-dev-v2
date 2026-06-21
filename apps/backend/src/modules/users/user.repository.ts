import { Injectable } from "@nestjs/common";
import type { Prisma, User } from "@prisma/client";

import {
	DatabaseService,
	type DatabaseTransactionClient,
} from "../../database/database.service.js";
import type { ClerkUserIdentity } from "./user.types.js";

type DatabaseClient = DatabaseService | DatabaseTransactionClient;

@Injectable()
export class UserRepository {
	constructor(private readonly database: DatabaseService) {}

	findById(id: string, client: DatabaseClient = this.database): Promise<User | null> {
		return client.user.findUnique({ where: { id } });
	}

	findByClerkUserId(
		clerkUserId: string,
		client: DatabaseClient = this.database,
	): Promise<User | null> {
		return client.user.findUnique({ where: { clerkUserId } });
	}

	upsertFromClerkIdentity(
		identity: ClerkUserIdentity,
		client: DatabaseClient = this.database,
	): Promise<User> {
		const data = this.toUserData(identity);

		return client.user.upsert({
			where: { clerkUserId: identity.clerkUserId },
			create: data,
			update: data,
		});
	}

	private toUserData(identity: ClerkUserIdentity): Prisma.UserUncheckedCreateInput {
		return {
			clerkUserId: identity.clerkUserId,
			email: identity.email ?? null,
			displayName: identity.displayName ?? null,
			avatarUrl: identity.avatarUrl ?? null,
		};
	}
}

