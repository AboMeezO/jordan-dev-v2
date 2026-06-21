import {
	completeVerificationRequestSchema,
	type VerificationResult,
} from "@jordan-devs/shared";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import { ClerkAuthGuard } from "../auth/clerk-auth.guard.js";
import { VerificationService } from "./verification.service.js";

@Controller("verification")
export class VerificationController {
	public constructor(
		private readonly verificationService: VerificationService,
	) {}

	@Post("complete")
	@UseGuards(ClerkAuthGuard)
	public async complete(
		@CurrentUser() user: AuthenticatedUser,
		@Body() body: unknown,
	): Promise<VerificationResult> {
		const request =
			completeVerificationRequestSchema.parse(body);
		return this.verificationService.completeVerification(
			user,
			request,
		);
	}
}
