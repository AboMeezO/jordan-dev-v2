import type {
	ApplicationDetail,
	ApplicationList,
	ApplicationSummary,
	CreateApplicationRequest,
} from "@jordan-devs/shared";
import { ConflictException,Injectable, NotFoundException } from "@nestjs/common";

import { DatabaseService } from "../../database/database.service.js";
import { UserService } from "../users/user.service.js";
import { MembershipApplicationRepository } from "./membership-application.repository.js";

@Injectable()
export class MembershipApplicationService {
	public constructor(
		private readonly database: DatabaseService,
		private readonly applications: MembershipApplicationRepository,
		private readonly users: UserService,
	) {}

	public async create(
		userId: string,
		request: CreateApplicationRequest,
	): Promise<ApplicationDetail> {
		const existing = await this.applications.findLatestByUserId(userId);
		if (existing && existing.status === "DRAFTING") {
			throw new ConflictException(
				"You already have a draft application. Complete or cancel it first.",
			);
		}

		const application = await this.applications.create({
			...request,
			linkedInUrl: request.linkedInUrl ?? null,
			portfolioUrl: request.portfolioUrl ?? null,
			referralOtherText: request.referralOtherText ?? null,
			userId,
		});

		return await this.toDetail(application);
	}

	public async update(
		applicationId: string,
		userId: string,
		request: Partial<CreateApplicationRequest>,
	): Promise<ApplicationDetail> {
		const application = await this.applications.findById(applicationId);
		if (!application) {
			throw new NotFoundException("Application not found");
		}
		if (application.userId !== userId) {
			throw new NotFoundException("Application not found");
		}
		if (application.status !== "DRAFTING") {
			throw new ConflictException(
				"Can only edit applications in DRAFTING status",
			);
		}

		const updated = await this.applications.updateFields(applicationId, request);
		return await this.toDetail(updated);
	}

	public async submit(
		applicationId: string,
		userId: string,
	): Promise<ApplicationDetail> {
		const application = await this.applications.findById(applicationId);
		if (!application) {
			throw new NotFoundException("Application not found");
		}
		if (application.userId !== userId) {
			throw new NotFoundException("Application not found");
		}
		if (application.status !== "DRAFTING") {
			throw new ConflictException(
				"Can only submit applications in DRAFTING status",
			);
		}

		const updated = await this.applications.updateStatus(
			applicationId,
			"SUBMITTED",
		);
		return await this.toDetail(updated);
	}

	public async getDetail(
		applicationId: string,
	): Promise<ApplicationDetail> {
		const application = await this.applications.findById(applicationId);
		if (!application) {
			throw new NotFoundException("Application not found");
		}
		return await this.toDetail(application);
	}

	public async claimReview(
		applicationId: string,
		_reviewerUserId: string,
	): Promise<ApplicationDetail> {
		const application = await this.applications.findById(applicationId);
		if (!application) {
			throw new NotFoundException("Application not found");
		}
		if (application.status !== "SUBMITTED") {
			throw new ConflictException(
				"Can only claim applications in SUBMITTED status",
			);
		}

		const updated = await this.applications.updateStatus(
			applicationId,
			"UNDER_REVIEW",
		);
		return await this.toDetail(updated);
	}

	public async approve(
		applicationId: string,
		reviewerUserId: string,
	): Promise<ApplicationDetail> {
		return this.database.transaction(async (tx) => {
			const application = await this.applications.findById(
				applicationId,
				tx,
			);
			if (!application) {
				throw new NotFoundException("Application not found");
			}
			if (application.status !== "UNDER_REVIEW") {
				throw new ConflictException(
					"Can only approve applications in UNDER_REVIEW status",
				);
			}

			const updated = await this.applications.approve(
				applicationId,
				reviewerUserId,
				tx,
			);

			await tx.verification.update({
				where: { userId_guildId: { userId: application.userId, guildId: application.guildId } },
				data: { status: "ROLE_GRANT_PENDING" },
			});

			await tx.verificationEvent.create({
				data: {
					verificationId: (
						await tx.verification.findUniqueOrThrow({
							where: { userId_guildId: { userId: application.userId, guildId: application.guildId } },
							select: { id: true },
						})
					).id,
					userId: application.userId,
					type: "ROLE_GRANT_PENDING",
					status: "ROLE_GRANT_PENDING",
					message: "Application approved — role grant pending.",
				},
			});

			await tx.verificationRoleGrantJob.upsert({
				where: {
					verificationId_status: {
						verificationId: (
							await tx.verification.findUniqueOrThrow({
								where: { userId_guildId: { userId: application.userId, guildId: application.guildId } },
								select: { id: true },
							})
						).id,
						status: "PENDING",
					},
				},
				create: {
					verificationId: (
						await tx.verification.findUniqueOrThrow({
							where: { userId_guildId: { userId: application.userId, guildId: application.guildId } },
							select: { id: true },
						})
					).id,
					userId: application.userId,
					discordUserId: (
						await tx.user.findUniqueOrThrow({
							where: { id: application.userId },
							select: { discordUserId: true },
						})
					).discordUserId!,
					guildId: application.guildId,
				},
				update: { lastError: null },
			});

			return await this.toDetail(updated);
		});
	}

