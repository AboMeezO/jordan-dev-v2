export type ApiError = {
	code: string;
	message: string;
	fieldErrors?: Record<string, string[]>;
};

export class ApiErrorException extends Error {
	constructor(
		public readonly statusCode: number,
		public readonly error: ApiError,
	) {
		super(error.message);
	}
}

export function createApiError(
	code: string,
	message: string,
	fieldErrors?: Record<string, string[]>,
): ApiError {
	return fieldErrors === undefined
		? { code, message }
		: { code, message, fieldErrors };
}

