import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { firstValueFrom, of } from "rxjs";
import { describe, expect, it } from "vitest";

import { ApiResponseInterceptor } from "./api-response.interceptor.js";

describe("ApiResponseInterceptor", () => {
	it("wraps successful responses", async () => {
		const interceptor = new ApiResponseInterceptor();
		const result = await firstValueFrom(
			interceptor.intercept(
				{} as ExecutionContext,
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
});

