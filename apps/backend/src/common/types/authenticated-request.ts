import type { FastifyRequest } from "fastify";

export type AuthenticatedUser = {
	clerkUserId: string;
	localUserId: string;
	email: string | null;
	displayName: string | null;
	avatarUrl: string | null;
	permissions?: readonly string[];
};

export type AuthenticatedRequest = FastifyRequest & {
	user?: AuthenticatedUser;
};