	public async reject(
		applicationId: string,
		reviewerUserId: string,
		reason: string,
	): Promise<ApplicationDetail> {
		const application = await this.applications.findById(applicationId);
		if (!application) {
			throw new NotFoundException("Application not found");
		}
		if (application.status !== "UNDER_REVIEW") {
			throw new ConflictException(
				"Can only reject applications in UNDER_REVIEW status",
			);
		}

		const updated = await this.applications.reject(
			applicationId,
			reviewerUserId,
			reason,
		);
		return await this.toDetail(updated);
	}

	public async listSubmitted(
		guildId: string,
	): Promise<ApplicationList> {
		const applications =
			await this.applications.findSubmittedByGuildId(guildId);
		return {
			applications: applications.map((app) => ({
				id: app.id,
				userId: app.userId,
				guildId: app.guildId,
				status: app.status,
				displayName: app.displayName,
				githubHandle: app.githubHandle,
				experienceLevel: app.experienceLevel,
				createdAt: app.createdAt.toISOString(),
			})),
			total: applications.length,
			page: 1,
			limit: applications.length,
		};
	}

	public async findByUserId(
		userId: string,
	): Promise<ApplicationSummary | null> {
		const application =
			await this.applications.findLatestByUserId(userId);
		if (!application) {
			return null;
		}
		return {
			id: application.id,
			userId: application.userId,
			guildId: application.guildId,
			status: application.status,
			displayName: application.displayName,
			githubHandle: application.githubHandle,
			experienceLevel: application.experienceLevel,
			createdAt: application.createdAt.toISOString(),
		};
	}

	private async toDetail(
		application: {
			id: string;
			userId: string;
			guildId: string;
			status: string;
			displayName: string;
			githubHandle: string;
			strongestProject: string;
			projectExplanation: string;
			techStack: string;
			experienceLevel: string;
			purposeOfJoining: string;
			selfIntroduction: string;
			linkedInUrl: string | null;
			portfolioUrl: string | null;
			referralSource: string;
			referralOtherText: string | null;
			reviewedBy: string | null;
			reviewedAt: Date | null;
			rejectionReason: string | null;
			createdAt: Date;
			updatedAt: Date;
		},
	): Promise<ApplicationDetail> {
		const user = await this.users.findById(application.userId);
		return {
			id: application.id,
			userId: application.userId,
			discordUserId: user?.discordUserId ?? null,
			guildId: application.guildId,
			status: application.status as ApplicationDetail["status"],
			displayName: application.displayName,
			githubHandle: application.githubHandle,
			strongestProject: application.strongestProject,
			projectExplanation: application.projectExplanation,
			techStack: application.techStack,
			experienceLevel: application.experienceLevel as ApplicationDetail["experienceLevel"],
			purposeOfJoining: application.purposeOfJoining,
			selfIntroduction: application.selfIntroduction,
			linkedInUrl: application.linkedInUrl,
			portfolioUrl: application.portfolioUrl,
			referralSource: application.referralSource as ApplicationDetail["referralSource"],
			referralOtherText: application.referralOtherText,
			reviewedBy: application.reviewedBy,
			reviewedAt: application.reviewedAt?.toISOString() ?? null,
			rejectionReason: application.rejectionReason,
			createdAt: application.createdAt.toISOString(),
			updatedAt: application.updatedAt.toISOString(),
		};
	}
}
