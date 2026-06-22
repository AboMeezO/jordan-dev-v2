import { strict as assert } from "node:assert";

import {
	type DiscordActionRouteKey,
	DiscordCustomIdCodec,
} from "../../discord/index.js";
import {
	ACTION_CATALOG,
	CatalogValidationError,
	INCIDENT_TEMPLATES,
	validateCatalogs,
} from "../../engine/data/index.js";
import {
	type Action,
	type EventId,
	type IncidentTemplate,
	InMemoryEventBus,
	type SessionId,
	type UnixMillis,
} from "../../engine/index.js";
import {
	assertSessionStatus,
	createPhase1Harness,
	createPlayer,
	requireFailure,
	requireOk,
} from "./test-helpers.js";

function requireDefined<TValue>(
	value: TValue | undefined,
): TValue {
	if (value === undefined) {
		assert.fail("Expected value to be defined.");
	}

	return value;
}

async function createRunningHarness(seed: string) {
	const harness = createPhase1Harness(seed);
	const { clock, idGenerator, kernel } = harness;
	const created = requireOk(
		await kernel.sessionManager.createSession({}),
	);
	const sessionId = created.value.id;
	const firstPlayer = createPlayer(
		idGenerator,
		"a",
		"A",
		clock.now(),
	);
	const secondPlayer = createPlayer(
		idGenerator,
		"b",
		"B",
		clock.now(),
	);

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
			minimumPlayers: 2,
			sessionId,
		}),
	);

	return { firstPlayer, harness, secondPlayer, sessionId };
}

const noVote = await createRunningHarness(
	"hardening-no-vote",
);
const noVoteIncident = requireOk(
	await noVote.harness.kernel.gameplayManager.generateIncident(
		{
			sessionId: noVote.sessionId,
		},
	),
).value;
requireOk(
	await noVote.harness.kernel.gameplayManager.closeVote({
		incidentId: noVoteIncident.id,
		sessionId: noVote.sessionId,
	}),
);
const noVoteSession =
	noVote.harness.kernel.stateManager.getSnapshot(
		noVote.sessionId,
	);
assertSessionStatus(noVoteSession, "running");
assert.equal(
	noVoteSession.state.activeIncidents.has(
		noVoteIncident.id,
	),
	false,
);
assert.equal(
	noVoteSession.state.incidentHistory.has(
		noVoteIncident.id,
	),
	true,
);
assert.equal(
	noVoteSession.state.voteWindows.has(noVoteIncident.id),
	false,
);

const replacement = await createRunningHarness(
	"hardening-replacement",
);
const replacementIncident = requireOk(
	await replacement.harness.kernel.gameplayManager.generateIncident(
		{
			sessionId: replacement.sessionId,
		},
	),
).value;
assert.equal(
	replacementIncident.actionOptions.some(
		(action) => action.kind === "instant",
	),
	false,
);
assert.equal(
	replacementIncident.instantActionOptions.length > 0,
	true,
);
const firstAction = requireDefined(
	replacementIncident.actionOptions[0],
);
const secondAction = requireDefined(
	replacementIncident.actionOptions[1],
);
const instantAction = requireDefined(
	replacementIncident.instantActionOptions[0],
);
const instantResult = requireOk(
	await replacement.harness.kernel.gameplayManager.useInstantAction(
		{
			actionId: instantAction.id,
			incidentId: replacementIncident.id,
			playerId: replacement.firstPlayer.id,
			sessionId: replacement.sessionId,
		},
	),
).value;
assert.match(instantResult.message, /Logs|Metrics|Trace/);
requireOk(
	await replacement.harness.kernel.gameplayManager.submitVote(
		{
			actionId: firstAction.id,
			incidentId: replacementIncident.id,
			playerId: replacement.firstPlayer.id,
			sessionId: replacement.sessionId,
		},
	),
);
requireOk(
	await replacement.harness.kernel.gameplayManager.submitVote(
		{
			actionId: secondAction.id,
			incidentId: replacementIncident.id,
			playerId: replacement.firstPlayer.id,
			sessionId: replacement.sessionId,
		},
	),
);
const replacementSession =
	replacement.harness.kernel.stateManager.getSnapshot(
		replacement.sessionId,
	);
assertSessionStatus(replacementSession, "running");
assert.equal(
	replacementSession.state.voteWindows
		.get(replacementIncident.id)
		?.votesByPlayerId.get(replacement.firstPlayer.id)
		?.actionId,
	secondAction.id,
);

requireOk(
	await replacement.harness.kernel.gameplayManager.closeVote(
		{
			incidentId: replacementIncident.id,
			sessionId: replacement.sessionId,
		},
	),
);
const lateVoteError = requireFailure(
	await replacement.harness.kernel.gameplayManager.submitVote(
		{
			actionId: firstAction.id,
			incidentId: replacementIncident.id,
			playerId: replacement.secondPlayer.id,
			sessionId: replacement.sessionId,
		},
	),
);
assert.equal(lateVoteError.code, "invalid-session-state");

