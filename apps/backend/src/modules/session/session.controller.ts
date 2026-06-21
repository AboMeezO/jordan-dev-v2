import { Controller, Get, UseGuards } from "@nestjs/common";

import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { ClerkAuthGuard } from "../auth/clerk-auth.guard.js";
import type { SessionBootstrap } from "@jordan-devs/shared";
import { SessionService } from "./session.service.js";

@Controller()
export class SessionController {
	constructor(private readonly session: SessionService) {}

	@Get("me")
	@UseGuards(ClerkAuthGuard)
	getMe(@CurrentUser() user: AuthenticatedUser): Promise<SessionBootstrap> {
		return this.session.getSessionBootstrap(user);
	}
}
