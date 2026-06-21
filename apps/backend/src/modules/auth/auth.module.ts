import { Module } from "@nestjs/common";

import { BackendConfigModule } from "../../config/config.module.js";
import { UserModule } from "../users/user.module.js";
import { AuthService } from "./auth.service.js";
import { ClerkAuthGuard } from "./clerk-auth.guard.js";

@Module({
	imports: [BackendConfigModule, UserModule],
	providers: [AuthService, ClerkAuthGuard],
	exports: [AuthService, ClerkAuthGuard],
})
export class AuthModule {}

