import { Module } from "@nestjs/common";

import { BackendConfigModule } from "../config/config.module.js";
import { DatabaseService } from "./database.service.js";

@Module({
	exports: [DatabaseService],
	imports: [BackendConfigModule],
	providers: [DatabaseService],
})
export class DatabaseModule {}
