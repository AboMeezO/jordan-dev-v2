import { strict as assert } from "node:assert";

import type { GameEvent } from "../../engine/index.js";
import {
	createPhase1Harness,
	createPlayer,
	requireOk,
} from "./test-helpers.js";

interface ReplaySnapshot {
	readonly events: readonly EventSnapshot[];
	readonly finalState: {
		readonly endReason?: string;
		readonly playerIds: readonly string[];
		readonly status: string;
	};
}

interface EventSnapshot {
	readonly eventId: string;
	readonly occurredAt: number;
	readonly playerId?: string;
	readonly reason?: string;
	readonly sessionId: string;
	readonly type: GameEvent["type"];
}

async function runReplay(
	seed: string,
): Promise<ReplaySnapshot> {
	const harness = createPhase1Harness(seed);
	const { clock, events, idGenerator, kernel } = harness;

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
			firstTickDelayMs: 1_000,
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

	const finalState =
		kernel.stateManager.getSnapshot(sessionId);
	if (finalState === undefined) {
		assert.fail("Expected final state snapshot to exist.");
	}

	const finalStateSnapshot =
		finalState.state.status === "ended"
			? {
					endReason: finalState.state.endReason,
					playerIds: [
						...finalState.state.players.keys(),
					].sort(),
					status: finalState.state.status,
				}
			: {
					playerIds: [
						...finalState.state.players.keys(),
					].sort(),
					status: finalState.state.status,
				};

	return {
		events: events.map(snapshotEvent),
		finalState: finalStateSnapshot,
	};
}

function snapshotEvent(event: GameEvent): EventSnapshot {
	const base = {
		eventId: event.eventId,
		occurredAt: event.occurredAt,
		sessionId: event.sessionId,
		type: event.type,
	};

	switch (event.type) {
		case "player.joined":
		case "player.left":
			return {
				...base,
				playerId: event.playerId,
			};
		case "session.ended":
			return {
				...base,
				reason: event.reason,
			};
		default:
			return base;
	}
}

const firstReplay = await runReplay("stable-seed");
const secondReplay = await runReplay("stable-seed");

assert.deepEqual(secondReplay, firstReplay);
