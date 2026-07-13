import { Injectable } from "@nestjs/common";
import type { GuildConfig } from "@prisma/client";

import {
	DatabaseService,
	type DatabaseTransactionClient,
} from "../../database/database.service.js";

type DatabaseClient =
	| DatabaseService
	| DatabaseTransactionClient;

export type GuildConfigInput = {
	guildId: string;
	unverifiedRoleId: string;
	verifiedRoleId: string;
	reviewerRoleId: string;
	verificationChannelId: string;
};

@Injectable()
export class GuildConfigRepository {
	public constructor(
		private readonly database: DatabaseService,
	) {}

	public async upsert(
		input: GuildConfigInput,
		client: DatabaseClient = this.database,
	): Promise<GuildConfig> {
		return client.guildConfig.upsert({
			where: { guildId: input.guildId },
			create: input,
			update: input,
		});
	}

	public async findByGuildId(
		guildId: string,
		client: DatabaseClient = this.database,
	): Promise<GuildConfig | null> {
		return client.guildConfig.findUnique({
			where: { guildId },
		});
	}
}
