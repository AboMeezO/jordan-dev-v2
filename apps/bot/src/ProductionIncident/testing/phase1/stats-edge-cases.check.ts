import { strict as assert } from "node:assert";

import {
	assertSessionStatus,
	createPhase1Harness,
	createPlayer,
	requireOk,
} from "./test-helpers.js";

// applyStatDelta clamping: values should not go below 0 or above 100
// infrastructureCost has no upper bound (only floor of 0)
const harness = createPhase1Harness("stats-edge-cases");
const { clock, idGenerator, kernel } = harness;

const created = requireOk(
	await kernel.sessionManager.createSession({}),
);
const sessionId = created.value.id;

const p1 = createPlayer(idGenerator, "a", "A", clock.now());
requireOk(
	await kernel.sessionManager.joinSession({
		player: p1,
		sessionId,
	}),
);

const initialState =
	kernel.stateManager.getSnapshot(sessionId)!;
assert.deepEqual(initialState.stats, {
	developerSanity: 100,
	infrastructureCost: 0,
	serverStability: 100,
	userHappiness: 100,
});

// Large negative delta: clamp to 0
const clampedLow = await kernel.stateManager.applyStatDelta(
	sessionId,
	{
		developerSanity: -999,
		infrastructureCost: -999,
		serverStability: -999,
		userHappiness: -999,
	},
);
assert.equal(clampedLow.value.stats.developerSanity, 0);
assert.equal(clampedLow.value.stats.infrastructureCost, 0);
assert.equal(clampedLow.value.stats.serverStability, 0);
assert.equal(clampedLow.value.stats.userHappiness, 0);

// Large positive delta: developerSanity, serverStability, userHappiness clamp to 100
// infrastructureCost has NO upper bound
const clampedHigh =
	await kernel.stateManager.applyStatDelta(sessionId, {
		developerSanity: 999,
		infrastructureCost: 999,
		serverStability: 999,
		userHappiness: 999,
	});
assert.equal(clampedHigh.value.stats.developerSanity, 100);
assert.equal(
	clampedHigh.value.stats.infrastructureCost,
	999,
);
assert.equal(clampedHigh.value.stats.serverStability, 100);
assert.equal(clampedHigh.value.stats.userHappiness, 100);

// Session remains running after stat mutations
assertSessionStatus(clampedHigh.value, "waiting");

// applyStatDelta on ended session should fail
requireOk(
	await kernel.sessionManager.endSession({
		reason: "shutdown",
		sessionId,
	}),
);

assert.throws(
	() =>
		kernel.stateManager.applyStatDelta(sessionId, {
			developerSanity: 10,
			infrastructureCost: 0,
			serverStability: 10,
			userHappiness: 10,
		}),
	/ended/,
);

console.log("stats-edge-cases.check.ts passed");
