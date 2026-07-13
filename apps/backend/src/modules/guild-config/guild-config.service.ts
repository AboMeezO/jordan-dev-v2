import type { GuildConfig } from "@jordan-devs/shared";
import { Injectable, NotFoundException } from "@nestjs/common";

import type { GuildConfigInput } from "./guild-config.repository.js";
import { GuildConfigRepository } from "./guild-config.repository.js";

@Injectable()
export class GuildConfigService {
	public constructor(
		private readonly configs: GuildConfigRepository,
	) {}

	public async upsert(input: GuildConfigInput): Promise<GuildConfig> {
		const config = await this.configs.upsert(input);
		return this.toDto(config);
	}

	public async findByGuildId(guildId: string): Promise<GuildConfig> {
		const config = await this.configs.findByGuildId(guildId);
		if (!config) {
			throw new NotFoundException(
				`Guild config not found for guild: ${guildId}`,
			);
		}
		return this.toDto(config);
	}

	private toDto(config: {
		guildId: string;
		unverifiedRoleId: string;
		verifiedRoleId: string;
		reviewerRoleId: string;
		verificationChannelId: string;
	}): GuildConfig {
		return {
			guildId: config.guildId,
			unverifiedRoleId: config.unverifiedRoleId,
			verifiedRoleId: config.verifiedRoleId,
			reviewerRoleId: config.reviewerRoleId,
			verificationChannelId: config.verificationChannelId,
		};
	}
}
