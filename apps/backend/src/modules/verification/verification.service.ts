import { verifyToken } from "@clerk/backend";
import type {
	CompleteVerificationRequest,
	VerificationResult,
} from "@jordan-devs/shared";
import {
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";

import { BackendConfigService } from "../../config/app.config.js";

@Injectable()
export class VerificationService {
	public constructor(
		private readonly config: BackendConfigService,
	) {}

	public async completeVerification(
		token: string,
		request: CompleteVerificationRequest,
	): Promise<VerificationResult> {
		const clerkUserId = await this.verifyClerkToken(token);

		return {
			profile: {
				clerkUserId,
				discordUserId: request.discordUserId,
				email: null,
				guildId: request.guildId,
			},
			roleGranted: false,
		};
	}

	private async verifyClerkToken(
		token: string,
	): Promise<string> {
		try {
			const verifiedToken = await verifyToken(token, {
				authorizedParties:
					this.config.clerkAuthorizedParties,
				jwtKey: this.config.clerkJwtKey,
				secretKey: this.config.clerkSecretKey,
			});

			return verifiedToken.sub;
		} catch {
			throw new UnauthorizedException(
				"Clerk token could not be verified.",
			);
		}
	}
}
