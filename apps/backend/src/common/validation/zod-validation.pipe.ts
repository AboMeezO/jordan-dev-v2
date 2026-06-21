import {
	BadRequestException,
	type PipeTransform,
} from "@nestjs/common";
import type { z } from "zod";

import { createApiError } from "../errors/api-error.js";

export class ZodValidationPipe<TSchema extends z.ZodType>
	implements PipeTransform<unknown, z.output<TSchema>>
{
	constructor(private readonly schema: TSchema) {}

	transform(value: unknown): z.output<TSchema> {
		const result = this.schema.safeParse(value);

		if (result.success) {
			return result.data;
		}

		throw new BadRequestException(
			createApiError(
				"VALIDATION_ERROR",
				"Request validation failed.",
				normalizeZodFieldErrors(result.error),
			),
		);
	}
}

export function normalizeZodFieldErrors(
	error: z.ZodError,
): Record<string, string[]> {
	const fieldErrors: Record<string, string[]> = {};

	for (const issue of error.issues) {
		const key =
			issue.path.length === 0
				? "_root"
				: issue.path.map(String).join(".");
		fieldErrors[key] ??= [];
		fieldErrors[key].push(issue.message);
	}

	return fieldErrors;
}

