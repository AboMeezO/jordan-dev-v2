import {
	createRemoteJWKSet,
	errors,
	jwtVerify,
} from "jose";
import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeOutput } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const jwtSchema = z.object({
	token: textInputSchema(8192),
});

function base64UrlDecode(str: string): string {
	try {
		const base64 = str
			.replace(/-/g, "+")
			.replace(/_/g, "/");
		const padded = base64.padEnd(
			base64.length + ((4 - (base64.length % 4)) % 4),
			"=",
		);
		return Buffer.from(padded, "base64").toString("utf-8");
	} catch {
		return "(invalid base64url encoding)";
	}
}

function decodeJWT(token: string): Record<string, unknown> {
	const parts = token.split(".");

	if (parts.length !== 3) {
		throw new Error(
			"Invalid JWT format: expected 3 dot-separated segments.",
		);
	}

	const [headerRaw, payloadRaw] = parts;

	try {
		const header = JSON.parse(
			base64UrlDecode(headerRaw!),
		) as Record<string, unknown>;
		const payload = JSON.parse(
			base64UrlDecode(payloadRaw!),
		) as Record<string, unknown>;
		return { header, payload };
	} catch {
		throw new Error(
			"Failed to parse JWT segments as JSON.",
		);
	}
}

export const jwtCommand = subcommand({
	name: "jwt",
	aliases: ["jwt-decode"],
	description: "Decode and optionally verify a JWT token.",
	category: "Network / Security Tools",
	cooldown: 3_000,
	inputLimits: { maxInputLength: 8192 },
	availability: {
		contexts: ["guild", "dm"],
	},
	usage: {
		formats: [
			"jwt <token>",
			"jwt <token> --verify <jwks-url>",
		],
		arguments: [
			{
				name: "token",
				description: "JWT token to decode.",
				required: true,
			},
		],
		examples: [
			{
				command: "jwt eyJhbGciOiJIUzI1NiIs...",
				description: "Decode a JWT token.",
			},
		],
		notes: [
			"WARNING: Decoded tokens are visible to everyone in this channel. Do NOT paste real session tokens.",
		],
	},
	async execute({ invocation, message }) {
		const verifyUrl = invocation.options.verify as
			| string
			| undefined;
		const raw = invocation.positionalArgs
			.filter((a) => !a.startsWith("--"))
			.join(" ")
			.trim();

		const parsed = jwtSchema.safeParse({ token: raw });

		if (!parsed.success) {
			await message.reply(
				parsed.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		try {
			const decoded = decodeJWT(parsed.data.token) as {
				header: Record<string, unknown>;
				payload: Record<string, unknown>;
			};
			const { header, payload } = decoded;

			let verified: string | undefined;

			if (verifyUrl) {
				try {
					const JWKS = createRemoteJWKSet(
						new URL(verifyUrl),
					);
					await jwtVerify(parsed.data.token, JWKS);
					verified = "Signature verified successfully.";
				} catch (err) {
					if (
						err instanceof
						errors.JWSSignatureVerificationFailed
					) {
						verified = "Signature verification FAILED.";
					} else if (err instanceof errors.JWTExpired) {
						verified = "Token is expired.";
					} else if (
						err instanceof errors.JWTClaimValidationFailed
					) {
						verified = `Claim validation failed: ${err.message}`;
					} else {
						verified = `Verification error: ${(err as Error).message}`;
					}
				}
			}

			const lines: string[] = [];

			lines.push(
				"! WARNING: This token is visible to everyone in this channel.",
			);
			lines.push(
				"! Do NOT paste real session or access tokens.",
			);
			lines.push("");

			lines.push("--- Header ---");
			for (const [key, value] of Object.entries(header)) {
				lines.push(`${key}=${JSON.stringify(value)}`);
			}

			lines.push("");
			lines.push("--- Payload ---");
			for (const [key, value] of Object.entries(payload)) {
				const display =
					typeof value === "string" && value.length > 200
						? `${value.slice(0, 200)}...`
						: JSON.stringify(value);
				lines.push(`${key}=${display}`);
			}

			if (verified !== undefined) {
				lines.push("");
				lines.push(`--- Verification ---\n${verified}`);
			}

			const output = safeOutput(lines.join("\n"));

			if ("content" in output) {
				await message.reply(output.content);
			} else {
				await message.reply({ files: [output.attachment] });
			}
		} catch (error) {
			const err = error as Error;
			await message.reply(
				`JWT decode failed: ${err.message}`,
			);
		}
	},
});
