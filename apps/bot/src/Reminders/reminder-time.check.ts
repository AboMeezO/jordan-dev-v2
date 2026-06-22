import { strict as assert } from "node:assert";

import { parseReminderTime } from "./reminder-time.js";

const now = new Date("2026-06-14T10:00:00.000Z");

assert.equal(
	parseReminderTime("10m", now)?.date.toISOString(),
	"2026-06-14T10:10:00.000Z",
);

assert.equal(
	parseReminderTime(
		"after 2 hours",
		now,
	)?.date.toISOString(),
	"2026-06-14T12:00:00.000Z",
);

assert.equal(
	parseReminderTime("9d 12h", now)?.date.toISOString(),
	"2026-06-23T22:00:00.000Z",
);

assert.equal(
	parseReminderTime(
		"in 1w 2d 12h 30m",
		now,
	)?.date.toISOString(),
	"2026-06-23T22:30:00.000Z",
);

assert.equal(
	parseReminderTime(
		"2026-06-15T09:30:00.000Z",
		now,
	)?.date.toISOString(),
	"2026-06-15T09:30:00.000Z",
);

const clockTime = parseReminderTime("09:30", now)?.date;
assert.equal(clockTime?.getDate(), 15);
assert.equal(clockTime?.getHours(), 9);
assert.equal(clockTime?.getMinutes(), 30);

assert.equal(
	parseReminderTime("2026-06-13T09:30:00.000Z", now),
	null,
);

console.log("reminder-time tests passed");
