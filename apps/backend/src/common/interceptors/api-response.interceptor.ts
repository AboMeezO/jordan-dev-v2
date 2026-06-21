import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import { map, type Observable } from "rxjs";

export type ApiSuccessResponse<T> = {
	success: true;
	data: T;
	meta?: Record<string, unknown>;
};

@Injectable()
export class ApiResponseInterceptor<T>
	implements NestInterceptor<T, ApiSuccessResponse<T>>
{
	intercept(
		_context: ExecutionContext,
		next: CallHandler<T>,
	): Observable<ApiSuccessResponse<T>> {
		return next.handle().pipe(
			map((data) => ({
				success: true,
				data,
			})),
		);
	}
}

