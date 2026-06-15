import { completeVerificationRequestSchema, type VerificationResult } from "@jordan-devs/shared";
import { Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";

import { VerificationService } from "./verification.service.js";

@Controller("verification")
export class VerificationController {
  public constructor(private readonly verificationService: VerificationService) {}

  @Post("complete")
  public async complete(
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ): Promise<VerificationResult> {
    const token = extractBearerToken(authorization);

    if (token === undefined) {
      throw new UnauthorizedException("Missing Bearer token.");
    }

    const request = completeVerificationRequestSchema.parse(body);
    return this.verificationService.completeVerification(token, request);
  }
}

function extractBearerToken(authorization: string | undefined): string | undefined {
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme?.toLowerCase() !== "bearer" || token === undefined || token.length === 0) {
    return undefined;
  }

  return token;
}
