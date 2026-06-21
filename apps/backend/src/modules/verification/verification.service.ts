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
			// Discord role granting is not implemented yet; keep the
			// response explicit instead of pretending the side effect ran.
			roleGranted: false,
		};
	}
}
