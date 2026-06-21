import { describe, expect, it } from "vitest";

import { createBackendEnv } from "./env.schema.js";

const validEnv = {
	CLERK_JWT_KEY: "jwt-key",
	CLERK_SECRET_KEY: "secret-key",
	DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/app",
};

describe("createBackendEnv", () => {
	it("applies defaults and parses comma-separated lists", () => {
		const env = createBackendEnv({
			...validEnv,
			CLERK_AUTHORIZED_PARTIES: "http://localhost:3000, https://app.test ",
			FRONTEND_ORIGIN: "http://localhost:3000",
			PORT: "4000",
		});

		expect(env.NODE_ENV).toBe("development");
		expect(env.PORT).toBe(4000);
		expect(env.FRONTEND_ORIGIN).toEqual(["http://localhost:3000"]);
		expect(env.CLERK_AUTHORIZED_PARTIES).toEqual([
			"http://localhost:3000",
			"https://app.test",
		]);
	});

	it("fails fast when required secrets are missing", () => {
		expect(() =>
			createBackendEnv({
				DATABASE_URL: validEnv.DATABASE_URL,
			}),
		).toThrow();
	});
});

