import type {
	CompleteVerificationRequest,
	VerificationResult,
} from "@jordan-devs/shared";
import { Injectable } from "@nestjs/common";
import { VerificationStatus } from "@prisma/client";

import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import { DatabaseService } from "../../database/database.service.js";
import { VerificationRepository } from "./verification.repository.js";

@Injectable()
export class VerificationService {
	public constructor(
		private readonly database: DatabaseService,
		private readonly verifications: VerificationRepository,
	) {}

	public async completeVerification(
		user: AuthenticatedUser,
		request: CompleteVerificationRequest,
	): Promise<VerificationResult> {
		const verification = await this.database.transaction(
			(transaction) =>
				this.verifications.completeVerification(
					{
						discordUserId: request.discordUserId,
						guildId: request.guildId,
						userId: user.localUserId,
					},
					transaction,
				),
		);

		return {
			profile: {
				clerkUserId: user.clerkUserId,
				discordUserId: request.discordUserId,
				email: user.email,
				guildId: request.guildId,
			},
			status: verification.status,
			roleGranted: false,
			roleGrantPending:
				verification.status ===
				VerificationStatus.ROLE_GRANT_PENDING,
			roleGrantJobId: verification.roleGrantJobId,
		};
	}
}
