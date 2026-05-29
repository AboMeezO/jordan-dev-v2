import { strict as assert } from "node:assert";

import {
  assertSessionStatus,
  createPhase1Harness,
  createPlayer,
  requireOk,
} from "./test-helpers.js";

const harness = createPhase1Harness("phase-2-4-smoke");
const { clock, events, idGenerator, kernel } = harness;

const created = requireOk(await kernel.sessionManager.createSession({}));
const sessionId = created.value.id;

const firstPlayer = createPlayer(
  idGenerator,
  "mohammad",
  "Mohammad",
  clock.now(),
);
const secondPlayer = createPlayer(idGenerator, "ahmed", "Ahmed", clock.now());

requireOk(
  await kernel.sessionManager.joinSession({
    player: firstPlayer,
    sessionId,
  }),
);
requireOk(
  await kernel.sessionManager.joinSession({
    player: secondPlayer,
    sessionId,
  }),
);
requireOk(
  await kernel.sessionManager.startSession({
    firstTickDelayMs: 1_000,
    minimumPlayers: 2,
    sessionId,
  }),
);

const generated = requireOk(
  await kernel.gameplayManager.generateIncident({
    sessionId,
  }),
);
const incident = generated.value;
console.log("\n=== INCIDENT GENERATED ===");
console.log({
  id: incident.id,
  title: incident.title,
  severity: incident.severity,
  actions: incident.actionOptions.map((action) => ({
    id: action.id,
    label: action.label,
  })),
});
const selectedAction = incident.actionOptions[0];

if (selectedAction === undefined) {
  assert.fail("Expected generated incident to include action options.");
}

assert.equal(incident.status, "voting");
assert.equal(incident.actionOptions.length > 0, true);

requireOk(
  await kernel.gameplayManager.submitVote({
    actionId: selectedAction.id,
    incidentId: incident.id,
    playerId: firstPlayer.id,
    sessionId,
  }),
);
requireOk(
  await kernel.gameplayManager.submitVote({
    actionId: selectedAction.id,
    incidentId: incident.id,
    playerId: secondPlayer.id,
    sessionId,
  }),
);
console.log("\n=== VOTES SUBMITTED ===");
console.log({
  players: [firstPlayer.displayName, secondPlayer.displayName],
  selectedAction: selectedAction.label,
});

clock.advanceBy(30_000);
const closed = requireOk(
  await kernel.gameplayManager.closeVote({
    incidentId: incident.id,
    sessionId,
  }),
);
console.log("\n=== RESOLUTION ===");

for (const event of closed.value.events) {
  console.log(event.type);
}
assertSessionStatus(closed.value.session, "running");
assert.equal(
  closed.value.events.some((event) => event.type === "incident.resolved"),
  true,
);
assert.equal(
  events.some((event) => event.type === "statistics.updated"),
  true,
);
assert.equal(
  events.some((event) => event.type === "commentary.cued"),
  true,
);

const finalSession = kernel.stateManager.getSnapshot(sessionId);
console.log("\n=== FINAL SESSION STATE ===");

console.log({
  status: finalSession?.stats,
  stats: finalSession?.state,
  // activeIncidents: [...finalSession.state.activeIncidents.values()],
});
assertSessionStatus(finalSession, "running");
assert.equal(
  finalSession.state.incidentHistory.get(incident.id)?.selectedActionId,
  selectedAction.id,
);
assert.equal(finalSession.state.activeIncidents.has(incident.id), false);
assert.equal(finalSession.state.voteWindows.has(incident.id), false);
