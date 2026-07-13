import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createConfig } from "../create-config.js";

const schemaYaml = `
server:
  port:
    type: number
    default: 3000
  host:
    type: string
    default: "0.0.0.0"
database:
  url:
    type: string
  password:
    type: string
    optional: true
`;

const configYaml = `
server:
  port: 4000
  host: localhost
database:
  url: postgres://localhost/db
`;

function withTempDir(fn: (dir: string) => void): void {
	const dir = join(
		tmpdir(),
		`jd-config-test-${randomUUID()}`,
	);
	mkdirSync(dir, { recursive: true });
	fn(dir);
}

describe("createConfig", () => {
	it("loads schema defaults and merges config.yaml", () => {
		withTempDir((dir) => {
			writeFileSync(
				join(dir, "schema.yaml"),
				schemaYaml,
				"utf-8",
			);
			writeFileSync(
				join(dir, "Config.yaml"),
				configYaml,
				"utf-8",
			);

			const cfg = createConfig({
				schemaPath: join(dir, "schema.yaml"),
				configPath: join(dir, "Config.yaml"),
			});

			expect(cfg.get<number>("server.port")).toBe(4000);
			expect(cfg.get<string>("server.host")).toBe(
				"localhost",
			);
			expect(cfg.get<string>("database.url")).toBe(
				"postgres://localhost/db",
			);
		});
	});

	it("returns defaults when no config.yaml exists", () => {
		withTempDir((dir) => {
			writeFileSync(
				join(dir, "schema.yaml"),
				schemaYaml,
				"utf-8",
			);

			const cfg = createConfig({
				schemaPath: join(dir, "schema.yaml"),
			});

			expect(cfg.get<number>("server.port")).toBe(3000);
			expect(cfg.get<string>("server.host")).toBe(
				"0.0.0.0",
			);
		});
	});

	it("merges env vars with path notation (exact case match)", () => {
		withTempDir((dir) => {
			writeFileSync(
				join(dir, "schema.yaml"),
				schemaYaml,
				"utf-8",
			);
			writeFileSync(
				join(dir, "Config.yaml"),
				configYaml,
				"utf-8",
			);

			const cfg = createConfig({
				schemaPath: join(dir, "schema.yaml"),
				configPath: join(dir, "Config.yaml"),
				env: { "server.port": "5000" },
			});

			expect(cfg.get<number>("server.port")).toBe("5000");
		});
	});

	it("validates config and throws on missing required fields", () => {
		withTempDir((dir) => {
			writeFileSync(
				join(dir, "schema.yaml"),
				schemaYaml,
				"utf-8",
			);

			const cfg = createConfig({
				schemaPath: join(dir, "schema.yaml"),
			});

			expect(() => cfg.validate()).toThrow(
				"Config validation failed",
			);
		});
	});

	it("works in env-only mode (no yaml)", () => {
		const cfg = createConfig({
			env: { TOKEN: "abc123", PREFIX: "!" },
		});

		expect(cfg.get<string>("TOKEN")).toBe("abc123");
		expect(cfg.get<string>("PREFIX")).toBe("!");
	});

	it("getAll returns the full merged config", () => {
		withTempDir((dir) => {
			writeFileSync(
				join(dir, "schema.yaml"),
				schemaYaml,
				"utf-8",
			);

			const cfg = createConfig({
				schemaPath: join(dir, "schema.yaml"),
				env: { "server.port": "5000" },
			});

			const all = cfg.getAll();
			expect(all.server).toBeDefined();
			expect(
				(all.server as Record<string, unknown>).port,
			).toBe("5000");
		});
	});
});
