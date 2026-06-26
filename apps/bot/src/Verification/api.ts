import { botConfig } from "../config.js";

const BASE_URL = botConfig.backend.baseUrl;
const TOKEN = botConfig.backend.token;

async function request<T>(
	method: string,
	path: string,
	body?: Record<string, unknown>,
): Promise<T> {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (TOKEN) {
		headers["Authorization"] = `Bot ${TOKEN}`;
	}

	const requestInit: RequestInit = {
		method,
		headers,
	};
	if (body) {
		requestInit.body = JSON.stringify(body);
	}

	const response = await fetch(`${BASE_URL}${path}`, requestInit);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(
			`Backend request failed: ${response.status} ${response.statusText} — ${text}`,
		);
	}

	return response.json() as Promise<T>;
}

export type ApplicationDetail = {
	id: string;
	userId: string;
	discordUserId: string | null;
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
	reviewedAt: string | null;
	rejectionReason: string | null;
	createdAt: string;
	updatedAt: string;
};

export type ApplicationSummary = {
	id: string;
	userId: string;
	guildId: string;
	status: string;
	displayName: string;
	githubHandle: string;
	experienceLevel: string;
	createdAt: string;
};

export type GuildConfig = {
	guildId: string;
	unverifiedRoleId: string;
	verifiedRoleId: string;
	reviewerRoleId: string;
	verificationChannelId: string;
};

export async function upsertGuildConfig(
	config: GuildConfig,
): Promise<GuildConfig> {
	return request<GuildConfig>("POST", "/guild-configs", config);
}

export async function getGuildConfig(
	guildId: string,
): Promise<GuildConfig> {
	return request<GuildConfig>("GET", `/guild-configs/${guildId}`);
}

export async function createApplication(data: {
	discordUserId: string;
	guildId: string;
	displayName: string;
	githubHandle: string;
	strongestProject: string;
	projectExplanation: string;
	techStack: string;
	experienceLevel: string;
	purposeOfJoining: string;
	selfIntroduction: string;
	linkedInUrl?: string | null;
	portfolioUrl?: string | null;
	referralSource: string;
	referralOtherText?: string | null;
}): Promise<ApplicationDetail> {
	return request<ApplicationDetail>(
		"POST",
		"/membership-applications",
		data,
	);
}

export async function updateApplication(
	id: string,
	data: Record<string, unknown>,
): Promise<ApplicationDetail> {
	return request<ApplicationDetail>(
		"PATCH",
		`/membership-applications/${id}`,
		data,
	);
}

export async function submitApplication(
	id: string,
	discordUserId: string,
): Promise<ApplicationDetail> {
	return request<ApplicationDetail>(
		"POST",
		`/membership-applications/${id}/submit`,
		{ applicationId: id, discordUserId },
	);
}

export async function getApplicationDetail(
	id: string,
): Promise<ApplicationDetail> {
	return request<ApplicationDetail>(
		"GET",
		`/membership-applications/${id}`,
	);
}

export async function getApplicationByUser(
	discordUserId: string,
): Promise<ApplicationSummary | null> {
	try {
		return await request<ApplicationSummary>(
			"GET",
			`/membership-applications/user/${discordUserId}`,
		);
	} catch {
		return null;
	}
}

export async function claimReview(
	applicationId: string,
	reviewerDiscordUserId: string,
): Promise<ApplicationDetail> {
	return request<ApplicationDetail>(
		"POST",
		`/membership-applications/${applicationId}/claim`,
		{ applicationId, reviewerDiscordUserId },
	);
}

export async function approveApplication(
	applicationId: string,
	reviewerDiscordUserId: string,
): Promise<ApplicationDetail> {
	return request<ApplicationDetail>(
		"POST",
		`/membership-applications/${applicationId}/approve`,
		{ reviewerDiscordUserId },
	);
}

export async function rejectApplication(
	applicationId: string,
	reviewerDiscordUserId: string,
	reason: string,
): Promise<ApplicationDetail> {
	return request<ApplicationDetail>(
		"POST",
		`/membership-applications/${applicationId}/reject`,
		{ reviewerDiscordUserId, reason },
	);
}

export async function listSubmittedApplications(
	guildId: string,
): Promise<{ applications: ApplicationSummary[]; total: number; page: number; limit: number }> {
	return request(
		"GET",
		`/membership-applications/guild/${guildId}/submitted`,
	);
}
