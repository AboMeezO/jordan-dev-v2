import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findMissingKeys, mergeDefaults, syncConfigWithSchema } from "../auto-sync.js";

describe("findMissingKeys", () => {
	it("returns empty when all keys present", () => {
		const config = { server: { port: 4000 }, database: { url: "postgres://db" } };
		const defaults = { server: { port: 3000 }, database: { url: "postgres://db" } };
		const missing = findMissingKeys(config, defaults);
		expect(missing).toEqual([]);
	});

	it("finds top-level missing keys (entire section)", () => {
		const config = { server: { port: 4000 } };
		const defaults = { server: { port: 3000 }, database: { url: "postgres://db" } };
		const missing = findMissingKeys(config, defaults);
		expect(missing).toEqual(["database"]);
	});

	it("finds nested missing keys", () => {
		const config = { server: { port: 4000 } };
		const defaults = { server: { port: 3000, host: "0.0.0.0" } };
		const missing = findMissingKeys(config, defaults);
		expect(missing).toEqual(["server.host"]);
	});
});

describe("mergeDefaults", () => {
	it("overwrites with existing config values", () => {
		const config = { server: { port: 4000 } };
		const defaults = { server: { port: 3000, host: "0.0.0.0" } };
		const merged = mergeDefaults(config, defaults);
		expect(merged).toEqual({ server: { port: 4000, host: "0.0.0.0" } });
	});

	it("fills missing keys from defaults", () => {
		const config = { server: { port: 4000 } };
		const defaults = { server: { port: 3000, host: "0.0.0.0" }, database: { url: "postgres://db" } };
		const merged = mergeDefaults(config, defaults);
		expect(merged).toEqual({
			server: { port: 4000, host: "0.0.0.0" },
			database: { url: "postgres://db" },
		});
	});

	it("handles empty config", () => {
		const config = {};
		const defaults = { server: { port: 3000 } };
		const merged = mergeDefaults(config, defaults);
		expect(merged).toEqual({ server: { port: 3000 } });
	});
});

function withTempDir(fn: (dir: string) => void): void {
	const dir = join(tmpdir(), `jd-config-test-${Date.now()}`);
	mkdirSync(dir, { recursive: true });
	fn(dir);
}

describe("syncConfigWithSchema", () => {
	it("adds missing flat keys with defaults to empty config", () => {
		withTempDir((dir) => {
			const configPath = join(dir, "Config.yaml");
			const flatKeys = new Map([
				["server.port", { type: "number", required: true, default: 3000 }],
				["server.host", { type: "string", required: false, default: "0.0.0.0" }],
			]);

			const result = syncConfigWithSchema(configPath, flatKeys);

			expect(result).toEqual({ server: { port: 3000, host: "0.0.0.0" } });
		});
	});

	it("adds missing flat keys without defaults as null", () => {
		withTempDir((dir) => {
			const configPath = join(dir, "Config.yaml");
			const flatKeys = new Map([
				["server.port", { type: "number", required: true, default: 3000 }],
				["database.url", { type: "string", required: true }],
			]);

			const result = syncConfigWithSchema(configPath, flatKeys);

			expect(result).toEqual({ server: { port: 3000 }, database: { url: null } });
		});
	});

	it("preserves existing config values", () => {
		withTempDir((dir) => {
			const configPath = join(dir, "Config.yaml");
			writeFileSync(configPath, "server:\n  port: 5000\n", "utf-8");
			const flatKeys = new Map([
				["server.port", { type: "number", required: true, default: 3000 }],
				["server.host", { type: "string", required: false, default: "0.0.0.0" }],
			]);

			const result = syncConfigWithSchema(configPath, flatKeys);

			expect(result).toEqual({ server: { port: 5000, host: "0.0.0.0" } });
		});
	});

	it("preserves custom keys not in schema", () => {
		withTempDir((dir) => {
			const configPath = join(dir, "Config.yaml");
			writeFileSync(configPath, "myCustomKey: hello\n", "utf-8");
			const flatKeys = new Map([
				["server.port", { type: "number", required: true, default: 3000 }],
			]);

			const result = syncConfigWithSchema(configPath, flatKeys);

			expect(result).toEqual({ myCustomKey: "hello", server: { port: 3000 } });
		});
	});

	it("does nothing when all keys already present", () => {
		withTempDir((dir) => {
			const configPath = join(dir, "Config.yaml");
			writeFileSync(configPath, "server:\n  port: 3000\n  host: 0.0.0.0\n", "utf-8");
			const flatKeys = new Map([
				["server.port", { type: "number", required: true, default: 3000 }],
				["server.host", { type: "string", required: false, default: "0.0.0.0" }],
			]);

			const result = syncConfigWithSchema(configPath, flatKeys);

			expect(result).toEqual({ server: { port: 3000, host: "0.0.0.0" } });
		});
	});
});
