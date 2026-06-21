import { Module } from "@nestjs/common";

import { BackendConfigModule } from "../../config/config.module.js";
import { VerificationController } from "./verification.controller.js";
import { VerificationService } from "./verification.service.js";

@Module({
	controllers: [VerificationController],
	imports: [BackendConfigModule],
	providers: [VerificationService],
})
export class VerificationModule {}
