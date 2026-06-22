import assert from "node:assert/strict";

import {
	base64Schema,
	discordSnowflakeSchema,
	domainSchema,
	hashAlgorithmSchema,
	httpUrlSchema,
	integerSchema,
	modeSchema,
	optionalTextInputSchema,
	portSchema,
	safeCommandStringSchema,
	textInputSchema,
	urlSchema,
} from "./validation.js";

assert.equal(
	textInputSchema().safeParse("").success,
	false,
);
assert.equal(
	textInputSchema().safeParse("hello").success,
	true,
);
assert.equal(
	textInputSchema(5).safeParse("toolong").success,
	false,
);
assert.equal(
	textInputSchema(5).safeParse("abc").success,
	true,
);

assert.equal(
	optionalTextInputSchema().safeParse(undefined).success,
	true,
);
assert.equal(
	optionalTextInputSchema().safeParse("").success,
	true,
);
assert.equal(
	optionalTextInputSchema(5).safeParse("hello").success,
	true,
);
assert.equal(
	optionalTextInputSchema(5).safeParse("toolong").success,
	false,
);

const modes = modeSchema(
	["encode", "decode", "format"] as const,
	"encode",
);
assert.equal(modes.safeParse("encode").success, true);
assert.equal(modes.safeParse("decode").success, true);
assert.equal(modes.safeParse("format").success, true);
assert.equal(modes.safeParse("invalid").success, false);

const parsedMode = modeSchema(
	["a", "b"] as const,
	"a",
).safeParse(undefined);
assert.ok(parsedMode.success);
assert.equal(parsedMode.data, "a");

assert.equal(
	urlSchema().safeParse("not-a-url").success,
	false,
);
assert.equal(
	urlSchema().safeParse("https://example.com").success,
	true,
);
assert.equal(
	urlSchema().safeParse("http://example.com").success,
	true,
);

assert.equal(
	httpUrlSchema().safeParse("ftp://example.com").success,
	false,
);
assert.equal(
	httpUrlSchema().safeParse("https://example.com").success,
	true,
);
assert.equal(
	httpUrlSchema().safeParse("http://example.com").success,
	true,
);

assert.equal(domainSchema().safeParse("").success, false);
assert.equal(
	domainSchema().safeParse("not-a-domain").success,
	false,
);
assert.equal(
	domainSchema().safeParse("example.com").success,
	true,
);
assert.equal(
	domainSchema().safeParse("sub.example.co.uk").success,
	true,
);

assert.equal(
	discordSnowflakeSchema().safeParse("not-a-snowflake")
		.success,
	false,
);
assert.equal(
	discordSnowflakeSchema().safeParse("123").success,
	false,
);

const sf = discordSnowflakeSchema().safeParse(
	"123456789012345678",
);
assert.ok(sf.success);

assert.equal(base64Schema().safeParse("").success, false);
assert.equal(
	base64Schema().safeParse("not-base64!!!").success,
	false,
);
assert.equal(
	base64Schema().safeParse("SGVsbG8=").success,
	true,
);
assert.equal(
	base64Schema().safeParse("SGVsbG8gV29ybGQ=").success,
	true,
);

assert.equal(
	hashAlgorithmSchema().safeParse("md5").success,
	true,
);
assert.equal(
	hashAlgorithmSchema().safeParse("sha1").success,
	true,
);
assert.equal(
	hashAlgorithmSchema().safeParse("sha256").success,
	true,
);
assert.equal(
	hashAlgorithmSchema().safeParse("sha512").success,
	true,
);
assert.equal(
	hashAlgorithmSchema().safeParse("sha3").success,
	false,
);

const defaultHash =
	hashAlgorithmSchema().safeParse(undefined);
assert.ok(defaultHash.success);
assert.equal(defaultHash.data, "sha256");

assert.equal(
	integerSchema(1, 10).safeParse(0).success,
	false,
);
assert.equal(
	integerSchema(1, 10).safeParse(5).success,
	true,
);
assert.equal(
	integerSchema(1, 10).safeParse(11).success,
	false,
);
assert.equal(
	integerSchema(1, 10).safeParse(3.5).success,
	false,
);

assert.equal(
	safeCommandStringSchema().safeParse("hello world")
		.success,
	true,
);
assert.equal(
	safeCommandStringSchema().safeParse("hello-world.test")
		.success,
	true,
);
assert.equal(
	safeCommandStringSchema().safeParse("rm -rf /").success,
	false,
);
assert.equal(
	safeCommandStringSchema().safeParse("$(cat /etc/passwd)")
		.success,
	false,
);

assert.equal(portSchema().safeParse(0).success, false);
assert.equal(portSchema().safeParse(80).success, true);
assert.equal(portSchema().safeParse(443).success, true);
assert.equal(portSchema().safeParse(65535).success, true);
assert.equal(portSchema().safeParse(65536).success, false);

console.log("validation.test.ts passed");
