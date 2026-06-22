import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { AuthorizationModule } from "../authorization/authorization.module.js";
import { DatabaseModule } from "../../database/database.module.js";
import { RolesController } from "./roles.controller.js";
import { RolesRepository } from "./roles.repository.js";
import { RolesService } from "./roles.service.js";

@Module({
	controllers: [RolesController],
	imports: [AuthModule, AuthorizationModule, DatabaseModule],
	providers: [RolesRepository, RolesService],
})
export class RolesModule {}
