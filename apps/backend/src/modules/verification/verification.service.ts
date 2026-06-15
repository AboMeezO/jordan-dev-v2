import { verifyToken } from "@clerk/backend";
import type { CompleteVerificationRequest, VerificationResult } from "@jordan-devs/shared";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class VerificationService {
  public async completeVerification(
    token: string,
    request: CompleteVerificationRequest,
  ): Promise<VerificationResult> {
    const clerkUserId = await this.verifyClerkToken(token);

    return {
      profile: {
        clerkUserId,
        discordUserId: request.discordUserId,
        email: null,
        guildId: request.guildId,
      },
      roleGranted: false,
    };
  }

  private async verifyClerkToken(token: string): Promise<string> {
    try {
      const verifiedToken = await verifyToken(token, {
        authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES?.split(","),
        jwtKey: process.env.CLERK_JWT_KEY,
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      return verifiedToken.sub;
    } catch {
      throw new UnauthorizedException("Clerk token could not be verified.");
    }
  }
}
