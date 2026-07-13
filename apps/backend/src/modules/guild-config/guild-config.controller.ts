import type { GuildConfig } from "@jordan-devs/shared";
import { permissions } from "@jordan-devs/shared";
import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

import { RequirePermissions } from "../../common/decorators/require-permissions.decorator.js";
import { ZodValidationPipe } from "../../common/validation/zod-validation.pipe.js";
import { BotAuthGuard } from "../auth/bot-auth.guard.js";
import { guildConfigUpsertSchema } from "./guild-config.schema.js";
import { GuildConfigService } from "./guild-config.service.js";

@Controller("guild-configs")
export class GuildConfigController {
	public constructor(
		private readonly configs: GuildConfigService,
	) {}

	@Post()
	@UseGuards(BotAuthGuard)
	public async upsert(
		@Body(new ZodValidationPipe(guildConfigUpsertSchema))
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

	// --- Dashboard endpoints ---

	@Get("dashboard/:guildId")
	@RequirePermissions(permissions.guildRead)
	public async findByGuildIdDashboard(
		@Param("guildId") guildId: string,
	): Promise<GuildConfig> {
		return this.configs.findByGuildId(guildId);
	}

	@Post("dashboard/upsert")
	@RequirePermissions(permissions.guildUpdate)
	public async upsertDashboard(
		@Body(new ZodValidationPipe(guildConfigUpsertSchema))
		request: {
			guildId: string;
			unverifiedRoleId: string;
			verifiedRoleId: string;
			reviewerRoleId: string;
			verificationChannelId: string;
		},
	): Promise<GuildConfig> {
		return this.configs.upsert(request);
	}
}
