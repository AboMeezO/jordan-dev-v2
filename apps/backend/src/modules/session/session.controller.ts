import type { SessionBootstrap } from "@jordan-devs/shared";
import { Controller, Get, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import { ClerkAuthGuard } from "../auth/clerk-auth.guard.js";
import { SessionService } from "./session.service.js";

@Controller()
export class SessionController {
	constructor(private readonly session: SessionService) {}

	@Get("me")
	@UseGuards(ClerkAuthGuard)
	getMe(
		@CurrentUser() user: AuthenticatedUser,
	): Promise<SessionBootstrap> {
		return this.session.getSessionBootstrap(user);
	}
}
