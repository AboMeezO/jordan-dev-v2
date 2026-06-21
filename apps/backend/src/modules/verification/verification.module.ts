import { Module } from "@nestjs/common";

import { DatabaseModule } from "../../database/database.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { VerificationController } from "./verification.controller.js";
import { VerificationRepository } from "./verification.repository.js";
import { VerificationService } from "./verification.service.js";

@Module({
	controllers: [VerificationController],
	imports: [AuthModule, DatabaseModule],
	providers: [VerificationRepository, VerificationService],
	exports: [VerificationRepository, VerificationService],
})
export class VerificationModule {}
