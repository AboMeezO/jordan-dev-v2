import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host.js";
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
	const reflector = new Reflector();
	vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(
		skipTransform,
	);

	return reflector;
}

function mockContext(): ExecutionContext {
	return new ExecutionContextHost([], class {}, () => undefined);
}
