import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { BackendConfigService } from "./app.config.js";

@Module({
	exports: [BackendConfigService],
	imports: [
		NestConfigModule.forRoot({
			envFilePath: ["../../.env", ".env"],
			isGlobal: true,
		}),
	],
	providers: [BackendConfigService],
})
export class BackendConfigModule {}
