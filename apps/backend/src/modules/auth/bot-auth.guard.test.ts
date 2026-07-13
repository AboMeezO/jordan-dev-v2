import type { ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { describe, expect, it } from "vitest";

import type { BotAuthenticatedRequest } from "../../common/types/bot-request.js";
import type { BackendConfigService } from "../../config/app.config.js";
import { BotAuthGuard } from "./bot-auth.guard.js";

describe("BotAuthGuard", () => {
	const createContext = (
		authorization: string | undefined,
	): {
		context: ExecutionContext;
		request: Partial<BotAuthenticatedRequest>;
	} => {
		const request: Partial<BotAuthenticatedRequest> = {
			headers: { authorization },
		};

		const context = {
			switchToHttp: () => ({
				getRequest: () => request,
			}),
		} as unknown as ExecutionContext;

		return { context, request };
	};

	describe("extractBotToken branches (via canActivate)", () => {
		it("throws when authorization header is undefined", () => {
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext(undefined);

			expect(() => guard.canActivate(context)).toThrow(
				new UnauthorizedException("Missing Bot token."),
			);
		});

		it("throws when authorization header is an empty string", () => {
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("");

			expect(() => guard.canActivate(context)).toThrow(
				new UnauthorizedException("Missing Bot token."),
			);
		});

		it("throws when scheme is not 'bot'", () => {
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext(
				"Bearer expected-token",
			);

			expect(() => guard.canActivate(context)).toThrow(
				new UnauthorizedException("Missing Bot token."),
			);
		});

		it("throws when scheme is 'bot' but token part is missing", () => {
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("Bot");

			expect(() => guard.canActivate(context)).toThrow(
				new UnauthorizedException("Missing Bot token."),
			);
		});

		it("throws when scheme is 'bot' but token is an empty string", () => {
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("Bot ");

			expect(() => guard.canActivate(context)).toThrow(
				new UnauthorizedException("Missing Bot token."),
			);
		});

		it("accepts scheme case-insensitively (e.g. 'BOT')", () => {
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context, request } = createContext(
				"BOT expected-token",
			);

			const result = guard.canActivate(context);

			expect(result).toBe(true);
			expect(request.isBot).toBe(true);
		});
	});

	describe("token validation branches", () => {
		it("throws when config.botToken is falsy (undefined)", () => {
			const config = {
				botToken: undefined,
			} as unknown as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("Bot some-token");

			expect(() => guard.canActivate(context)).toThrow(
				new UnauthorizedException("Invalid Bot token."),
			);
		});

		it("throws when config.botToken is an empty string", () => {
			const config = {
				botToken: "",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("Bot some-token");

			expect(() => guard.canActivate(context)).toThrow(
				new UnauthorizedException("Invalid Bot token."),
			);
		});

		it("throws when provided token does not match expected token", () => {
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("Bot wrong-token");

			expect(() => guard.canActivate(context)).toThrow(
				new UnauthorizedException("Invalid Bot token."),
			);
		});

		it("returns true and sets isBot=true when token matches expected token", () => {
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context, request } = createContext(
				"Bot expected-token",
			);

			const result = guard.canActivate(context);

			expect(result).toBe(true);
			expect(request.isBot).toBe(true);
		});
	});
});
