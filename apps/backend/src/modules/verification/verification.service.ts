import type {
	CompleteVerificationRequest,
	VerificationResult,
} from "@jordan-devs/shared";
import { Injectable } from "@nestjs/common";

import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";

@Injectable()
export class VerificationService {
	public async completeVerification(
		user: AuthenticatedUser,
		request: CompleteVerificationRequest,
	): Promise<VerificationResult> {
		return {
			profile: {
				clerkUserId: user.clerkUserId,
				discordUserId: request.discordUserId,
				email: user.email,
				guildId: request.guildId,
			},
			roleGranted: false,
		};
	}
}
