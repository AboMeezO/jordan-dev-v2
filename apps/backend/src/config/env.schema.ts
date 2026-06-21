import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const commaSeparatedListSchema = z
	.string()
	.transform((value) =>
		value
			.split(",")
			.map((item) => item.trim())
			.filter((item) => item.length > 0),
	);

export function createBackendEnv(
	runtimeEnv: NodeJS.ProcessEnv,
) {
	return createEnv({
		emptyStringAsUndefined: true,
		runtimeEnv,
		server: {
			CLERK_AUTHORIZED_PARTIES:
				commaSeparatedListSchema.optional(),
			CLERK_JWT_KEY: z.string().min(1),
			CLERK_SECRET_KEY: z.string().min(1),
			DATABASE_URL: z.string().min(1),
			FRONTEND_ORIGIN: commaSeparatedListSchema.optional(),
			INITIAL_ADMIN_CLERK_USER_ID: z
				.string()
				.min(1)
				.optional(),
			NODE_ENV: z
				.enum(["development", "test", "production"])
				.default("development"),
			PORT: z.coerce
				.number()
				.int()
				.positive()
				.default(3001),
		},
	});
}

export type BackendEnv = ReturnType<
	typeof createBackendEnv
>;
