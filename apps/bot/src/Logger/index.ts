import type { LogLevel } from "./types.js";

const LEVEL_PREFIX: Record<LogLevel, string> = {
	debug: "[debug]",
	info: "[info]",
	warn: "[warn]",
	error: "[error]",
};

const LEVEL_WEIGHT: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};

function shouldLog(
	messageLevel: LogLevel,
	minLevel: LogLevel,
): boolean {
	return LEVEL_WEIGHT[messageLevel] >= LEVEL_WEIGHT[minLevel];
}

function formatTimestamp(): string {
	return new Date().toISOString();
}

export class Logger {
	private readonly label: string;
	private minLevel: LogLevel;

	constructor(label: string, minLevel: LogLevel = "info") {
		this.label = label;
		this.minLevel = minLevel;
	}

	setMinLevel(level: LogLevel): void {
		this.minLevel = level;
	}

	private log(level: LogLevel, message: string, ...args: unknown[]): void {
		if (!shouldLog(level, this.minLevel)) return;

		const ts = formatTimestamp();
		const prefix = LEVEL_PREFIX[level];
		const tag = `[${this.label}]`;

		if (args.length > 0) {
			if (level === "error") {
				console.error(ts, prefix, tag, message, ...args);
			} else if (level === "warn") {
				console.warn(ts, prefix, tag, message, ...args);
			} else {
				console.log(ts, prefix, tag, message, ...args);
			}
		} else {
			const line = `${ts} ${prefix} ${tag} ${message}`;
			if (level === "error") {
				console.error(line);
			} else if (level === "warn") {
				console.warn(line);
			} else {
				console.log(line);
			}
		}
	}

	debug(message: string, ...args: unknown[]): void {
		this.log("debug", message, ...args);
	}

	info(message: string, ...args: unknown[]): void {
		this.log("info", message, ...args);
	}

	warn(message: string, ...args: unknown[]): void {
		this.log("warn", message, ...args);
	}

	error(message: string, ...args: unknown[]): void {
		this.log("error", message, ...args);
	}
}
