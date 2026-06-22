import assert from "node:assert/strict";

import { formatDuration } from "./format.js";

assert.equal(formatDuration(120), "2m 0s");
assert.equal(formatDuration(90), "1m 30s");
assert.equal(formatDuration(0), "0s");
assert.equal(formatDuration(30), "30s");

console.log("format.check.ts passed");
