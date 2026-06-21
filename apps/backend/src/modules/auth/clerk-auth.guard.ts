import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";

import type { AuthenticatedRequest } from "../../common/types/authenticated-request.js";
import { AuthService } from "./auth.service.js";

@Injectable()
export class ClerkAuthGuard implements CanActivate {
	constructor(private readonly auth: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context
			.switchToHttp()
			.getRequest<AuthenticatedRequest>();
		const token = this.auth.extractBearerToken(
			request.headers.authorization,
		);

		if (token === undefined) {
			throw new UnauthorizedException("Missing Bearer token.");
		}

		request.user = await this.auth.authenticateBearerToken(token);
		return true;
	}
}

