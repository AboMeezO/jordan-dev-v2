import { strict as assert } from "node:assert";

import {
	type EventId,
	type GameEvent,
	InMemoryEventBus,
	type SessionId,
	type UnixMillis,
} from "../../engine/index.js";
import { EngineDiscordBridge } from "../../discord/index.js";

const bus = new InMemoryEventBus();

// 1. Event bus publishes events to subscribed handlers
const receivedEvents: GameEvent[] = [];
bus.subscribe("session.created", (e) => {
	receivedEvents.push(e);
});

await bus.publish({
	eventId: "event-1" as EventId,
	initialStats: { developerSanity: 100, infrastructureCost: 0, serverStability: 100, userHappiness: 100 },
	occurredAt: 1_000 as UnixMillis,
	sessionId: "session-bus" as SessionId,
	type: "session.created",
});
assert.equal(receivedEvents.length, 1);
assert.equal(receivedEvents[0]!.type, "session.created");

// 2. Handler errors are isolated: failing handler does not block other handlers
let healthyCalled = false;
bus.subscribe("session.created", () => {
	throw new Error("handler failed");
});
bus.subscribe("session.created", () => {
	healthyCalled = true;
});

await bus.publish({
	eventId: "event-2" as EventId,
	initialStats: { developerSanity: 100, infrastructureCost: 0, serverStability: 100, userHappiness: 100 },
	occurredAt: 2_000 as UnixMillis,
	sessionId: "session-bus" as SessionId,
	type: "session.created",
});
assert.equal(healthyCalled, true);
assert.equal(bus.getHandlerErrors().length, 1);

// 3. EngineDiscordBridge returns undefined for non-renderable events
//    (session.created has no mapping in the bridge)
const bridge = new EngineDiscordBridge(
	null as never,
	null as never,
);
const result = bridge.mapEventToRenderAction({
	eventId: "event-bridge" as EventId,
	initialStats: { developerSanity: 100, infrastructureCost: 0, serverStability: 100, userHappiness: 100 },
	occurredAt: 3_000 as UnixMillis,
	sessionId: "session-bridge" as SessionId,
	type: "session.created",
});
assert.equal(result, undefined);

// 4. commentary.cued maps to "send" type
const commentaryResult = bridge.mapEventToRenderAction({
	eventId: "event-bridge-2" as EventId,
	message: "Test commentary",
	occurredAt: 4_000 as UnixMillis,
	priority: "normal",
	sessionId: "session-bridge" as SessionId,
	sourceEventType: "incident.generated",
	type: "commentary.cued",
});
assert.notEqual(commentaryResult, undefined);
assert.equal(commentaryResult!.type, "send");

console.log("event-coverage.check.ts passed");
