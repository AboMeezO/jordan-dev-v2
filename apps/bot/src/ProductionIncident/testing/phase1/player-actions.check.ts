import { strict as assert } from "node:assert";

import type { UnixMillis } from "../../engine/index.js";

import {
	assertEventTypes,
	assertSessionStatus,
	createPhase1Harness,
	createPlayer,
	requireFailure,
	requireOk,
} from "./test-helpers.js";

// 1. removePlayer flow
const harness1 = createPhase1Harness("player-actions-remove");
const { clock: c1, events: e1, idGenerator: id1, kernel: k1 } = harness1;

const created1 = requireOk(
	await k1.sessionManager.createSession({}),
);
const sid1 = created1.value.id;

const p1 = createPlayer(id1, "alice", "Alice", c1.now());
const p2 = createPlayer(id1, "bob", "Bob", c1.now());

requireOk(
	await k1.sessionManager.joinSession({ player: p1, sessionId: sid1 }),
);
requireOk(
	await k1.sessionManager.joinSession({ player: p2, sessionId: sid1 }),
);

const afterRemove = requireOk(
	await k1.sessionManager.removePlayer(sid1, p1.id),
);

assert.equal(afterRemove.value.state.players.size, 1);
assert.equal(afterRemove.value.state.players.has(p2.id), true);
assert.equal(afterRemove.value.state.players.has(p1.id), false);
assertEventTypes(afterRemove.events, ["player.left"]);
assertSessionStatus(afterRemove.value, "waiting");

// removePlayer on ended session
const endHarness = createPhase1Harness("player-actions-end-remove");
const { idGenerator: idEnd, kernel: kEnd } = endHarness;
const endSession = requireOk(
	await kEnd.sessionManager.createSession({}),
);
const endSid = endSession.value.id;
const endPlayer = createPlayer(idEnd, "eve", "Eve", 0 as UnixMillis);
requireOk(
	await kEnd.sessionManager.joinSession({ player: endPlayer, sessionId: endSid }),
);
requireOk(await kEnd.sessionManager.endSession({ reason: "shutdown", sessionId: endSid }));
const removeAfterEnd = requireFailure(
	await kEnd.sessionManager.removePlayer(endSid, endPlayer.id),
);
assert.equal(removeAfterEnd.code, "invalid-session-state");

console.log("player-actions.check.ts: removePlayer passed");

// 2. useInstantAction flow
const harness2 = createPhase1Harness("player-actions-instant");
const { clock: c2, idGenerator: id2, kernel: k2 } = harness2;

const created2 = requireOk(
	await k2.sessionManager.createSession({}),
);
const sid2 = created2.value.id;
const pa = createPlayer(id2, "charlie", "Charlie", c2.now());
const pb = createPlayer(id2, "dave", "Dave", c2.now());

requireOk(await k2.sessionManager.joinSession({ player: pa, sessionId: sid2 }));
requireOk(await k2.sessionManager.joinSession({ player: pb, sessionId: sid2 }));
requireOk(await k2.sessionManager.startSession({ minimumPlayers: 2, sessionId: sid2 }));

const gen2 = requireOk(
	await k2.gameplayManager.generateIncident({ sessionId: sid2 }),
).value;
const instantAction2 = gen2.instantActionOptions[0];
if (instantAction2 === undefined) { throw new Error("Expected instant action"); }

// Valid instant action: no events, non-empty message
const instantResult = requireOk(
	await k2.gameplayManager.useInstantAction({
		actionId: instantAction2.id,
		incidentId: gen2.id,
		playerId: pa.id,
		sessionId: sid2,
	}),
);
assert.equal(instantResult.events.length, 0);
assert.equal(typeof instantResult.value.message, "string");
assert.ok(instantResult.value.message.length > 0);

// Instant action on missing session
const missingSession = requireFailure(
	await k2.gameplayManager.useInstantAction({
		actionId: instantAction2.id,
		incidentId: gen2.id,
		playerId: pa.id,
		sessionId: "session-nonexistent" as typeof sid2,
	}),
);
assert.equal(missingSession.code, "session-not-found");

// Instant action on ended session
requireOk(await k2.sessionManager.endSession({ reason: "shutdown", sessionId: sid2 }));
const endedSession = requireFailure(
	await k2.gameplayManager.useInstantAction({
		actionId: instantAction2.id,
		incidentId: gen2.id,
		playerId: pa.id,
		sessionId: sid2,
	}),
);
assert.equal(endedSession.code, "invalid-session-state");

console.log("player-actions.check.ts: useInstantAction passed");
