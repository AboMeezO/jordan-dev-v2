import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { AuthorizationModule } from "../authorization/authorization.module.js";
import { UserRepository } from "./user.repository.js";
import { UserService } from "./user.service.js";
import { UsersController } from "./users.controller.js";

@Module({
	controllers: [UsersController],
	imports: [AuthModule, AuthorizationModule, DatabaseModule],
	providers: [UserRepository, UserService],
	exports: [UserService, UserRepository],
})
export class UserModule {}