const tie = await createRunningHarness("hardening-tie");
const tieIncident = requireOk(
	await tie.harness.kernel.gameplayManager.generateIncident(
		{
			sessionId: tie.sessionId,
		},
	),
).value;
const tieLowRisk = requireDefined(
	tieIncident.actionOptions[0],
);
const tieHigherRisk = requireDefined(
	tieIncident.actionOptions[1],
);
requireOk(
	await tie.harness.kernel.gameplayManager.submitVote({
		actionId: tieLowRisk.id,
		incidentId: tieIncident.id,
		playerId: tie.firstPlayer.id,
		sessionId: tie.sessionId,
	}),
);
requireOk(
	await tie.harness.kernel.gameplayManager.submitVote({
		actionId: tieHigherRisk.id,
		incidentId: tieIncident.id,
		playerId: tie.secondPlayer.id,
		sessionId: tie.sessionId,
	}),
);
requireOk(
	await tie.harness.kernel.gameplayManager.closeVote({
		incidentId: tieIncident.id,
		sessionId: tie.sessionId,
	}),
);
const tieSession =
	tie.harness.kernel.stateManager.getSnapshot(
		tie.sessionId,
	);
assertSessionStatus(tieSession, "running");
assert.equal(
	tieSession.state.incidentHistory.get(tieIncident.id)
		?.selectedActionId,
	tieLowRisk.id,
);

const endDuringVote = await createRunningHarness(
	"hardening-end-during-vote",
);
const pendingIncident = requireOk(
	await endDuringVote.harness.kernel.gameplayManager.generateIncident(
		{
			sessionId: endDuringVote.sessionId,
		},
	),
).value;
assert.equal(
	endDuringVote.harness.scheduler.activeTasks.length > 0,
	true,
);
requireOk(
	await endDuringVote.harness.kernel.sessionManager.endSession(
		{
			reason: "shutdown",
			sessionId: endDuringVote.sessionId,
		},
	),
);
assert.equal(
	endDuringVote.harness.scheduler.activeTasks.length,
	0,
);
const closeAfterEnd = requireFailure(
	await endDuringVote.harness.kernel.gameplayManager.closeVote(
		{
			incidentId: pendingIncident.id,
			sessionId: endDuringVote.sessionId,
		},
	),
);
assert.equal(closeAfterEnd.code, "invalid-session-state");

const codec = new DiscordCustomIdCodec();
const encoded = codec.encodeAction({
	key: "a1" as DiscordActionRouteKey,
});
assert.equal(encoded.length <= 100, true);
assert.deepEqual(codec.decodeAction(encoded), {
	key: "a1",
	kind: "action",
	version: "v1",
});
assert.throws(() => codec.decodeVote("pi:vote:old:shape"));
assert.throws(() =>
	codec.decodeVote("pi:v1:vote::incident:action"),
);
assert.throws(() => codec.decodeAction("pi:v1:a:bad:key"));

validateCatalogs(INCIDENT_TEMPLATES, ACTION_CATALOG);
const actionSignatures = new Set(
	INCIDENT_TEMPLATES.map((template) =>
		ACTION_CATALOG.filter(
			(action) =>
				action.kind === "vote" &&
				action.tags.some((tag) =>
					template.actionTags.includes(tag),
				),
		)
			.map((action) => action.id)
			.sort()
			.join("|"),
	),
);
assert.equal(actionSignatures.size > 1, true);
assert.equal(
	ACTION_CATALOG.find(
		(action) =>
			action.id === ("action-inspect-logs" as Action["id"]),
	)?.kind,
	"instant",
);

const duplicateAction: Action = {
	...ACTION_CATALOG[0]!,
};
assert.throws(
	() =>
		validateCatalogs(INCIDENT_TEMPLATES, [
			ACTION_CATALOG[0]!,
			duplicateAction,
		]),
	CatalogValidationError,
);

const invalidTemplate: IncidentTemplate = {
	...INCIDENT_TEMPLATES[0]!,
	actionTags: ["security"],
	id: "template-invalid" as IncidentTemplate["id"],
	rootCauses: [],
};
assert.throws(
	() => validateCatalogs([invalidTemplate], ACTION_CATALOG),
	CatalogValidationError,
);

const isolatedBus = new InMemoryEventBus();
let healthyHandlerCalled = false;
isolatedBus.subscribe("session.created", () => {
	throw new Error("subscriber failed");
});
isolatedBus.subscribe("session.created", () => {
	healthyHandlerCalled = true;
});
await isolatedBus.publish({
	eventId: "event-isolated" as EventId,
	initialStats: {
		developerSanity: 100,
		infrastructureCost: 0,
		serverStability: 100,
		userHappiness: 100,
	},
	occurredAt: 1 as UnixMillis,
	sessionId: "session-isolated" as SessionId,
	type: "session.created",
});
assert.equal(healthyHandlerCalled, true);
assert.equal(isolatedBus.getHandlerErrors().length, 1);
