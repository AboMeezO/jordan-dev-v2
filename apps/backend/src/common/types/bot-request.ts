import type { FastifyRequest } from "fastify";

export type BotAuthenticatedRequest = FastifyRequest & {
	isBot: true;
};
