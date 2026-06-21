import {
	ArgumentsHost,
	ForbiddenException,
	UnauthorizedException,
} from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { BackendConfigService } from "../../config/app.config.js";
import { ApiExceptionFilter } from "./api-exception.filter.js";

describe("ApiExceptionFilter", () => {
	it("normalizes auth errors", () => {
		const sent = runFilter(new UnauthorizedException("No token"));

		expect(sent.statusCode).toBe(401);
		expect(sent.body).toEqual({
			code: "UNAUTHORIZED",
			message: "No token",
		});
	});

	it("normalizes forbidden errors", () => {
		const sent = runFilter(new ForbiddenException("Denied"));

		expect(sent.statusCode).toBe(403);
		expect(sent.body).toEqual({
			code: "FORBIDDEN",
			message: "Denied",
		});
	});
});

function runFilter(exception: unknown): {
	statusCode: number;
	body: unknown;
} {
	let statusCode = 0;
	let body: unknown;
	const response = {
		status: vi.fn((status: number) => {
			statusCode = status;
			return response;
		}),
		send: vi.fn((payload: unknown) => {
			body = payload;
			return response;
		}),
	};
	const host = {
		switchToHttp: () => ({
			getResponse: () => response,
		}),
	} as unknown as ArgumentsHost;
	const config = {
		nodeEnv: "test",
	} as BackendConfigService;

	new ApiExceptionFilter(config).catch(exception, host);

	return { statusCode, body };
}

