import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { AuthorizationModule } from "../authorization/authorization.module.js";
import { UserModule } from "../users/user.module.js";
import { SessionController } from "./session.controller.js";
import { SessionService } from "./session.service.js";

@Module({
	imports: [AuthModule, AuthorizationModule, UserModule],
	controllers: [SessionController],
	providers: [SessionService],
})
export class SessionModule {}
