import type { ActionId, IncidentId, PlayerId, UnixMillis } from "./ids.js";

export interface Vote {
  readonly actionId: ActionId;
  readonly incidentId: IncidentId;
  readonly playerId: PlayerId;
  readonly registeredAt: UnixMillis;
  readonly weight: number;
}

export type VoteWindowStatus = "closed" | "open";

export interface VoteWindow {
  readonly closesAt: UnixMillis;
  readonly incidentId: IncidentId;
  readonly openedAt: UnixMillis;
  readonly status: VoteWindowStatus;
  readonly votesByPlayerId: ReadonlyMap<PlayerId, Vote>;
}

