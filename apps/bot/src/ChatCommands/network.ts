import dns from "node:dns/promises";

import ipaddrModule from "ipaddr.js";

const ipaddrParse = ipaddrModule.parse;
const ipaddrIsValid = ipaddrModule.isValid;

const BLOCKED_RANGES = new Set([
	"loopback",
	"private",
	"linkLocal",
	"uniqueLocal",
	"multicast",
	"reserved",
	"broadcast",
	"carrierGradeNat",
	"ietfProtocol",
]);

const MAX_REDIRECTS = 10;
const DEFAULT_NETWORK_TIMEOUT = 10_000;

export interface NetworkSafetyResult {
	readonly safe: boolean;
	readonly reason?: string;
	readonly addresses?: readonly string[];
}

export interface SafeFetchOptions {
	readonly method?: string;
	readonly timeout?: number;
	readonly maxRedirects?: number;
	readonly headers?: Record<string, string>;
}

export interface SafeFetchResult {
	readonly status: number;
	readonly statusText: string;
	readonly headers: Record<string, string>;
	readonly finalUrl: string;
	readonly redirectChain: readonly string[];
	readonly durationMs: number;
	readonly body?: string;
}

export function isPrivateIp(ip: string): boolean {
	if (!ipaddrIsValid(ip)) {
		return true;
	}

	const parsed = ipaddrParse(ip);
	const range = parsed.range();

	return BLOCKED_RANGES.has(range);
}

export async function resolveAndCheck(
	hostname: string,
): Promise<NetworkSafetyResult> {
	try {
		const records = await dns.lookup(hostname, {
			all: true,
		});

		for (const record of records) {
			if (isPrivateIp(record.address)) {
				return {
					safe: false,
					reason: `Resolved address ${record.address} is a private IP.`,
				};
			}
		}

		return {
			safe: true,
			addresses: records.map((r) => r.address),
		};
	} catch (error) {
		return {
			safe: false,
			reason: `DNS resolution failed: ${error instanceof Error ? error.message : "unknown error"}`,
		};
	}
}

export function extractHostname(
	input: string,
): string | undefined {
	try {
		if (
			input.startsWith("http://") ||
			input.startsWith("https://")
		) {
			return new URL(input).hostname;
		}

		if (input.includes("/") || input.includes(":")) {
			return new URL(`https://${input}`).hostname;
		}

		return input;
	} catch {
		return undefined;
	}
}

export async function safeFetch(
	url: string,
	options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
	const timeout =
		options.timeout ?? DEFAULT_NETWORK_TIMEOUT;
	const maxRedirects =
		options.maxRedirects ?? MAX_REDIRECTS;

	const parsed = new URL(url);

	if (
		parsed.protocol !== "http:" &&
		parsed.protocol !== "https:"
	) {
		throw new Error(
			"Only http: and https: protocols are allowed.",
		);
	}

	const safety = await resolveAndCheck(parsed.hostname);

	if (!safety.safe) {
		throw new Error(
			safety.reason ??
				"Hostname resolved to a private or blocked IP.",
		);
	}

	let currentUrl = url;
	const redirectChain: string[] = [];
	const startedAt = performance.now();

	for (
		let redirectCount = 0;
		redirectCount <= maxRedirects;
		redirectCount++
	) {
		const controller = new AbortController();
		const timer = setTimeout(
			() => controller.abort(),
			timeout,
		);

		try {
			const response = await fetch(currentUrl, {
				method: options.method ?? "HEAD",
				redirect: "manual",
				signal: controller.signal,
				headers: {
					"User-Agent": "JordanDevsBot/1.0",
					...options.headers,
				},
			});

			clearTimeout(timer);

			if (
				response.status >= 300 &&
				response.status < 400 &&
				response.headers.get("location")
			) {
				const location =
					response.headers.get("location") ?? "";
				const nextUrl = new URL(
					location,
					currentUrl,
				).toString();

				const nextSafety = await resolveAndCheck(
					new URL(nextUrl).hostname,
				);

				if (!nextSafety.safe) {
					throw new Error(
						nextSafety.reason ??
							"Redirect target resolved to a blocked address.",
					);
				}

				redirectChain.push(currentUrl);
				currentUrl = nextUrl;
				continue;
			}

			const durationMs = performance.now() - startedAt;
			const responseHeaders: Record<string, string> = {};

			response.headers.forEach((value, key) => {
				responseHeaders[key] = value;
			});

			let body: string | undefined;

			if (options.method === "GET") {
				body = await readBodyWithLimit(response, 10_000);
			}

			return {
				durationMs,
				finalUrl: currentUrl,
				headers: responseHeaders,
				redirectChain,
				status: response.status,
				statusText: response.statusText,
				body: body ?? "",
			};
		} catch (error) {
			clearTimeout(timer);
			throw error;
		}
	}

	throw new Error(
		`Too many redirects (max: ${maxRedirects}).`,
	);
}

async function readBodyWithLimit(
	response: Response,
	limit: number,
): Promise<string> {
	const contentLength = response.headers.get("content-length");
	if (contentLength && Number(contentLength) > limit) {
		return "";
	}

	if (!response.body) {
		return "";
	}

	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	const chunks: string[] = [];
	let totalBytes = 0;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			totalBytes += value.length;
			if (totalBytes > limit) {
				chunks.push(
					decoder.decode(
						value.slice(
							0,
							limit - (totalBytes - value.length),
						),
						{ stream: true },
					),
				);
				break;
			}

			chunks.push(
				decoder.decode(value, { stream: true }),
			);
		}
	} finally {
		reader.releaseLock();
	}

	return chunks.join("");
}

export function formatNetworkErrorMessage(
	error: unknown,
): string {
	if (error instanceof Error) {
		const message = error.message;

		if (
			message.includes("abort") ||
			message.includes("timeout") ||
			message.includes("timed out")
		) {
			return "Network request timed out. The server may be down or unreachable.";
		}

		if (message.includes("ENOTFOUND")) {
			return "Could not resolve the hostname. The domain may not exist.";
		}

		if (
			message.includes("ECONNREFUSED") ||
			message.includes("connection refused")
		) {
			return "Connection refused. The server may be down or blocking requests.";
		}

		if (
			message.includes("ECONNRESET") ||
			message.includes("connection reset")
		) {
			return "Connection was reset. The server may have closed the connection.";
		}

		if (
			message.includes("ETIMEDOUT") ||
			message.includes("connection timed out")
		) {
			return "Connection timed out. The server may be unreachable.";
		}

		if (
			message.includes("private IP") ||
			message.includes("blocked")
		) {
			return message;
		}

		if (message.includes("protocol")) {
			return message;
		}

		return `Network error: ${message}`;
	}

	return "An unexpected network error occurred.";
}
