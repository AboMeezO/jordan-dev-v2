import type { IncidentId, PlayerId, SessionId, UnixMillis } from "./ids.js";
import type { Incident } from "./incident.js";
import type { Player } from "./player.js";
import type { GlobalStats } from "./stats.js";
import type { VoteWindow } from "./vote.js";

export type SessionLifecycleStatus =
  | "ended"
  | "paused"
  | "recovering"
  | "running"
  | "waiting";

export interface WaitingSessionState {
  readonly createdAt: UnixMillis;
  readonly players: ReadonlyMap<PlayerId, Player>;
  readonly status: "waiting";
}

export interface RunningSessionState {
  readonly activeIncidents: ReadonlyMap<IncidentId, Incident>;
  readonly players: ReadonlyMap<PlayerId, Player>;
  readonly startedAt: UnixMillis;
  readonly status: "running";
  readonly voteWindows: ReadonlyMap<IncidentId, VoteWindow>;
}

export interface PausedSessionState {
  readonly activeIncidents: ReadonlyMap<IncidentId, Incident>;
  readonly pausedAt: UnixMillis;
  readonly players: ReadonlyMap<PlayerId, Player>;
  readonly startedAt: UnixMillis;
  readonly status: "paused";
  readonly voteWindows: ReadonlyMap<IncidentId, VoteWindow>;
}

export interface RecoveringSessionState {
  readonly activeIncidents: ReadonlyMap<IncidentId, Incident>;
  readonly players: ReadonlyMap<PlayerId, Player>;
  readonly recoveredAt: UnixMillis;
  readonly status: "recovering";
  readonly voteWindows: ReadonlyMap<IncidentId, VoteWindow>;
}

export interface EndedSessionState {
  readonly endedAt: UnixMillis;
  readonly endReason: SessionEndReason;
  readonly players: ReadonlyMap<PlayerId, Player>;
  readonly status: "ended";
}

export type SessionState =
  | EndedSessionState
  | PausedSessionState
  | RecoveringSessionState
  | RunningSessionState
  | WaitingSessionState;

export type SessionEndReason =
  | "cancelled"
  | "failed"
  | "shutdown"
  | "survived"
  | "timed-out";

export interface GameSession {
  readonly id: SessionId;
  readonly state: SessionState;
  readonly stats: GlobalStats;
}
