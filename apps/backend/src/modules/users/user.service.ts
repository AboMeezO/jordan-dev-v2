import { Injectable } from "@nestjs/common";
import type { User } from "@prisma/client";

import type { DatabaseTransactionClient } from "../../database/database.service.js";
import { UserRepository } from "./user.repository.js";
import type { ClerkUserIdentity } from "./user.types.js";

@Injectable()
export class UserService {
	constructor(private readonly users: UserRepository) {}

	findById(id: string): Promise<User | null> {
		return this.users.findById(id);
	}

	findByClerkUserId(clerkUserId: string): Promise<User | null> {
		return this.users.findByClerkUserId(clerkUserId);
	}

	upsertFromClerkIdentity(
		identity: ClerkUserIdentity,
		transaction?: DatabaseTransactionClient,
	): Promise<User> {
		return this.users.upsertFromClerkIdentity(identity, transaction);
	}
}

