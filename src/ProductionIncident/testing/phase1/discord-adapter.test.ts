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
registry.cleanup(sessionId);
assert.equal(registry.getBySession(sessionId), undefined);
assert.equal(registry.getIncidentMessageId(sessionId, incidentId), undefined);

const renderer = new DiscordIncidentRenderer();
const prompt = renderer.renderIncidentPrompt(sessionId, {
  actionOptions: [
    {
      failure: { immediate: { serverStability: -1 } },
      id: actionId,
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
  rootCause: "expired signing key",
  severity: "medium",
  status: "voting",
  templateId: "template-auth" as IncidentTemplateId,
  title: "Login failure storm",
});
assert.equal(prompt.buttons?.[0]?.customId, encodedVote);

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
};
const router = new DiscordInteractionRouter(gameplayManager);
await router.handleVoteInteraction({
  customId: encodedVote,
  userId: "user-1",
});
assert.equal(submitted, true);
