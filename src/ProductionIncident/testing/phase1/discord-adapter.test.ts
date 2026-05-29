import { strict as assert } from "node:assert";

import {
  DiscordCustomIdCodec,
  DiscordIncidentRenderer,
  DiscordInteractionRouter,
  DiscordSessionRegistry,
} from "../../discord/index.js";
import type {
  ActionId,
  EngineCommandResult,
  GameplayManager,
  GameSession,
  IncidentId,
  IncidentTemplateId,
  PlayerId,
  SessionId,
  UnixMillis,
} from "../../engine/index.js";

const codec = new DiscordCustomIdCodec();
const sessionId = "session-discord-test" as SessionId;
const incidentId = "incident-discord-test" as IncidentId;
const actionId = "action-discord-test" as ActionId;

const encodedVote = codec.encodeVote({ actionId, incidentId, sessionId });
assert.deepEqual(codec.decodeVote(encodedVote), {
  actionId,
  incidentId,
  kind: "vote",
  sessionId,
  version: "v1",
});
assert.throws(() => codec.decodeVote("pi:vote:old-shape"));
assert.throws(() =>
  codec.encodeVote({
    actionId: "action-with-a-really-long-identifier-that-would-break-discord-buttons" as ActionId,
    incidentId: "incident-with-a-really-long-identifier-that-would-break-discord-buttons" as IncidentId,
    sessionId: "session-with-a-really-long-identifier-that-would-break-discord-buttons" as SessionId,
  }),
);

const encodedLobby = codec.encodeLobby({ action: "join", sessionId });
assert.deepEqual(codec.decodeLobby(encodedLobby), {
  action: "join",
  kind: "lobby",
  sessionId,
  version: "v1",
});
assert.throws(() => codec.decodeLobby("pi:v1:lobby:session:launch"));

const registry = new DiscordSessionRegistry();
registry.bindSession({
  channelId: "channel-1",
  guildId: "guild-1",
  hostUserId: "host-1",
  lobbyMessageId: "message-lobby",
  outputChannelId: "channel-1",
  sessionId,
});
assert.equal(registry.getByChannel("channel-1")?.sessionId, sessionId);
registry.setIncidentMessageId(sessionId, incidentId, "message-incident");
assert.equal(registry.getIncidentMessageId(sessionId, incidentId), "message-incident");
const actionRoute = registry.registerActionRoute({
  actionId,
  createdAt: 10 as UnixMillis,
  expiresAt: 20 as UnixMillis,
  incidentId,
  sessionId,
});
const encodedAction = codec.encodeAction({ key: actionRoute.key });
assert.equal(encodedAction.length <= 100, true);
assert.deepEqual(codec.decodeAction(encodedAction), {
  key: actionRoute.key,
  kind: "action",
  version: "v1",
});
assert.equal(registry.getActionRoute(actionRoute.key, 15 as UnixMillis)?.actionId, actionId);
assert.equal(registry.getActionRoute(actionRoute.key, 21 as UnixMillis), undefined);
const staleRoute = registry.registerActionRoute({
  actionId,
  createdAt: 30 as UnixMillis,
  incidentId,
  sessionId,
});
registry.cleanupIncidentActionRoutes(sessionId, incidentId);
assert.equal(registry.getActionRoute(staleRoute.key), undefined);
registry.cleanup(sessionId);
assert.equal(registry.getBySession(sessionId), undefined);
assert.equal(registry.getIncidentMessageId(sessionId, incidentId), undefined);

const renderer = new DiscordIncidentRenderer();
const prompt = renderer.renderIncidentPrompt({
  actionOptions: [
    {
      failure: { immediate: { serverStability: -1 } },
      id: actionId,
      kind: "vote",
      label: "Inspect logs",
      risk: "low",
      success: { immediate: { serverStability: 1 } },
      successRate: 0.8,
      tags: ["inspect"],
    },
  ],
  affectedServices: ["Auth Service"],
  category: "authentication",
  createdAt: 1 as UnixMillis,
  description: "Login attempts are failing.",
  id: incidentId,
  instantActionOptions: [
    {
      failure: { immediate: { serverStability: -1 } },
      id: "action-inspect-logs" as ActionId,
      kind: "instant",
      label: "Inspect logs",
      risk: "low",
      success: { immediate: { serverStability: 1 } },
      successRate: 1,
      tags: ["inspect"],
    },
  ],
  rootCause: "expired signing key",
  severity: "medium",
  status: "voting",
  templateId: "template-auth" as IncidentTemplateId,
  title: "Login failure storm",
  votingClosesAt: 31_000 as UnixMillis,
}, () => encodedAction, () => codec.encodeInstant({ key: actionRoute.key }), {
  closesAt: 31_000 as UnixMillis,
  incidentId,
  openedAt: 1 as UnixMillis,
  status: "open",
  votesByPlayerId: new Map([
    [
      "player-count" as PlayerId,
      {
        actionId,
        incidentId,
        playerId: "player-count" as PlayerId,
        registeredAt: 2 as UnixMillis,
        weight: 1,
      },
    ],
  ]),
});
assert.equal(prompt.buttonRows?.[0]?.buttons[0]?.customId, encodedAction);
assert.match(prompt.buttonRows?.[0]?.buttons[0]?.label ?? "", /\(1\)$/);
assert.match(prompt.content, /Voting closes: <t:/);
assert.throws(() => codec.decodeAction("pi:v1:a:invalid:key"));
assert.deepEqual(codec.decodeInstant(codec.encodeInstant({ key: actionRoute.key })), {
  key: actionRoute.key,
  kind: "instant",
  version: "v1",
});

let submitted = false;
const gameplayManager: GameplayManager = {
  closeVote(): Promise<EngineCommandResult<{ readonly events: readonly []; readonly session: GameSession }>> {
    throw new Error("Not used in router test.");
  },
  generateIncident(): Promise<EngineCommandResult<never>> {
    throw new Error("Not used in router test.");
  },
  submitVote(command): Promise<EngineCommandResult<GameSession>> {
    submitted =
      command.actionId === actionId &&
      command.incidentId === incidentId &&
      command.sessionId === sessionId &&
      command.playerId === "player-user-1";
    return Promise.resolve({
      error: {
        code: "session-not-found",
        message: "Not used.",
        sessionId,
      },
      ok: false,
    });
  },
  useInstantAction(): Promise<EngineCommandResult<{ readonly message: string }>> {
    throw new Error("Not used in router test.");
  },
};
const router = new DiscordInteractionRouter(gameplayManager);
await router.handleVoteInteraction({
  customId: encodedVote,
  userId: "user-1",
});
assert.equal(submitted, true);
