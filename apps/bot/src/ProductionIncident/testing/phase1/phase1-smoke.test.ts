import { strict as assert } from "node:assert";

import {
	assertEventTypes,
	assertSessionStatus,
	createPhase1Harness,
	createPlayer,
	requireOk,
} from "./test-helpers.js";

const harness = createPhase1Harness();
const { clock, events, idGenerator, kernel, scheduler } =
	harness;

const created = requireOk(
	await kernel.sessionManager.createSession({}),
);
const sessionId = created.value.id;

clock.advanceBy(10);
requireOk(
	await kernel.sessionManager.joinSession({
		player: createPlayer(
			idGenerator,
			"mohammad",
			"Mohammad",
			clock.now(),
		),
		sessionId,
	}),
);

clock.advanceBy(10);
requireOk(
	await kernel.sessionManager.joinSession({
		player: createPlayer(
			idGenerator,
			"ahmed",
			"Ahmed",
			clock.now(),
		),
		sessionId,
	}),
);

clock.advanceBy(10);
requireOk(
	await kernel.sessionManager.startSession({
		firstTickDelayMs: 500,
		minimumPlayers: 2,
		sessionId,
	}),
);

clock.advanceBy(10);
requireOk(
	await kernel.sessionManager.endSession({
		reason: "survived",
		sessionId,
	}),
);

assertEventTypes(events, [
	"session.created",
	"player.joined",
	"player.joined",
	"roles.assigned",
	"session.started",
	"session.ended",
]);
assert.equal(scheduler.activeTasks.length, 0);
assertSessionStatus(
	kernel.stateManager.getSnapshot(sessionId),
	"ended",
);
