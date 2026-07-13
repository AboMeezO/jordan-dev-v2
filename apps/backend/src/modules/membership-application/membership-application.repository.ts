import { Injectable } from "@nestjs/common";
import type {
	$Enums,
	ApplicationStatus,
	MembershipApplication,
} from "@prisma/client";

import {
	DatabaseService,
	type DatabaseTransactionClient,
} from "../../database/database.service.js";

type DatabaseClient =
	| DatabaseService
	| DatabaseTransactionClient;

export type ApplicationCreateInput = {
	userId: string;
	guildId: string;
	displayName: string;
	githubHandle: string;
	strongestProject: string;
	projectExplanation: string;
	techStack: string;
	experienceLevel: string;
	purposeOfJoining: string;
	selfIntroduction: string;
	linkedInUrl: string | null | undefined;
	portfolioUrl: string | null | undefined;
	referralSource: string;
	referralOtherText: string | null | undefined;
};

@Injectable()
export class MembershipApplicationRepository {
	public constructor(
		private readonly database: DatabaseService,
	) {}

	public async create(
		input: ApplicationCreateInput,
		client: DatabaseClient = this.database,
	): Promise<MembershipApplication> {
		return client.membershipApplication.create({
			data: {
				userId: input.userId,
				guildId: input.guildId,
				status: "DRAFTING",
				displayName: input.displayName,
				githubHandle: input.githubHandle,
				strongestProject: input.strongestProject,
				projectExplanation: input.projectExplanation,
				techStack: input.techStack,
				experienceLevel:
					input.experienceLevel as $Enums.ExperienceLevel,
				purposeOfJoining: input.purposeOfJoining,
				selfIntroduction: input.selfIntroduction,
				linkedInUrl: input.linkedInUrl ?? null,
				portfolioUrl: input.portfolioUrl ?? null,
				referralSource:
					input.referralSource as $Enums.ReferralSource,
				referralOtherText: input.referralOtherText ?? null,
			},
		});
	}

	public async findById(
		id: string,
		client: DatabaseClient = this.database,
	): Promise<MembershipApplication | null> {
		return client.membershipApplication.findUnique({
			where: { id },
		});
	}

	public async findLatestByUserId(
		userId: string,
		client: DatabaseClient = this.database,
	): Promise<MembershipApplication | null> {
		return client.membershipApplication.findFirst({
			where: { userId },
			orderBy: { createdAt: "desc" },
		});
	}

	public async findSubmittedByGuildId(
		guildId: string,
		client: DatabaseClient = this.database,
	): Promise<MembershipApplication[]> {
		return client.membershipApplication.findMany({
			where: { guildId, status: "SUBMITTED" },
			orderBy: { createdAt: "asc" },
		});
	}

	public async updateStatus(
		id: string,
		status: ApplicationStatus,
		client: DatabaseClient = this.database,
	): Promise<MembershipApplication> {
		return client.membershipApplication.update({
			where: { id },
			data: { status },
		});
	}

	public async updateFields(
		id: string,
		data: Partial<ApplicationCreateInput>,
		client: DatabaseClient = this.database,
	): Promise<MembershipApplication> {
		const updateData: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(data)) {
			updateData[key] = value ?? null;
		}
		return client.membershipApplication.update({
			where: { id },
			data: updateData,
		});
	}

	public async approve(
		id: string,
		reviewedBy: string,
		client: DatabaseClient = this.database,
	): Promise<MembershipApplication> {
		return client.membershipApplication.update({
			where: { id },
			data: {
				status: "APPROVED",
				reviewedBy,
				reviewedAt: new Date(),
			},
		});
	}

	public async reject(
		id: string,
		reviewedBy: string,
		reason: string,
		client: DatabaseClient = this.database,
	): Promise<MembershipApplication> {
		return client.membershipApplication.update({
			where: { id },
			data: {
				status: "REJECTED",
				reviewedBy,
				reviewedAt: new Date(),
				rejectionReason: reason,
			},
		});
	}
}
