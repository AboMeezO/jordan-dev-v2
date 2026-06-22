import { strict as assert } from "node:assert";

import type { GameEventType } from "../../engine/index.js";
import {
	assertEventTypes,
	createPhase1Harness,
	createPlayer,
	requireOk,
} from "./test-helpers.js";

const harness = createPhase1Harness("phase-1-events");
const { clock, events, idGenerator, kernel } = harness;

const created = requireOk(
	await kernel.sessionManager.createSession({}),
);
const sessionId = created.value.id;
assert.equal(created.value.state.status, "waiting");

clock.advanceBy(1);
const firstPlayer = createPlayer(
	idGenerator,
	"mohammad",
	"Mohammad",
	clock.now(),
);
requireOk(
	await kernel.sessionManager.joinSession({
		player: firstPlayer,
		sessionId,
	}),
);

clock.advanceBy(1);
const secondPlayer = createPlayer(
	idGenerator,
	"ahmed",
	"Ahmed",
	clock.now(),
);
requireOk(
	await kernel.sessionManager.joinSession({
		player: secondPlayer,
		sessionId,
	}),
);

clock.advanceBy(1);
requireOk(
	await kernel.sessionManager.startSession({
		minimumPlayers: 2,
		sessionId,
	}),
);

clock.advanceBy(1);
requireOk(
	await kernel.sessionManager.endSession({
		reason: "shutdown",
		sessionId,
	}),
);

const expectedTypes: readonly GameEventType[] = [
	"session.created",
	"player.joined",
	"player.joined",
	"roles.assigned",
	"session.started",
	"session.ended",
];

assertEventTypes(events, expectedTypes);
assert.equal(
	new Set(events.map((event) => event.eventId)).size,
	events.length,
);
assert.deepEqual(
	events.map((event) => event.sessionId),
	[
		sessionId,
		sessionId,
		sessionId,
		sessionId,
		sessionId,
		sessionId,
	],
);
assert.deepEqual(
	events.map((event) => event.occurredAt),
	[
		created.value.state.createdAt,
		firstPlayer.joinedAt,
		secondPlayer.joinedAt,
		events[3]?.occurredAt,
		events[4]?.occurredAt,
		events[5]?.occurredAt,
	],
);

const joinedEvents = events.filter(
	(event) => event.type === "player.joined",
);
assert.deepEqual(
	joinedEvents.map((event) => event.playerId),
	[firstPlayer.id, secondPlayer.id],
);
assert.equal(events[3]?.type, "roles.assigned");
assert.equal(events[4]?.type, "session.started");
assert.equal(events[5]?.type, "session.ended");
