import assert from "node:assert/strict";

import {
  extractHostname,
  formatNetworkErrorMessage,
  isPrivateIp,
} from "./network.js";

assert.equal(isPrivateIp("127.0.0.1"), true);
assert.equal(isPrivateIp("::1"), true);
assert.equal(isPrivateIp("10.0.0.1"), true);
assert.equal(isPrivateIp("172.16.0.1"), true);
assert.equal(isPrivateIp("192.168.0.1"), true);
assert.equal(isPrivateIp("169.254.1.1"), true);
assert.equal(isPrivateIp("fc00::1"), true);
assert.equal(isPrivateIp("224.0.0.1"), true);

assert.equal(isPrivateIp("8.8.8.8"), false);
assert.equal(isPrivateIp("1.1.1.1"), false);
assert.equal(isPrivateIp("93.184.216.34"), false);
assert.equal(isPrivateIp("2001:4860:4860::8888"), false);

assert.equal(isPrivateIp("invalid-ip"), true);

assert.equal(extractHostname("https://example.com/path"), "example.com");
assert.equal(extractHostname("http://sub.example.co.uk:8080/page"), "sub.example.co.uk");
assert.equal(extractHostname("example.com"), "example.com");
assert.equal(extractHostname("example.com/path"), "example.com");
assert.equal(extractHostname(""), "");
assert.equal(extractHostname(":::not-a-url"), undefined);

assert.equal(
  formatNetworkErrorMessage(new Error("abort")),
  "Network request timed out. The server may be down or unreachable.",
);
assert.equal(
  formatNetworkErrorMessage(new Error("timeout")),
  "Network request timed out. The server may be down or unreachable.",
);
assert.equal(
  formatNetworkErrorMessage(new Error("ENOTFOUND")),
  "Could not resolve the hostname. The domain may not exist.",
);
assert.equal(
  formatNetworkErrorMessage(new Error("ECONNREFUSED")),
  "Connection refused. The server may be down or blocking requests.",
);
assert.equal(
  formatNetworkErrorMessage(new Error("ECONNRESET")),
  "Connection was reset. The server may have closed the connection.",
);
assert.equal(
  formatNetworkErrorMessage(new Error("ETIMEDOUT")),
  "Connection timed out. The server may be unreachable.",
);
assert.equal(
  formatNetworkErrorMessage(new Error("private IP detected")),
  "private IP detected",
);
assert.equal(
  formatNetworkErrorMessage(new Error("Only http: and https: protocols are allowed.")),
  "Only http: and https: protocols are allowed.",
);
assert.equal(
  formatNetworkErrorMessage(new Error("generic failure")),
  "Network error: generic failure",
);
assert.equal(
  formatNetworkErrorMessage("string error"),
  "An unexpected network error occurred.",
);

console.log("network.test.ts passed");
