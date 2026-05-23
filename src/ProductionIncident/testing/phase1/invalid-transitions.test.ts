import { strict as assert } from "node:assert";

import type { SessionId } from "../../engine/index.js";
import {
  assertEventTypes,
  assertSessionStatus,
  createPhase1Harness,
  createPlayer,
  requireFailure,
  requireOk,
} from "./test-helpers.js";

const startBeforePlayersHarness = createPhase1Harness("phase-1-invalid-start");
const emptySession = requireOk(
  await startBeforePlayersHarness.kernel.sessionManager.createSession({}),
);
const minimumPlayersError = requireFailure(
  await startBeforePlayersHarness.kernel.sessionManager.startSession({
    minimumPlayers: 1,
    sessionId: emptySession.value.id,
  }),
);

assert.equal(minimumPlayersError.code, "minimum-players-not-met");
assertSessionStatus(
  startBeforePlayersHarness.kernel.stateManager.getSnapshot(emptySession.value.id),
  "waiting",
);
assertEventTypes(startBeforePlayersHarness.events, ["session.created"]);
assert.equal(startBeforePlayersHarness.scheduler.activeTasks.length, 0);

const duplicateJoinHarness = createPhase1Harness("phase-1-duplicate-join");
const duplicateSession = requireOk(
  await duplicateJoinHarness.kernel.sessionManager.createSession({}),
);
const duplicatePlayer = createPlayer(
  duplicateJoinHarness.idGenerator,
  "mohammad",
  "Mohammad",
  duplicateJoinHarness.clock.now(),
);

requireOk(
  await duplicateJoinHarness.kernel.sessionManager.joinSession({
    player: duplicatePlayer,
    sessionId: duplicateSession.value.id,
  }),
);

const duplicatePlayerError = requireFailure(
  await duplicateJoinHarness.kernel.sessionManager.joinSession({
    player: duplicatePlayer,
    sessionId: duplicateSession.value.id,
  }),
);

assert.equal(duplicatePlayerError.code, "duplicate-player");
assert.equal(
  duplicateJoinHarness.kernel.stateManager.getSnapshot(duplicateSession.value.id)
    ?.state.players.size,
  1,
);
assertEventTypes(duplicateJoinHarness.events, ["session.created", "player.joined"]);

const endedSessionHarness = createPhase1Harness("phase-1-ended-session");
const created = requireOk(
  await endedSessionHarness.kernel.sessionManager.createSession({}),
);
const player = createPlayer(
  endedSessionHarness.idGenerator,
  "ahmed",
  "Ahmed",
  endedSessionHarness.clock.now(),
);

requireOk(
  await endedSessionHarness.kernel.sessionManager.joinSession({
    player,
    sessionId: created.value.id,
  }),
);
requireOk(
  await endedSessionHarness.kernel.sessionManager.startSession({
    sessionId: created.value.id,
  }),
);
requireOk(
  await endedSessionHarness.kernel.sessionManager.endSession({
    reason: "shutdown",
    sessionId: created.value.id,
  }),
);

const joinEndedError = requireFailure(
  await endedSessionHarness.kernel.sessionManager.joinSession({
    player: createPlayer(
      endedSessionHarness.idGenerator,
      "sara",
      "Sara",
      endedSessionHarness.clock.now(),
    ),
    sessionId: created.value.id,
  }),
);
const endEndedError = requireFailure(
  await endedSessionHarness.kernel.sessionManager.endSession({
    reason: "failed",
    sessionId: created.value.id,
  }),
);
const startEndedError = requireFailure(
  await endedSessionHarness.kernel.sessionManager.startSession({
    sessionId: created.value.id,
  }),
);

assert.equal(joinEndedError.code, "invalid-session-state");
assert.equal(endEndedError.code, "invalid-session-state");
assert.equal(startEndedError.code, "invalid-session-state");
assertSessionStatus(
  endedSessionHarness.kernel.stateManager.getSnapshot(created.value.id),
  "ended",
);
assertEventTypes(endedSessionHarness.events, [
  "session.created",
  "player.joined",
  "session.started",
  "session.ended",
]);

const missingSessionHarness = createPhase1Harness("phase-1-missing-session");
const missingSessionId = "session-missing" as SessionId;
const missingJoinError = requireFailure(
  await missingSessionHarness.kernel.sessionManager.joinSession({
    player: createPlayer(
      missingSessionHarness.idGenerator,
      "ghost",
      "Ghost",
      missingSessionHarness.clock.now(),
    ),
    sessionId: missingSessionId,
  }),
);

assert.equal(missingJoinError.code, "session-not-found");
assert.equal(missingSessionHarness.events.length, 0);
