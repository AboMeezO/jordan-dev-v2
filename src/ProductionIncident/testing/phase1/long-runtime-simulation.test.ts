import { strict as assert } from "node:assert";

import {
  assertSessionStatus,
  createPhase1Harness,
  createPlayer,
  requireOk,
} from "./test-helpers.js";

const harness = createPhase1Harness("long-runtime-hardening");
const { clock, events, idGenerator, kernel, scheduler } = harness;
const created = requireOk(await kernel.sessionManager.createSession({}));
const sessionId = created.value.id;

for (const name of ["mohammad", "ahmed", "rami", "hakem"]) {
  requireOk(
    await kernel.sessionManager.joinSession({
      player: createPlayer(idGenerator, name, name, clock.now()),
      sessionId,
    }),
  );
}

requireOk(await kernel.sessionManager.startSession({ minimumPlayers: 4, sessionId }));

for (let index = 0; index < 10; index += 1) {
  const incident = requireOk(
    await kernel.gameplayManager.generateIncident({
      sessionId,
    }),
  ).value;
  const action = incident.actionOptions[index % incident.actionOptions.length];

  if (action !== undefined) {
    for (const player of [
      "player-mohammad",
      "player-ahmed",
      "player-rami",
      "player-hakem",
    ]) {
      requireOk(
        await kernel.gameplayManager.submitVote({
          actionId: action.id,
          incidentId: incident.id,
          playerId: idGenerator.createPlayerId(player.replace("player-", "")),
          sessionId,
        }),
      );
    }
  }

  clock.advanceBy(30_000);
  requireOk(
    await kernel.gameplayManager.closeVote({
      incidentId: incident.id,
      sessionId,
    }),
  );
}

const session = kernel.stateManager.getSnapshot(sessionId);
assertSessionStatus(session, "ended");
assert.equal(session.state.endReason, "survived");
assert.equal(events.some((event) => event.type === "incident.failed"), true);
assert.equal(events.some((event) => event.type === "chainReaction.scheduled"), true);
assert.equal(events.some((event) => event.type === "escalation.updated"), true);
assert.equal(scheduler.activeTasks.length, 0);

console.log("\n=== LONG RUNTIME SIMULATION ===");
console.log({
  eventCount: events.length,
  reason: session.state.endReason,
  scheduledTasks: scheduler.activeTasks.length,
  stats: session.stats,
});
