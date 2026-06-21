import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ZodValidationPipe } from "./zod-validation.pipe.js";

type ValidationErrorResponse = {
	code: string;
	fieldErrors: {
		name?: readonly string[];
	};
};

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
			if (!(error instanceof BadRequestException)) {
				throw error;
			}

			const response = error.getResponse();

			if (!isValidationErrorResponse(response)) {
				throw new Error(
					"Expected a validation error response.",
					{
						cause: error,
					},
				);
			}

			expect(response.code).toBe("VALIDATION_ERROR");
			expect(response.fieldErrors.name).toEqual(
				expect.arrayContaining([
					expect.stringMatching(/too small/i),
				]),
			);
		}
	});
});

function isValidationErrorResponse(
	value: unknown,
): value is ValidationErrorResponse {
	return (
		typeof value === "object" &&
		value !== null &&
		"code" in value &&
		"fieldErrors" in value
	);
}
