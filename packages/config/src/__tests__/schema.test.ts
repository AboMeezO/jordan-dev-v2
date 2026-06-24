import { describe, expect, it } from "vitest";

import { compileSchema } from "../schema.js";

const sampleYaml = `
server:
  port:
    type: number
    default: 3000
    min: 1
    max: 65535
  host:
    type: string
    default: "0.0.0.0"
database:
  url:
    type: string
    description: Database connection URL
  password:
    type: string
    optional: true
`;

import { writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function withTempDir(fn: (dir: string) => void): void {
	const dir = join(tmpdir(), `jd-config-test-${Date.now()}`);
	mkdirSync(dir, { recursive: true });
	fn(dir);
}

describe("compileSchema", () => {
	it("compiles schema with defaults and validation rules", () => {
		withTempDir((dir) => {
			const schemaPath = join(dir, "schema.yaml");
			writeFileSync(schemaPath, sampleYaml, "utf-8");

			const compiled = compileSchema(schemaPath);

			expect(compiled.defaults).toEqual({
				server: { port: 3000, host: "0.0.0.0" },
			});

			expect(compiled.flatKeys.get("server.port")).toEqual({
				type: "number",
				required: false,
				default: 3000,
			});

			expect(compiled.flatKeys.get("server.host")).toEqual({
				type: "string",
				required: false,
				default: "0.0.0.0",
			});

			expect(compiled.flatKeys.get("database.url")).toEqual({
				type: "string",
				required: true,
				default: undefined,
			});

			expect(compiled.flatKeys.get("database.password")).toEqual({
				type: "string",
				required: false,
				default: undefined,
			});
		});
	});

	it("validates config against schema", () => {
		withTempDir((dir) => {
			const schemaPath = join(dir, "schema.yaml");
			writeFileSync(schemaPath, sampleYaml, "utf-8");

			const compiled = compileSchema(schemaPath);

			const validConfig = {
				server: { port: 4000, host: "localhost" },
				database: { url: "postgres://localhost/db" },
			};

			const result = compiled.schema.safeParse(validConfig);
			expect(result.success).toBe(true);

			const invalidConfig = {
				server: { port: -1, host: "localhost" },
			};

			const invalidResult = compiled.schema.safeParse(invalidConfig);
			expect(invalidResult.success).toBe(false);
		});
	});
});
