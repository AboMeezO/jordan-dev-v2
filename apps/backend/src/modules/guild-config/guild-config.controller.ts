import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import { ZodValidationPipe } from "../../common/validation/zod-validation.pipe.js";
import { BotAuthGuard } from "../auth/bot-auth.guard.js";
import { GuildConfigService } from "./guild-config.service.js";

@Controller("guild-configs")
export class GuildConfigController {
	public constructor(
		private readonly configs: GuildConfigService,
	) {}

	@Post()
	@UseGuards(BotAuthGuard)
	public async upsert(
		@Body()
		request: {
			guildId: string;
			unverifiedRoleId: string;
			verifiedRoleId: string;
			reviewerRoleId: string;
			verificationChannelId: string;
		},
	) {
		return this.configs.upsert(request);
	}

	@Get(":guildId")
	@UseGuards(BotAuthGuard)
	public async findByGuildId(
		@Param("guildId") guildId: string,
	) {
		return this.configs.findByGuildId(guildId);
	}
}
