import {
	Controller,
	Get,
	ServiceUnavailableException,
} from "@nestjs/common";

import { BackendConfigService } from "../../config/app.config.js";
import { DatabaseService } from "../../database/database.service.js";

@Controller("health")
export class HealthController {
	constructor(
		private readonly config: BackendConfigService,
		private readonly database: DatabaseService,
	) {}

	@Get()
	public check(): { status: "ok" } {
		return { status: "ok" };
	}

	@Get("ready")
	public async ready(): Promise<{
		status: "ready";
		checks: {
			config: "ok";
			database: "ok";
		};
	}> {
		try {
			this.config.assertLoaded();
			await this.database.checkConnection();
		} catch {
			throw new ServiceUnavailableException(
				"Backend is not ready.",
			);
		}

		return {
			status: "ready",
			checks: {
				config: "ok",
				database: "ok",
			},
		};
	}
}
