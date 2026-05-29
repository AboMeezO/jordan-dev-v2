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

for (let index = 0; index < 55; index += 1) {
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
assertSessionStatus(session, "running");
assert.equal(session.state.activeIncidents.size, 0);
assert.equal(session.state.voteWindows.size, 0);
assert.equal(session.state.incidentHistory.size, 55);
assert.equal(events.some((event) => event.type === "incident.failed"), true);
assert.equal(events.some((event) => event.type === "chainReaction.scheduled"), true);
assert.equal(events.some((event) => event.type === "escalation.updated"), true);
assert.equal(scheduler.activeTasks.every((task) => task.sessionId === sessionId), true);
assert.equal(scheduler.activeTasks.length <= 10, true);

requireOk(
  await kernel.sessionManager.endSession({
    reason: "survived",
    sessionId,
  }),
);
assert.equal(scheduler.activeTasks.length, 0);

console.log("\n=== LONG RUNTIME SIMULATION ===");
console.log({
  activeIncidents: session.state.activeIncidents.size,
  eventCount: events.length,
  history: session.state.incidentHistory.size,
  scheduledTasks: scheduler.activeTasks.length,
  stats: session.stats,
});
