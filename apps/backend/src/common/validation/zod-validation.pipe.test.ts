import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ZodValidationPipe } from "./zod-validation.pipe.js";

describe("ZodValidationPipe", () => {
	it("returns parsed data for valid input", () => {
		const pipe = new ZodValidationPipe(
			z.object({ name: z.string().min(1) }),
		);

		expect(pipe.transform({ name: "Jordan" })).toEqual({
			name: "Jordan",
		});
	});

	it("throws normalized field errors for invalid input", () => {
		const pipe = new ZodValidationPipe(
			z.object({ name: z.string().min(1) }),
		);

		expect(() => pipe.transform({ name: "" })).toThrow(
			BadRequestException,
		);
		try {
			pipe.transform({ name: "" });
		} catch (error) {
			const response = (error as BadRequestException).getResponse();
			expect(response).toMatchObject({
				code: "VALIDATION_ERROR",
				fieldErrors: {
					name: expect.arrayContaining([
						expect.stringMatching(/too small/i),
					]),
				},
			});
		}
	});
});

