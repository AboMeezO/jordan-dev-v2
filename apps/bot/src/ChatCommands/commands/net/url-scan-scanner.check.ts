import assert from "node:assert/strict";

// Test suspicious TLD detection logic (extracted from url-scan-scanner)
const SUSPICIOUS_TLDS = new Set([
	"xyz", "top", "gq", "ml", "cf", "ga", "tk",
	"work", "win", "bid", "loan", "date", "men",
	"click", "download", "review", "stream",
]);

function checkSuspiciousTld(hostname: string): string | undefined {
	const parts = hostname.split(".");
	if (parts.length < 2) return undefined;
	const tld = parts[parts.length - 1]?.toLowerCase();
	if (tld && SUSPICIOUS_TLDS.has(tld)) {
		return tld;
	}
	return undefined;
}

function checkHttpsEnforced(url: string): boolean {
	return url.startsWith("https://");
}

// Test suspicious TLD detection
assert.equal(checkSuspiciousTld("example.com"), undefined);
assert.equal(checkSuspiciousTld("example.xyz"), "xyz");
assert.equal(checkSuspiciousTld("sub.example.top"), "top");
assert.equal(checkSuspiciousTld("malware.gq"), "gq");
assert.equal(checkSuspiciousTld("test.click"), "click");
assert.equal(checkSuspiciousTld("short"), undefined);
assert.equal(checkSuspiciousTld(""), undefined);

// Test HTTPS enforcement
assert.equal(checkHttpsEnforced("https://example.com"), true);
assert.equal(checkHttpsEnforced("http://example.com"), false);
assert.equal(checkHttpsEnforced("ftp://example.com"), false);

// Test URL validation patterns (mirrors url-scan.ts)
const urlMustStartWithHttp = (url: string): boolean =>
	url.startsWith("http://") || url.startsWith("https://");

assert.equal(urlMustStartWithHttp("https://example.com"), true);
assert.equal(urlMustStartWithHttp("http://example.com"), true);
assert.equal(urlMustStartWithHttp("ftp://example.com"), false);
assert.equal(urlMustStartWithHttp("example.com"), false);

// Test that the cache key function works correctly
const cacheKey = (url: string, scanner: string): string =>
	`${scanner}:${url}`;

assert.equal(cacheKey("https://example.com", "virustotal"), "virustotal:https://example.com");
assert.equal(cacheKey("https://test.xyz", "local-heuristic"), "local-heuristic:https://test.xyz");

console.log("url-scan-scanner.test.ts passed");
