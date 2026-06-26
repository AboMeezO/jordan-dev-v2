import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { GuildConfigController } from "./guild-config.controller.js";
import { GuildConfigRepository } from "./guild-config.repository.js";
import { GuildConfigService } from "./guild-config.service.js";

@Module({
	controllers: [GuildConfigController],
	imports: [AuthModule, DatabaseModule],
	providers: [GuildConfigRepository, GuildConfigService],
	exports: [GuildConfigService, GuildConfigRepository],
})
export class GuildConfigModule {}
