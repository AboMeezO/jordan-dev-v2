import type { CallHandler, ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { firstValueFrom, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { ApiResponseInterceptor } from "./api-response.interceptor.js";

describe("ApiResponseInterceptor", () => {
	it("wraps successful responses", async () => {
		const interceptor = new ApiResponseInterceptor(
			mockReflector(false),
		);
		const result = await firstValueFrom(
			interceptor.intercept(
				mockContext(),
				{
					handle: () => of({ status: "ok" }),
				} as CallHandler,
			),
		);

		expect(result).toEqual({
			success: true,
			data: { status: "ok" },
		});
	});

	it("leaves responses untouched when transformation is skipped", async () => {
		const interceptor = new ApiResponseInterceptor(
			mockReflector(true),
		);
		const payload = { raw: true };
		const result = await firstValueFrom(
			interceptor.intercept(
				mockContext(),
				{
					handle: () => of(payload),
				} as CallHandler,
			),
		);

		expect(result).toBe(payload);
	});
});

function mockReflector(skipTransform: boolean): Reflector {
	return {
		getAllAndOverride: vi.fn(() => skipTransform),
	} as unknown as Reflector;
}

function mockContext(): ExecutionContext {
	return {
		getHandler: vi.fn(),
		getClass: vi.fn(),
	} as unknown as ExecutionContext;
}
