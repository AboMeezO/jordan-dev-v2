import assert from "node:assert/strict";

import {
  ansiShellOutput,
  errorOutput,
  escapeMentions,
  formatErrorBoundary,
  safeCodeBlock,
  safeInline,
  safeOutput,
  unknownErrorOutput,
} from "./output.js";

assert.equal(escapeMentions("hello world"), "hello world");
assert.equal(escapeMentions("@everyone"), "@\u200beveryone");
assert.equal(escapeMentions("@here"), "@\u200bhere");
assert.equal(escapeMentions("<@123456789012345678>"), "<@\u200b123456789012345678>");
assert.equal(escapeMentions("<@!123456789012345678>"), "<@\u200b123456789012345678>");
assert.equal(escapeMentions("<@&123456789012345678>"), "<@&\u200b123456789012345678>");
assert.equal(escapeMentions("<#123456789012345678>"), "<#\u200b123456789012345678>");

const longStr = "x".repeat(2000);
assert.equal(safeInline(longStr).length, 1900);

const normal = safeInline("hello");
assert.equal(normal.length, 5);
assert.equal(normal, "hello");

const codeBlock = safeCodeBlock("test", "json");
assert.ok(codeBlock.startsWith("```json\n"));
assert.ok(codeBlock.endsWith("\n```"));
assert.ok(codeBlock.includes("test"));

const ansi = ansiShellOutput(["line1", "line2"]);
assert.ok(ansi.startsWith("```ansi\n"));
assert.ok(ansi.endsWith("\n```"));

const smallOutput = safeOutput("hello world");
assert.ok("content" in smallOutput);
assert.equal(smallOutput.content, "hello world");

const bigStr = "A".repeat(2000);
const bigOutput = safeOutput(bigStr);
assert.ok("attachment" in bigOutput);

assert.equal(errorOutput("error message"), "error message");
assert.equal(
  errorOutput("@everyone error"),
  "@\u200beveryone error",
);

assert.equal(unknownErrorOutput(), "An unexpected error occurred. Please try again later.");

assert.equal(
  formatErrorBoundary("user error"),
  "user error",
);
assert.equal(
  formatErrorBoundary("stack trace detected"),
  "An unexpected error occurred. Please try again later.",
);
assert.equal(
  formatErrorBoundary(new Error("connection failed")),
  "connection failed",
);

console.log("output.test.ts passed");
