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
			// Arrange
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext(undefined);

			// Act
			const act = () => guard.canActivate(context);

			// Assert
			expect(act).toThrow(
				new UnauthorizedException("Missing Bot token."),
			);
		});

		it("throws when authorization header is an empty string", () => {
			// Arrange
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("");

			// Act
			const act = () => guard.canActivate(context);

			// Assert
			expect(act).toThrow(
				new UnauthorizedException("Missing Bot token."),
			);
		});

		it("throws when scheme is not 'bot'", () => {
			// Arrange
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext(
				"Bearer expected-token",
			);

			// Act
			const act = () => guard.canActivate(context);

			// Assert
			expect(act).toThrow(
				new UnauthorizedException("Missing Bot token."),
			);
		});

		it("throws when scheme is 'bot' but token part is missing", () => {
			// Arrange
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("Bot");

			// Act
			const act = () => guard.canActivate(context);

			// Assert
			expect(act).toThrow(
				new UnauthorizedException("Missing Bot token."),
			);
		});

		it("throws when scheme is 'bot' but token is an empty string", () => {
			// Arrange
			// "Bot " split by " " => ["Bot", ""]
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("Bot ");

			// Act
			const act = () => guard.canActivate(context);

			// Assert
			expect(act).toThrow(
				new UnauthorizedException("Missing Bot token."),
			);
		});

		it("accepts scheme case-insensitively (e.g. 'BOT')", () => {
			// Arrange
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context, request } = createContext(
				"BOT expected-token",
			);

			// Act
			const result = guard.canActivate(context);

			// Assert
			expect(result).toBe(true);
			expect(request.isBot).toBe(true);
		});
	});

	describe("token validation branches", () => {
		it("throws when config.botToken is falsy (undefined)", () => {
			// Arrange
			const config = {
				botToken: undefined,
			} as unknown as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("Bot some-token");

			// Act
			const act = () => guard.canActivate(context);

			// Assert
			expect(act).toThrow(
				new UnauthorizedException("Invalid Bot token."),
			);
		});

		it("throws when config.botToken is an empty string", () => {
			// Arrange
			const config = {
				botToken: "",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("Bot some-token");

			// Act
			const act = () => guard.canActivate(context);

			// Assert
			expect(act).toThrow(
				new UnauthorizedException("Invalid Bot token."),
			);
		});

		it("throws when provided token does not match expected token", () => {
			// Arrange
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context } = createContext("Bot wrong-token");

			// Act
			const act = () => guard.canActivate(context);

			// Assert
			expect(act).toThrow(
				new UnauthorizedException("Invalid Bot token."),
			);
		});

		it("returns true and sets isBot=true when token matches expected token", () => {
			// Arrange
			const config = {
				botToken: "expected-token",
			} as BackendConfigService;
			const guard = new BotAuthGuard(config);
			const { context, request } = createContext(
				"Bot expected-token",
			);

			// Act
			const result = guard.canActivate(context);

			// Assert
			expect(result).toBe(true);
			expect(request.isBot).toBe(true);
		});
	});
});
