import { strict as assert } from "node:assert";

import {
	assertSessionStatus,
	createPhase1Harness,
	createPlayer,
	requireOk,
} from "./test-helpers.js";

// 1. "failed" end reason
const failHarness = createPhase1Harness(
	"session-end-failed",
);
const { clock, idGenerator, kernel } = failHarness;

const created = requireOk(
	await kernel.sessionManager.createSession({}),
);
const sessionId = created.value.id;

const p1 = createPlayer(idGenerator, "x", "X", clock.now());
const p2 = createPlayer(idGenerator, "y", "Y", clock.now());

requireOk(
	await kernel.sessionManager.joinSession({
		player: p1,
		sessionId,
	}),
);
requireOk(
	await kernel.sessionManager.joinSession({
		player: p2,
		sessionId,
	}),
);
requireOk(
	await kernel.sessionManager.startSession({
		minimumPlayers: 2,
		sessionId,
	}),
);

const ended = requireOk(
	await kernel.sessionManager.endSession({
		reason: "failed",
		sessionId,
	}),
);

assertSessionStatus(ended.value, "ended");
assert.equal(ended.value.state.status, "ended");
assert.equal(ended.value.state.endReason, "failed");
assert.equal(ended.value.state.players.size, 2);
assert.equal(
	failHarness.events.some(
		(e) => e.type === "session.ended",
	),
	true,
);

console.log("session-end-reasons.check.ts: failed passed");

// 2. "shutdown" end reason
const shutdownHarness = createPhase1Harness(
	"session-end-shutdown",
);
const { idGenerator: _id2, kernel: k2 } = shutdownHarness;

const created2 = requireOk(
	await k2.sessionManager.createSession({}),
);
const sid2 = created2.value.id;

requireOk(
	await k2.sessionManager.endSession({
		reason: "shutdown",
		sessionId: sid2,
	}),
);

const afterShutdown = k2.stateManager.getSnapshot(sid2);
assertSessionStatus(afterShutdown, "ended");
assert.equal(afterShutdown.state.endReason, "shutdown");

console.log(
	"session-end-reasons.check.ts: shutdown passed",
);
