import type { ApplicationDetail, ApplicationList, ApplicationSummary, CreateApplicationRequest } from "@jordan-devs/shared";
import { createApplicationSchema, rejectApplicationSchema, submitApplicationSchema, updateApplicationSchema } from "@jordan-devs/shared";
import { permissions } from "@jordan-devs/shared";
import { Body, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator.js";
import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import { ZodValidationPipe } from "../../common/validation/zod-validation.pipe.js";
import { BotAuthGuard } from "../auth/bot-auth.guard.js";
import { UserService } from "../users/user.service.js";
import { MembershipApplicationService } from "./membership-application.service.js";

@Controller("membership-applications")
export class MembershipApplicationController {
	public constructor(
		private readonly applications: MembershipApplicationService,
		private readonly users: UserService,
	) {}

	@Post()
	@UseGuards(BotAuthGuard)
	public async create(
		@Body(new ZodValidationPipe(createApplicationSchema))
		request: CreateApplicationRequest & { discordUserId: string },
	): Promise<ApplicationDetail> {
		const user = await this.users.upsertFromDiscordIdentity({
			discordUserId: request.discordUserId,
			displayName: request.displayName,
		});
		return this.applications.create(user.id, request);
	}

	@Patch(":id")
	@UseGuards(BotAuthGuard)
	public async update(
		@Param("id") id: string,
		@Body(new ZodValidationPipe(updateApplicationSchema))
		request: Partial<CreateApplicationRequest> & { discordUserId: string },
	): Promise<ApplicationDetail> {
		const user = await this.users.findByDiscordUserId(request.discordUserId);
		if (!user) {
			throw new NotFoundException("User not found");
		}
		return this.applications.update(id, user.id, request);
	}

	@Post(":id/submit")
	@UseGuards(BotAuthGuard)
	public async submit(
		@Param("id") id: string,
		@Body(new ZodValidationPipe(submitApplicationSchema))
		request: { applicationId: string; discordUserId: string },
	): Promise<ApplicationDetail> {
		const user = await this.users.findByDiscordUserId(request.discordUserId);
		if (!user) {
			throw new NotFoundException("User not found");
		}
		return this.applications.submit(id, user.id);
	}

	@Get(":id")
	@UseGuards(BotAuthGuard)
	public async getDetail(
		@Param("id") id: string,
	): Promise<ApplicationDetail> {
		return this.applications.getDetail(id);
	}

	@Get("user/:discordUserId")
	@UseGuards(BotAuthGuard)
	public async findByUser(
		@Param("discordUserId") discordUserId: string,
	): Promise<ApplicationSummary | null> {
		const user = await this.users.findByDiscordUserId(discordUserId);
		if (!user) {
			return null;
		}
		return this.applications.findByUserId(user.id);
	}

	@Post(":id/claim")
	@UseGuards(BotAuthGuard)
	public async claim(
		@Param("id") id: string,
	): Promise<ApplicationDetail> {
		return this.applications.claimReview(id);
	}

	@Post(":id/approve")
	@UseGuards(BotAuthGuard)
	public async approve(
		@Param("id") id: string,
		@Body()
		request: { reviewerDiscordUserId: string },
	): Promise<ApplicationDetail> {
		const reviewer = await this.users.upsertFromDiscordIdentity({
			discordUserId: request.reviewerDiscordUserId,
		});
		return this.applications.approve(id, reviewer.id);
	}

	@Post(":id/reject")
	@UseGuards(BotAuthGuard)
	public async reject(
		@Param("id") id: string,
		@Body()
		request: { reviewerDiscordUserId: string; reason: string },
	): Promise<ApplicationDetail> {
		const reviewer = await this.users.upsertFromDiscordIdentity({
			discordUserId: request.reviewerDiscordUserId,
		});
		return this.applications.reject(id, reviewer.id, request.reason);
	}

	@Get("guild/:guildId/submitted")
	@UseGuards(BotAuthGuard)
	public async listSubmitted(
		@Param("guildId") guildId: string,
	): Promise<ApplicationList> {
		return this.applications.listSubmitted(guildId);
	}

	@Get("dashboard/:id")
	@RequirePermissions(permissions.verificationReview)
	public async getDetailDashboard(
		@Param("id") id: string,
	): Promise<ApplicationDetail> {
		return this.applications.getDetail(id);
	}

	@Get("dashboard/guild/:guildId/submitted")
	@RequirePermissions(permissions.verificationReview)
	public async listSubmittedDashboard(
		@Param("guildId") guildId: string,
	): Promise<ApplicationList> {
		return this.applications.listSubmitted(guildId);
	}

	@Post("dashboard/:id/approve")
	@RequirePermissions(permissions.verificationReview)
	public async approveDashboard(
		@Param("id") id: string,
		@CurrentUser() user: AuthenticatedUser,
	): Promise<ApplicationDetail> {
		return this.applications.approve(id, user.localUserId);
	}

	@Post("dashboard/:id/reject")
	@RequirePermissions(permissions.verificationReview)
	public async rejectDashboard(
		@Param("id") id: string,
		@CurrentUser() user: AuthenticatedUser,
		@Body(new ZodValidationPipe(rejectApplicationSchema))
		request: { applicationId: string; reason: string },
	): Promise<ApplicationDetail> {
		return this.applications.reject(id, user.localUserId, request.reason);
	}
}
