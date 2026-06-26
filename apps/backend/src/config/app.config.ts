import { Inject, Injectable } from "@nestjs/common";

import { JD_CONFIG } from "@jordan-devs/config/nest";
import type { Config } from "@jordan-devs/config";

@Injectable()
export class BackendConfigService {
	public constructor(
		@Inject(JD_CONFIG) private readonly config: Config,
	) {}

	public get port(): number {
		return this.config.get<number>("server.port");
	}

	public get nodeEnv(): string {
		return this.config.get<string>("server.nodeEnv");
	}

	public get isProduction(): boolean {
		return this.nodeEnv === "production";
	}

	public get frontendOrigins(): string[] | undefined {
		const raw = this.config.get<string | undefined>("server.frontendOrigins");
		return raw
			? raw.split(",").map((s) => s.trim()).filter(Boolean)
			: undefined;
	}

	public get databaseUrl(): string {
		return this.config.get<string>("database.url");
	}

	public get clerkSecretKey(): string {
		return this.config.get<string>("clerk.secretKey");
	}

	public get clerkJwtKey(): string {
		return this.config.get<string>("clerk.jwtKey");
	}

	public get clerkAuthorizedParties(): string[] | undefined {
		const raw = this.config.get<string | undefined>("clerk.authorizedParties");
		return raw
			? raw.split(",").map((s) => s.trim()).filter(Boolean)
			: undefined;
	}

	public get initialAdminClerkUserId(): string | undefined {
		return this.config.get<string | undefined>("initialAdminClerkUserId");
	}

	public get botToken(): string | undefined {
		return this.config.get<string | undefined>("bot.token");
	}

	public assertLoaded(): void {
		this.config.validate();
	}
}
