import { Injectable } from "@nestjs/common";
import {
	RoleGrantJobStatus,
	VerificationEventType,
	VerificationStatus,
} from "@prisma/client";

import {
	DatabaseService,
	type DatabaseTransactionClient,
} from "../../database/database.service.js";

type DatabaseClient =
	| DatabaseService
	| DatabaseTransactionClient;

export type CompleteVerificationInput = {
	readonly discordUserId: string;
	readonly guildId: string;
	readonly userId: string;
};

export type CompletedVerificationRecord = {
	readonly roleGrantJobId: string;
	readonly status: VerificationStatus;
};

@Injectable()
export class VerificationRepository {
	public constructor(private readonly database: DatabaseService) {}

	public async completeVerification(
		input: CompleteVerificationInput,
		client: DatabaseClient = this.database,
	): Promise<CompletedVerificationRecord> {
		const verification = await client.verification.upsert({
			where: {
				userId_guildId: {
					userId: input.userId,
					guildId: input.guildId,
				},
			},
			create: {
				userId: input.userId,
				discordUserId: input.discordUserId,
				guildId: input.guildId,
				status: VerificationStatus.ROLE_GRANT_PENDING,
				verifiedAt: new Date(),
			},
			update: {
				discordUserId: input.discordUserId,
				status: VerificationStatus.ROLE_GRANT_PENDING,
				verifiedAt: new Date(),
				failureReason: null,
			},
			select: {
				id: true,
				status: true,
			},
		});

		await client.verificationEvent.create({
			data: {
				verificationId: verification.id,
				userId: input.userId,
				type: VerificationEventType.COMPLETED,
				status: verification.status,
				message: "Dashboard verification completed.",
			},
		});

		const roleGrantJob =
			await client.verificationRoleGrantJob.upsert({
				where: {
					verificationId_status: {
						verificationId: verification.id,
						status: RoleGrantJobStatus.PENDING,
					},
				},
				create: {
					verificationId: verification.id,
					userId: input.userId,
					discordUserId: input.discordUserId,
					guildId: input.guildId,
				},
				update: {
					discordUserId: input.discordUserId,
					guildId: input.guildId,
					lastError: null,
				},
				select: {
					id: true,
				},
			});

		await client.verificationEvent.create({
			data: {
				verificationId: verification.id,
				userId: input.userId,
				type: VerificationEventType.ROLE_GRANT_PENDING,
				status: verification.status,
				message:
					"Discord role grant is pending bot-side processing.",
			},
		});

		return {
			roleGrantJobId: roleGrantJob.id,
			status: verification.status,
		};
	}
}
