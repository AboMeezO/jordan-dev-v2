import { JDConfigModule } from "@jordan-devs/config/nest";
import { Module } from "@nestjs/common";

import { BackendConfigService } from "./app.config.js";

@Module({
	imports: [
		JDConfigModule.forRoot({
			configPath: "Config.yaml",
			schemaPath: "schema.yaml",
			autoSyncEnabled: true,
			envFilePath: ".env",
			validateOnBoot: true,
		}),
	],
	exports: [BackendConfigService],
	providers: [BackendConfigService],
})
export class BackendConfigModule {}
