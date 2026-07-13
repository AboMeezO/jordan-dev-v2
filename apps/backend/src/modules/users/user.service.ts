import {
	Injectable,
	NotFoundException,
} from "@nestjs/common";

import type { DatabaseTransactionClient } from "../../database/database.service.js";
import { UserRepository } from "./user.repository.js";
import type {
	ClerkUserIdentity,
	DiscordUserIdentity,
} from "./user.types.js";

@Injectable()
export class UserService {
	constructor(private readonly users: UserRepository) {}

	findById(id: string) {
		return this.users.findById(id);
	}

	findByClerkUserId(clerkUserId: string) {
		return this.users.findByClerkUserId(clerkUserId);
	}

	findByDiscordUserId(discordUserId: string) {
		return this.users.findByDiscordUserId(discordUserId);
	}

	upsertFromDiscordIdentity(identity: DiscordUserIdentity) {
		return this.users.upsertFromDiscordIdentity(identity);
	}

	upsertFromClerkIdentity(
		identity: ClerkUserIdentity,
		transaction?: DatabaseTransactionClient,
	) {
		return this.users.upsertFromClerkIdentity(
			identity,
			transaction,
		);
	}

	async list(query: {
		page: number;
		limit: number;
		search: string | undefined;
		roleId: string | undefined;
	}) {
		return this.users.findMany(query);
	}

	async getDetail(id: string) {
		const user = await this.users.findByIdWithRoles(id);
		if (!user) {
			throw new NotFoundException("User not found");
		}
		return user;
	}

	async update(
		id: string,
		data: {
			displayName: string | undefined;
			email: string | undefined;
		},
	) {
		const user = await this.users.updateUser(id, data);
		if (!user) {
			throw new NotFoundException("User not found");
		}
		return user;
	}

	async assignRoles(
		id: string,
		roleIds: readonly string[],
	) {
		const user = await this.users.findById(id);
		if (!user) {
			throw new NotFoundException("User not found");
		}
		return this.users.setUserRoles(id, roleIds);
	}
}
