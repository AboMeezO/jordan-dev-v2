import { describe, expect, it } from "vitest";

import { findMissingKeys, mergeDefaults } from "../auto-sync.js";

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
