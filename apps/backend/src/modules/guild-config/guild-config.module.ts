import { Module } from "@nestjs/common";

import { BackendConfigModule } from "../../config/config.module.js";
import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { AuthorizationModule } from "../authorization/authorization.module.js";
import { GuildConfigController } from "./guild-config.controller.js";
import { GuildConfigRepository } from "./guild-config.repository.js";
import { GuildConfigService } from "./guild-config.service.js";

@Module({
	controllers: [GuildConfigController],
	imports: [
		AuthModule,
		AuthorizationModule,
		BackendConfigModule,
		DatabaseModule,
	],
	providers: [GuildConfigRepository, GuildConfigService],
	exports: [GuildConfigService, GuildConfigRepository],
})
export class GuildConfigModule {}
