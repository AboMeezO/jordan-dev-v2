const RELATIVE_PATTERN =
	/^(?:in\s+|after\s+)?(?<amount>\d+)\s*(?<unit>s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)$/i;
const RELATIVE_PART_PATTERN =
	/(?<amount>\d+)\s*(?<unit>s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)/gi;
const MAX_FUTURE_MS = 365 * 24 * 60 * 60 * 1000;

const CLOCK_PATTERN =
	/^(?<hour>\d{1,2}):(?<minute>\d{2})(?:\s*(?<period>am|pm))?$/i;

export const UNIT_MS: Readonly<Record<string, number>> = {
	d: 86_400_000,
	day: 86_400_000,
	days: 86_400_000,
	h: 3_600_000,
	hour: 3_600_000,
	hours: 3_600_000,
	hr: 3_600_000,
	hrs: 3_600_000,
	m: 60_000,
	min: 60_000,
	mins: 60_000,
	minute: 60_000,
	minutes: 60_000,
	s: 1000,
	sec: 1000,
	secs: 1000,
	second: 1000,
	seconds: 1000,
	w: 604_800_000,
	week: 604_800_000,
	weeks: 604_800_000,
};

export interface ReminderTimeResult {
	readonly date: Date;
	readonly timestamp: number;
}

export function parseReminderTime(
	input: string,
	now: Date = new Date(),
): ReminderTimeResult | null {
	const value = input.trim();

	if (value.length === 0) {
		return null;
	}

	const relativeTimestamp = parseRelativeTimestamp(
		value,
		now,
	);
	if (relativeTimestamp !== null) {
		return enforceMaxDuration(relativeTimestamp, now);
	}

	const clockTimestamp = parseClockTimestamp(value, now);
	if (clockTimestamp !== null) {
		return enforceMaxDuration(clockTimestamp, now);
	}

	const absolute = new Date(value);
	if (
		Number.isNaN(absolute.getTime()) ||
		absolute.getTime() <= now.getTime()
	) {
		return null;
	}

	return enforceMaxDuration(absolute.getTime(), now);
}

function enforceMaxDuration(
	timestamp: number,
	now: Date,
): ReminderTimeResult | null {
	if (timestamp - now.getTime() > MAX_FUTURE_MS) {
		return null;
	}
	return {
		date: new Date(timestamp),
		timestamp,
	};
}

function parseRelativeTimestamp(
	input: string,
	now: Date,
): number | null {
	const combinedTimestamp = parseCombinedRelativeTimestamp(
		input,
		now,
	);
	if (combinedTimestamp !== null) {
		return combinedTimestamp;
	}

	const match = RELATIVE_PATTERN.exec(input);
	const groups = match?.groups;

	if (!groups) {
		return null;
	}

	if (!groups.amount || !groups.unit) {
		return null;
	}

	const unitMs = UNIT_MS[groups.unit.toLowerCase()];
	const amount = Number(groups.amount);

	if (
		!unitMs ||
		!Number.isSafeInteger(amount) ||
		amount <= 0
	) {
		return null;
	}

	return now.getTime() + amount * unitMs;
}

function parseCombinedRelativeTimestamp(
	input: string,
	now: Date,
): number | null {
	const value = input
		.replace(/^(?:in|after)\s+/i, "")
		.trim();

	if (!/\s/.test(value)) {
		return null;
	}

	let totalMs = 0;
	let consumed = "";

	for (const match of value.matchAll(
		RELATIVE_PART_PATTERN,
	)) {
		const groups = match.groups;

		if (!groups?.amount || !groups.unit) {
			return null;
		}

		const unitMs = UNIT_MS[groups.unit.toLowerCase()];
		const amount = Number(groups.amount);

		if (
			!unitMs ||
			!Number.isSafeInteger(amount) ||
			amount <= 0
		) {
			return null;
		}

		totalMs += amount * unitMs;
		consumed += match[0];
	}

	if (
		totalMs <= 0 ||
		consumed.replace(/\s/g, "") !== value.replace(/\s/g, "")
	) {
		return null;
	}

	return now.getTime() + totalMs;
}

function parseClockTimestamp(
	input: string,
	now: Date,
): number | null {
	const match = CLOCK_PATTERN.exec(input);
	const groups = match?.groups;

	if (!groups) {
		return null;
	}

	const minute = Number(groups.minute);
	const period = groups.period?.toLowerCase();
	let hour = Number(groups.hour);

	if (minute > 59 || hour > (period ? 12 : 23)) {
		return null;
	}

	if (period === "pm" && hour !== 12) {
		hour += 12;
	}

	if (period === "am" && hour === 12) {
		hour = 0;
	}

	const date = new Date(now);
	date.setHours(hour, minute, 0, 0);

	if (date.getTime() <= now.getTime()) {
		date.setDate(date.getDate() + 1);
	}

	return date.getTime();
}
