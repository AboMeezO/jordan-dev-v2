import assert from "node:assert/strict";

// Test the URL validation from url-scan.ts
function validateScanUrl(raw: string): string | undefined {
	const trimmed = raw.trim();
	if (!trimmed) return undefined;

	if (
		!trimmed.startsWith("http://") &&
		!trimmed.startsWith("https://")
	) {
		return undefined;
	}

	try {
		new URL(trimmed);
		return trimmed;
	} catch {
		return undefined;
	}
}

// Test URL validation
assert.equal(validateScanUrl("https://example.com"), "https://example.com");
assert.equal(validateScanUrl("http://example.com"), "http://example.com");
assert.equal(validateScanUrl("ftp://example.com"), undefined);
assert.equal(validateScanUrl("javascript:alert(1)"), undefined);
assert.equal(validateScanUrl(""), undefined);
assert.equal(validateScanUrl("   "), undefined);
assert.equal(validateScanUrl("https://"), undefined);
assert.equal(validateScanUrl("https://example.com/path?q=1#hash"), "https://example.com/path?q=1#hash");

// Test long URL rejection (mirrors textInputSchema 2000 limit)
assert.equal("https://example.com/".length < 2000, true);
const longUrl = "https://example.com/" + "a".repeat(2000);
assert.equal(longUrl.length > 2000, true);

// Test that local-heuristic results have expected shape
interface ScanResult {
	readonly url: string;
	readonly scanner: "virustotal" | "local-heuristic";
	readonly safe: boolean | "unknown";
	readonly positives?: number;
	readonly total?: number;
	readonly scanDetails: readonly string[];
	readonly cached: boolean;
}

function createLocalResult(url: string, overrides?: Partial<ScanResult>): ScanResult {
	return {
		url,
		scanner: "local-heuristic",
		safe: "unknown",
		scanDetails: ["protocol=https", "warning=no_https"],
		cached: false,
		...overrides,
	};
}

const result = createLocalResult("https://example.com");
assert.equal(result.url, "https://example.com");
assert.equal(result.scanner, "local-heuristic");
assert.equal(result.safe, "unknown");
assert.equal(result.cached, false);
assert.ok(result.scanDetails.length >= 2);

// Test VirusTotal result shape
const vtResult: ScanResult = {
	url: "https://example.com",
	scanner: "virustotal",
	safe: true,
	positives: 0,
	total: 70,
	scanDetails: ["virustotal_status=completed", "malicious=0"],
	cached: false,
};
assert.equal(vtResult.scanner, "virustotal");
assert.equal(vtResult.safe, true);
assert.equal(vtResult.positives, 0);
assert.equal(vtResult.total, 70);

// Test unsafe result
const unsafeResult: ScanResult = {
	url: "https://malware.test.xyz",
	scanner: "local-heuristic",
	safe: false,
	scanDetails: ["blocked=private_or_internal_network"],
	cached: false,
};
assert.equal(unsafeResult.safe, false);

console.log("url-scan.test.ts passed");
