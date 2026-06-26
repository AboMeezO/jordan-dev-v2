import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";

import type { BotAuthenticatedRequest } from "../../common/types/bot-request.js";
import { BackendConfigService } from "../../config/app.config.js";

@Injectable()
export class BotAuthGuard implements CanActivate {
	public constructor(private readonly config: BackendConfigService) {}

	public async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context
			.switchToHttp()
			.getRequest<BotAuthenticatedRequest>();

		const token = this.extractBotToken(request.headers.authorization);

		if (token === undefined) {
			throw new UnauthorizedException("Missing Bot token.");
		}

		const expected = this.config.botToken;
		if (!expected || token !== expected) {
			throw new UnauthorizedException("Invalid Bot token.");
		}

		request.isBot = true;
		return true;
	}

	private extractBotToken(
		authorization: string | undefined,
	): string | undefined {
		const [scheme, token] = authorization?.split(" ") ?? [];

		if (
			scheme?.toLowerCase() !== "bot" ||
			token === undefined ||
			token.length === 0
		) {
			return undefined;
		}

		return token;
	}
}
