import assert from "node:assert/strict";

import { parsePrefixReminderArgs } from "./reminder-command.js";

assert.deepEqual(
	parsePrefixReminderArgs(["9d", "12h", "ship", "it"]),
	{
		delivery: "channel",
		message: "ship it",
		time: "9d 12h",
	},
);

assert.deepEqual(
	parsePrefixReminderArgs(["9d 12h", "ship", "it"]),
	{
		delivery: "channel",
		message: "ship it",
		time: "9d 12h",
	},
);

assert.deepEqual(
	parsePrefixReminderArgs([
		"--dm",
		"--time",
		"9d",
		"12h",
		"ship",
	]),
	{
		delivery: "dm",
		message: "ship",
		time: "9d 12h",
	},
);

assert.deepEqual(
	parsePrefixReminderArgs(["--time=9d 12h", "ship"]),
	{
		delivery: "channel",
		message: "ship",
		time: "9d 12h",
	},
);

assert.deepEqual(
	parsePrefixReminderArgs(["after", "2", "hours", "ship"]),
	{
		delivery: "channel",
		message: "ship",
		time: "after 2 hours",
	},
);

console.log("reminder-command tests passed");
