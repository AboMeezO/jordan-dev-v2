import { forwardRef, Global, Module } from "@nestjs/common";

import { BackendConfigModule } from "../../config/config.module.js";
import { UserModule } from "../users/user.module.js";
import { AuthService } from "./auth.service.js";
import { BotAuthGuard } from "./bot-auth.guard.js";
import { ClerkAuthGuard } from "./clerk-auth.guard.js";

@Global()
@Module({
	imports: [BackendConfigModule, forwardRef(() => UserModule)],
	providers: [AuthService, ClerkAuthGuard, BotAuthGuard],
	exports: [AuthService, ClerkAuthGuard, BotAuthGuard],
})
export class AuthModule {}

