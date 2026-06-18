import { botConfig } from "#Config";
import { safeFetch } from "#ChatCommands";
import type { SafeFetchResult } from "#ChatCommands";

export interface ScanResult {
	readonly url: string;
	readonly scanner: "virustotal" | "local-heuristic";
	readonly safe: boolean | "unknown";
	readonly positives?: number;
	readonly total?: number;
	readonly scanDetails: string[];
	readonly httpResult?: SafeFetchResult | undefined;
	readonly cached: boolean;
}

interface CacheEntry {
	readonly result: ScanResult;
	readonly expiresAt: number;
}

const scanCache = new Map<string, CacheEntry>();

function cacheKey(url: string, scanner: string): string {
	return `${scanner}:${url}`;
}

function getCached(url: string, scanner: string): ScanResult | undefined {
	const key = cacheKey(url, scanner);
	const entry = scanCache.get(key);
	if (entry && entry.expiresAt > Date.now()) {
		return entry.result;
	}
	scanCache.delete(key);
	return undefined;
}

function setCache(url: string, scanner: string, result: ScanResult): void {
	const key = cacheKey(url, scanner);
	scanCache.set(key, {
		result,
		expiresAt: Date.now() + botConfig.scanning.cacheTtlMs,
	});
}

const SUSPICIOUS_TLD_SET = new Set(
	botConfig.suspiciousTlds.map((t) => t.toLowerCase()),
);

function checkSuspiciousTld(hostname: string): string | undefined {
	const parts = hostname.split(".");
	if (parts.length < 2) return undefined;
	const tld = parts[parts.length - 1]?.toLowerCase();
	if (tld && SUSPICIOUS_TLD_SET.has(tld)) {
		return tld;
	}
	return undefined;
}

function checkHttpsEnforced(url: string): boolean {
	return url.startsWith("https://");
}

export async function scanUrl(
	rawUrl: string,
): Promise<ScanResult> {
	const normalized = rawUrl.trim();

	const vtKey = botConfig.scanning.virustotalApiKey;

	if (vtKey) {
		const cached = getCached(normalized, "virustotal");
		if (cached) return { ...cached, cached: true };

		try {
			const vtResult = await scanWithVirusTotal(normalized, vtKey);
			if (vtResult) {
				setCache(normalized, "virustotal", vtResult);
				return vtResult;
			}
		} catch {
			// Fall through to local heuristic
		}
	}

	const cached = getCached(normalized, "local-heuristic");
	if (cached) return { ...cached, cached: true };

	const result = await scanWithLocalHeuristics(normalized);
	setCache(normalized, "local-heuristic", result);
	return result;
}

async function scanWithVirusTotal(
	url: string,
	apiKey: string,
): Promise<ScanResult | undefined> {
	const encodeUrl = (u: string) =>
		Buffer.from(u).toString("base64url");

	const encodedUrl = encodeUrl(url);

	const submitResponse = await fetch(
		`https://www.virustotal.com/api/v3/urls`,
		{
			method: "POST",
			headers: {
				"x-apikey": apiKey,
				"content-type": "application/x-www-form-urlencoded",
			},
			body: `url=${encodeURIComponent(url)}`,
			signal: AbortSignal.timeout(botConfig.scanning.timeoutMs),
		},
	);

	if (!submitResponse.ok) {
		throw new Error(`VirusTotal submit failed: ${submitResponse.status}`);
	}

	const submitJson = await submitResponse.json() as {
		data?: { id?: string };
	};

	const analysisId = submitJson.data?.id;
	if (!analysisId) {
		throw new Error("VirusTotal: no analysis ID returned");
	}

	await new Promise((r) => setTimeout(r, 3000));

	const analysisResponse = await fetch(
		`https://www.virustotal.com/api/v3/analyses/${analysisId}`,
		{
			headers: { "x-apikey": apiKey },
			signal: AbortSignal.timeout(botConfig.scanning.timeoutMs),
		},
	);

	if (!analysisResponse.ok) {
		throw new Error(`VirusTotal analysis failed: ${analysisResponse.status}`);
	}

	const analysisJson = await analysisResponse.json() as {
		data?: {
			attributes?: {
				status?: string;
				stats?: {
					malicious?: number;
					suspicious?: number;
					harmless?: number;
					undetected?: number;
					total?: number;
				};
			};
		};
	};

	const attributes = analysisJson.data?.attributes;
	const stats = attributes?.stats;

	if (!stats) {
		throw new Error("VirusTotal: no stats in analysis response");
	}

	const malicious = stats.malicious ?? 0;
	const total = stats.total ?? 0;

	const details: string[] = [
		`virustotal_status=${attributes?.status ?? "completed"}`,
		`malicious=${malicious}`,
		`suspicious=${stats.suspicious ?? 0}`,
		`harmless=${stats.harmless ?? 0}`,
		`undetected=${stats.undetected ?? 0}`,
	];

	return {
		url,
		scanner: "virustotal",
		safe: malicious === 0,
		positives: malicious,
		total,
		scanDetails: details,
		cached: false,
	};
}

async function scanWithLocalHeuristics(
	url: string,
): Promise<ScanResult> {
	const details: string[] = [];
	let httpResult: SafeFetchResult | undefined;
	let safeDetermination: boolean | "unknown" = "unknown";

	try {
		const parsed = new URL(url);

		const hostname = parsed.hostname;
		const httpsEnforced = checkHttpsEnforced(url);

		details.push(`protocol=${parsed.protocol.replace(":", "")}`);

		if (!httpsEnforced) {
			details.push("warning=no_https");
		}

		const suspiciousTld = checkSuspiciousTld(hostname);
		if (suspiciousTld) {
			details.push(`warning=suspicious_tld=${suspiciousTld}`);
		}

		const response = await safeFetch(url);
		httpResult = response;

		details.push(`status=${response.status}`);
		details.push(`status_text=${response.statusText || "OK"}`);
		details.push(`timing=${response.durationMs.toFixed(0)}ms`);
		details.push(`content_type=${response.headers["content-type"] ?? "(unknown)"}`);
		details.push(`server=${response.headers.server ?? "(unknown)"}`);

		if (response.finalUrl !== url) {
			details.push(`redirect_chain=${response.redirectChain.concat(response.finalUrl).join(" -> ")}`);
		}

		if (response.headers["strict-transport-security"]) {
			details.push("hsts_present=true");
		}

		if (response.headers["x-frame-options"]) {
			details.push(`x_frame_options=${response.headers["x-frame-options"]}`);
		}

		if (response.status >= 400) {
			safeDetermination = false;
		} else if (suspiciousTld) {
			safeDetermination = "unknown";
		} else {
			safeDetermination = true;
		}
	} catch (error) {
		const err = error as Error;
		const msg = err.message;

		if (msg.includes("blocked") || msg.includes("private") || msg.includes("loopback")) {
			details.push("blocked=private_or_internal_network");
			safeDetermination = false;
		} else if (msg.includes("ENOTFOUND")) {
			details.push("error=domain_not_found");
			safeDetermination = false;
		} else if (msg.includes("timeout")) {
			details.push("error=timeout");
			safeDetermination = "unknown";
		} else if (msg.includes("certificate")) {
			details.push("error=ssl_certificate_error");
			safeDetermination = false;
		} else {
			details.push(`error=${msg.slice(0, 200)}`);
			safeDetermination = "unknown";
		}
	}

	return {
		url,
		scanner: "local-heuristic",
		safe: safeDetermination,
		scanDetails: details,
		httpResult,
		cached: false,
	};
}
