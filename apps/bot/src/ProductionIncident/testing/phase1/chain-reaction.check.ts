import { strict as assert } from "node:assert";

import {
	type GameSession,
	type IncidentId,
	type PlayerId,
	type Player,
	type SessionId,
	type UnixMillis,
} from "../../engine/index.js";
import {
	ChainReactionSystem,
} from "../../engine/application/gameplay/systems/index.js";
import {
	InMemoryEventBus,
} from "../../engine/events/index.js";
import {
	TestClock,
	TestIdGenerator,
	RecordingScheduler,
	SeededRandomSource,
} from "./test-helpers.js";

function makeSession(serverStability: number): GameSession {
	return {
		id: "session-chain" as SessionId,
		state: {
			activeIncidents: new Map(),
			incidentHistory: new Map(),
			players: new Map<PlayerId, Player>(),
			startedAt: 1_000_000 as UnixMillis,
			status: "running",
			voteWindows: new Map(),
		},
		stats: {
			developerSanity: 100,
			infrastructureCost: 0,
			serverStability,
			userHappiness: 100,
		},
	};
}

// 1. maybeSchedule returns undefined when session is inactive
const clock1 = new TestClock();
const idGen1 = new TestIdGenerator();
const rs1 = new SeededRandomSource("chain-test-1");
const sched1 = new RecordingScheduler();
let inactiveCalled = false;

const chain1 = new ChainReactionSystem(
	clock1,
	idGen1,
	rs1,
	sched1,
	async () => { inactiveCalled = true; },
	() => false, // isSessionActive always false
);

const result1 = chain1.maybeSchedule(
	"session-chain" as SessionId,
	"incident-1" as IncidentId,
	makeSession(50),
);
assert.equal(result1, undefined, "should not schedule on inactive session");

// 2. maybeSchedule returns event when session is active and random passes
const clock2 = new TestClock();
const idGen2 = new TestIdGenerator();
const rs2 = new SeededRandomSource("chain-test-2");
const sched2 = new RecordingScheduler();
let chainGenerated = false;

const chain2 = new ChainReactionSystem(
	clock2,
	idGen2,
	rs2,
	sched2,
	async () => { chainGenerated = true; },
	() => true, // isSessionActive always true
);

// With serverStability=0, instability=1 so chainProb = 0.25 + 1*0.5 = 0.75
// seed "chain-test-2" should pass nextFloat() < 0.75
const result2 = chain2.maybeSchedule(
	"session-chain" as SessionId,
	"incident-1" as IncidentId,
	makeSession(0),
);
assert.notEqual(result2, undefined, "should schedule chain reaction");
assert.equal(result2!.type, "chainReaction.scheduled");
assert.equal(result2!.depth, 1);
assert.equal(result2!.delayMs, 5_000);
assert.equal(result2!.sourceIncidentId, "incident-1");
assert.equal(sched2.activeTasks.length, 1);

// 3. Chain reaction at max depth returns undefined
const clock3 = new TestClock();
const idGen3 = new TestIdGenerator();
const rs3 = new SeededRandomSource("chain-test-3");
const sched3 = new RecordingScheduler();

const chain3 = new ChainReactionSystem(
	clock3,
	idGen3,
	rs3,
	sched3,
	async () => {},
	() => true,
);

// Schedule 3 chains (depth 1, 2, 3)
chain3.maybeSchedule(
	"session-chain-3" as SessionId,
	"inc-1" as IncidentId,
	makeSession(0),
);
chain3.maybeSchedule(
	"session-chain-3" as SessionId,
	"inc-2" as IncidentId,
	makeSession(0),
);
chain3.maybeSchedule(
	"session-chain-3" as SessionId,
	"inc-3" as IncidentId,
	makeSession(0),
);

// 4th should be blocked at max depth
const result3 = chain3.maybeSchedule(
	"session-chain-3" as SessionId,
	"inc-4" as IncidentId,
	makeSession(0),
);
assert.equal(result3, undefined, "should not schedule at max depth (3)");

assert.equal(sched3.activeTasks.length, 3);

// 4. clear removes depth tracking
chain3.clear("session-chain-3" as SessionId);
const afterClear = chain3.maybeSchedule(
	"session-chain-3" as SessionId,
	"inc-5" as IncidentId,
	makeSession(0),
);
assert.notEqual(afterClear, undefined, "should schedule after clear");
assert.equal(sched3.activeTasks.length, 4);

console.log("chain-reaction.check.ts passed");
