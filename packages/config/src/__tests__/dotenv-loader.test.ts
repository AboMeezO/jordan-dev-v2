import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { envToNestedObject, parseEnvFile, syncEnvFile } from "../dotenv-loader.js";

describe("parseEnvFile", () => {
	it("parses simple key=value pairs", () => {
		const result = parseEnvFile("FOO=bar\nBAZ=qux");
		expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
	});

	it("skips comments and blank lines", () => {
		const result = parseEnvFile("# comment\n\nFOO=bar\n# another\nBAZ=qux");
		expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
	});

	it("handles quoted values", () => {
		const result = parseEnvFile('FOO="bar"\nBAZ=\'qux\'');
		expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
	});

	it("handles dot-path keys", () => {
		const result = parseEnvFile("SERVER.PORT=4000\nDATABASE.URL=postgres://localhost/db");
		expect(result).toEqual({
			"SERVER.PORT": "4000",
			"DATABASE.URL": "postgres://localhost/db",
		});
	});
});

describe("envToNestedObject", () => {
	it("converts flat keys directly (case preserved)", () => {
		const result = envToNestedObject({ FOO: "bar", BAZ: "qux" });
		expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
	});

	it("converts dot-notation keys to nested objects (exact case)", () => {
		const result = envToNestedObject({ "server.port": "4000", "server.host": "0.0.0.0" });
		expect(result).toEqual({ server: { port: "4000", host: "0.0.0.0" } });
	});

	it("mixes flat and dot-notation keys (exact case)", () => {
		const result = envToNestedObject({
			"TOKEN": "abc",
			"database.url": "postgres://localhost/db",
			"database.driver": "postgres",
		});
		expect(result).toEqual({
			TOKEN: "abc",
			database: { url: "postgres://localhost/db", driver: "postgres" },
		});
	});

	it("handles deeply nested paths (exact case)", () => {
		const result = envToNestedObject({ "a.b.c.d": "deep" });
		expect(result).toEqual({ a: { b: { c: { d: "deep" } } } });
	});
});

function withTempDir(fn: (dir: string) => void): void {
	const dir = join(tmpdir(), `jd-config-test-${Date.now()}`);
	mkdirSync(dir, { recursive: true });
	fn(dir);
}

describe("syncEnvFile", () => {
	it("adds missing keys with defaults to new env file", () => {
		withTempDir((dir) => {
			const envPath = join(dir, ".env");
			const flatKeys = new Map([
				["server.port", { type: "number", required: true, default: 3000 }],
				["server.host", { type: "string", required: false, default: "0.0.0.0" }],
			]);

			syncEnvFile(envPath, flatKeys);

			const content = readFileSync(envPath, "utf-8");
			expect(content).toContain("server.port=3000");
			expect(content).toContain("server.host=0.0.0.0");
		});
	});

	it("adds missing keys without defaults as empty", () => {
		withTempDir((dir) => {
			const envPath = join(dir, ".env");
			const flatKeys = new Map([
				["clerk.secretKey", { type: "string", required: true }],
				["database.url", { type: "string", required: true }],
			]);

			syncEnvFile(envPath, flatKeys);

			const content = readFileSync(envPath, "utf-8");
			expect(content).toContain("clerk.secretKey=");
			expect(content).toContain("database.url=");
		});
	});

	it("preserves existing keys and values", () => {
		withTempDir((dir) => {
			const envPath = join(dir, ".env");
			writeFileSync(envPath, "server.port=5000\n", "utf-8");
			const flatKeys = new Map([
				["server.port", { type: "number", required: true, default: 3000 }],
				["database.url", { type: "string", required: true }],
			]);

			syncEnvFile(envPath, flatKeys);

			const content = readFileSync(envPath, "utf-8");
			expect(content).toContain("server.port=5000");
			expect(content).toContain("database.url=");
		});
	});

	it("preserves comments in existing env file", () => {
		withTempDir((dir) => {
			const envPath = join(dir, ".env");
			writeFileSync(envPath, "# This is a comment\nserver.port=5000\n", "utf-8");
			const flatKeys = new Map([
				["server.port", { type: "number", required: true, default: 3000 }],
				["server.host", { type: "string", required: false, default: "0.0.0.0" }],
			]);

			syncEnvFile(envPath, flatKeys);

			const content = readFileSync(envPath, "utf-8");
			expect(content).toContain("# This is a comment");
			expect(content).toContain("server.port=5000");
			expect(content).toContain("server.host=0.0.0.0");
		});
	});

	it("does nothing when all keys already present", () => {
		withTempDir((dir) => {
			const envPath = join(dir, ".env");
			writeFileSync(envPath, "server.port=3000\nserver.host=0.0.0.0\n", "utf-8");
			const flatKeys = new Map([
				["server.port", { type: "number", required: true, default: 3000 }],
				["server.host", { type: "string", required: false, default: "0.0.0.0" }],
			]);

			syncEnvFile(envPath, flatKeys);

			const content = readFileSync(envPath, "utf-8");
			expect(content).toBe("server.port=3000\nserver.host=0.0.0.0\n");
		});
	});
});
