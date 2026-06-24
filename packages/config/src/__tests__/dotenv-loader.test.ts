import { describe, expect, it } from "vitest";

import { envToNestedObject, parseEnvFile } from "../dotenv-loader.js";

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
