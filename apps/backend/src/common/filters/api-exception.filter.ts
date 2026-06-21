import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { ZodError } from "zod";

import { BackendConfigService } from "../../config/app.config.js";
import {
	type ApiError,
	ApiErrorException,
	createApiError,
} from "../errors/api-error.js";
import { normalizeZodFieldErrors } from "../validation/zod-validation.pipe.js";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
	constructor(
		private readonly config: BackendConfigService,
	) {}

	catch(exception: unknown, host: ArgumentsHost): void {
		const response = host
			.switchToHttp()
			.getResponse<FastifyReply>();
		const normalized = this.normalizeException(exception);

		response
			.status(normalized.statusCode)
			.send(normalized.error);
	}

	private normalizeException(exception: unknown): {
		statusCode: number;
		error: ApiError;
	} {
		if (exception instanceof ApiErrorException) {
			return {
				statusCode: exception.statusCode,
				error: exception.error,
			};
		}

		if (exception instanceof ZodError) {
			return {
				statusCode: HttpStatus.BAD_REQUEST,
				error: createApiError(
					"VALIDATION_ERROR",
					"Request validation failed.",
					normalizeZodFieldErrors(exception),
				),
			};
		}

		if (exception instanceof HttpException) {
			const statusCode = exception.getStatus();
			const response = exception.getResponse();

			return {
				statusCode,
				error: this.normalizeHttpResponse(
					statusCode,
					response,
				),
			};
		}

		return {
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			error: createApiError(
				"INTERNAL_SERVER_ERROR",
				this.config.nodeEnv === "production"
					? "Internal server error."
					: getErrorMessage(exception),
			),
		};
	}

	private normalizeHttpResponse(
		statusCode: number,
		response: string | object,
	): ApiError {
		if (isApiError(response)) {
			return response;
		}

		if (
			typeof response === "object" &&
			response !== null &&
			"message" in response
		) {
			return createApiError(
				statusToCode(statusCode),
				getResponseMessage(response),
			);
		}

		return createApiError(
			statusToCode(statusCode),
			typeof response === "string"
				? response
				: "Request failed.",
		);
	}
}

function isApiError(value: unknown): value is ApiError {
	return (
		typeof value === "object" &&
		value !== null &&
		"code" in value &&
		"message" in value &&
		typeof value.code === "string" &&
		typeof value.message === "string"
	);
}

function getResponseMessage(response: object): string {
	const message = (response as { message?: unknown })
		.message;

	if (Array.isArray(message)) {
		return message.join(", ");
	}

	if (typeof message === "string" && message.length > 0) {
		return message;
	}

	return "Request failed.";
}

function getErrorMessage(exception: unknown): string {
	if (
		exception instanceof Error &&
		exception.message.length > 0
	) {
		return exception.message;
	}

	return "Internal server error.";
}

function statusToCode(statusCode: number): string {
	switch (statusCode) {
		case 400:
			return "BAD_REQUEST";
		case 401:
			return "UNAUTHORIZED";
		case 403:
			return "FORBIDDEN";
		case 404:
			return "NOT_FOUND";
		default:
			return statusCode >= 500
				? "INTERNAL_SERVER_ERROR"
				: "REQUEST_FAILED";
	}
}
