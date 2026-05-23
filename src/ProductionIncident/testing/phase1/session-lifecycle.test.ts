import { strict as assert } from "node:assert";

import {
  assertEventTypes,
  assertSessionStatus,
  createPhase1Harness,
  createPlayer,
  requireOk,
} from "./test-helpers.js";

const lifecycleHarness = createPhase1Harness("phase-1-lifecycle");
const { clock, events, idGenerator, kernel, scheduler } = lifecycleHarness;

const created = requireOk(await kernel.sessionManager.createSession({}));
const sessionId = created.value.id;

assertSessionStatus(created.value, "waiting");
assertSessionStatus(kernel.stateManager.getSnapshot(sessionId), "waiting");
assert.equal(created.value.state.players.size, 0);

clock.advanceBy(5);
const firstPlayer = createPlayer(idGenerator, "mohammad", "Mohammad", clock.now());
const joinedFirst = requireOk(
  await kernel.sessionManager.joinSession({
    player: firstPlayer,
    sessionId,
  }),
);

assertSessionStatus(joinedFirst.value, "waiting");
assert.equal(joinedFirst.value.state.players.size, 1);
assert.equal(joinedFirst.value.state.players.has(firstPlayer.id), true);

clock.advanceBy(5);
const secondPlayer = createPlayer(idGenerator, "ahmed", "Ahmed", clock.now());
const joinedSecond = requireOk(
  await kernel.sessionManager.joinSession({
    player: secondPlayer,
    sessionId,
  }),
);

assert.equal(joinedSecond.value.state.players.size, 2);
assert.equal(joinedSecond.value.state.players.has(secondPlayer.id), true);

clock.advanceBy(5);
const started = requireOk(
  await kernel.sessionManager.startSession({
    firstTickDelayMs: 750,
    minimumPlayers: 2,
    sessionId,
  }),
);

assertSessionStatus(started.value, "running");
assert.equal(started.value.state.players.size, 2);
assert.equal(
  scheduler.activeTasks.some(
    (task) => task.delayMs === 750 && task.sessionId === sessionId,
  ),
  true,
);
assertSessionStatus(kernel.stateManager.getSnapshot(sessionId), "running");

clock.advanceBy(5);
const ended = requireOk(
  await kernel.sessionManager.endSession({
    reason: "survived",
    sessionId,
  }),
);

assertSessionStatus(ended.value, "ended");
assert.equal(ended.value.state.status, "ended");
assert.equal(ended.value.state.endReason, "survived");
assert.equal(ended.value.state.players.size, 2);
assert.equal(scheduler.activeTasks.length, 0);
assertSessionStatus(kernel.sessionManager.getSession(sessionId), "ended");
assertEventTypes(events, [
  "session.created",
  "player.joined",
  "player.joined",
  "session.started",
  "session.ended",
]);

const cancelHarness = createPhase1Harness("phase-1-cancel");
const cancelCreated = requireOk(
  await cancelHarness.kernel.sessionManager.createSession({}),
);
const cancelled = requireOk(
  await cancelHarness.kernel.sessionManager.cancelSession(cancelCreated.value.id),
);

assertSessionStatus(cancelled.value, "ended");
assert.equal(cancelled.value.state.status, "ended");
assert.equal(cancelled.value.state.endReason, "cancelled");
assertEventTypes(cancelHarness.events, ["session.created", "session.ended"]);
