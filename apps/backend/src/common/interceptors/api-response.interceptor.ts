import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map, type Observable } from "rxjs";

import { SKIP_RESPONSE_TRANSFORM_METADATA_KEY } from "../decorators/skip-response-transform.decorator.js";

export type ApiSuccessResponse<T> = {
	success: true;
	data: T;
	meta?: Record<string, unknown>;
};

@Injectable()
export class ApiResponseInterceptor<T>
	implements NestInterceptor<T, ApiSuccessResponse<T> | T>
{
	constructor(private readonly reflector: Reflector) {}

	intercept(
		context: ExecutionContext,
		next: CallHandler<T>,
	): Observable<ApiSuccessResponse<T> | T> {
		const skipTransform =
			this.reflector.getAllAndOverride<boolean>(
				SKIP_RESPONSE_TRANSFORM_METADATA_KEY,
				[context.getHandler(), context.getClass()],
			) === true;

		if (skipTransform) {
			return next.handle();
		}

		return next.handle().pipe(
			map((data) => ({
				success: true,
				data,
			})),
		);
	}
}
