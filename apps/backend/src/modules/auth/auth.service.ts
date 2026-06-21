import { verifyToken } from "@clerk/backend";
import { Injectable, UnauthorizedException } from "@nestjs/common";

import type { AuthenticatedUser } from "../../common/types/authenticated-request.js";
import { BackendConfigService } from "../../config/app.config.js";
import { UserService } from "../users/user.service.js";
import type { ClerkUserIdentity } from "../users/user.types.js";

type ClerkClaims = {
	sub?: unknown;
	email?: unknown;
	email_address?: unknown;
	name?: unknown;
	full_name?: unknown;
	image_url?: unknown;
	picture?: unknown;
};

@Injectable()
export class AuthService {
	constructor(
		private readonly config: BackendConfigService,
		private readonly users: UserService,
	) {}

	extractBearerToken(authorization: string | undefined): string | undefined {
		const [scheme, token] = authorization?.split(" ") ?? [];

		if (
			scheme?.toLowerCase() !== "bearer" ||
			token === undefined ||
			token.length === 0
		) {
			return undefined;
		}

		return token;
	}

	async authenticateBearerToken(token: string): Promise<AuthenticatedUser> {
		const claims = await this.verifyClerkToken(token);
		const identity = this.toClerkIdentity(claims);
		const user = await this.users.upsertFromClerkIdentity(identity);

		return {
			clerkUserId: identity.clerkUserId,
			localUserId: user.id,
			email: user.email,
			displayName: user.displayName,
			avatarUrl: user.avatarUrl,
		};
	}

	private async verifyClerkToken(token: string): Promise<ClerkClaims> {
		try {
			return await verifyToken(token, {
				authorizedParties: this.config.clerkAuthorizedParties,
				jwtKey: this.config.clerkJwtKey,
				secretKey: this.config.clerkSecretKey,
			});
		} catch {
			throw new UnauthorizedException(
				"Clerk token could not be verified.",
			);
		}
	}

	private toClerkIdentity(claims: ClerkClaims): ClerkUserIdentity {
		if (typeof claims.sub !== "string" || claims.sub.length === 0) {
			throw new UnauthorizedException(
				"Clerk token did not include a user subject.",
			);
		}

		return {
			clerkUserId: claims.sub,
			email: firstString(claims.email, claims.email_address),
			displayName: firstString(claims.name, claims.full_name),
			avatarUrl: firstString(claims.image_url, claims.picture),
		};
	}
}

function firstString(...values: readonly unknown[]): string | null {
	for (const value of values) {
		if (typeof value === "string" && value.length > 0) {
			return value;
		}
	}

	return null;
}

