import { Injectable } from "@nestjs/common";

import { createBackendEnv } from "./env.schema.js";

@Injectable()
export class BackendConfigService {
	private readonly env = createBackendEnv(process.env);

	public get nodeEnv() {
		return this.env.NODE_ENV;
	}

	public get port() {
		return this.env.PORT;
	}

	public get frontendOrigins() {
		return this.env.FRONTEND_ORIGIN;
	}

	public get databaseUrl() {
		return this.env.DATABASE_URL;
	}

	public get clerkSecretKey() {
		return this.env.CLERK_SECRET_KEY;
	}

	public get clerkJwtKey() {
		return this.env.CLERK_JWT_KEY;
	}

	public get clerkAuthorizedParties() {
		return this.env.CLERK_AUTHORIZED_PARTIES;
	}

	public get isProduction() {
		return this.env.NODE_ENV === "production";
	}

	public assertLoaded(): void {
		void this.env;
	}
}
