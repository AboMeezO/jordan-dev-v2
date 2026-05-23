import type {
  ActionId,
  EventId,
  IncidentId,
  PlayerId,
  RoleId,
  SessionId,
  UnixMillis,
} from "../domain/ids.js";
import type { IncidentSeverity } from "../domain/incident.js";
import type { SessionEndReason } from "../domain/session.js";
import type { GlobalStats, StatDelta } from "../domain/stats.js";

export interface GameEventBase<TType extends string> {
  readonly eventId: EventId;
  readonly occurredAt: UnixMillis;
  readonly sessionId: SessionId;
  readonly type: TType;
}

export interface SessionCreatedEvent
  extends GameEventBase<"session.created"> {
  readonly initialStats: GlobalStats;
}

export interface PlayerJoinedEvent extends GameEventBase<"player.joined"> {
  readonly playerId: PlayerId;
}

export interface PlayerLeftEvent extends GameEventBase<"player.left"> {
  readonly playerId: PlayerId;
}

export interface RolesAssignedEvent
  extends GameEventBase<"roles.assigned"> {
  readonly assignments: ReadonlyMap<PlayerId, RoleId>;
}

export interface SessionStartedEvent
  extends GameEventBase<"session.started"> {
  readonly startedAt: UnixMillis;
}

export interface SessionEndedEvent extends GameEventBase<"session.ended"> {
  readonly endedAt: UnixMillis;
  readonly reason: SessionEndReason;
}

export interface IncidentGeneratedEvent
  extends GameEventBase<"incident.generated"> {
  readonly incidentId: IncidentId;
  readonly severity: IncidentSeverity;
}

export interface VoteOpenedEvent extends GameEventBase<"vote.opened"> {
  readonly actionIds: readonly ActionId[];
  readonly closesAt: UnixMillis;
  readonly incidentId: IncidentId;
}

export interface VoteRegisteredEvent
  extends GameEventBase<"vote.registered"> {
  readonly actionId: ActionId;
  readonly incidentId: IncidentId;
  readonly playerId: PlayerId;
  readonly weight: number;
}

export interface VoteClosedEvent extends GameEventBase<"vote.closed"> {
  readonly incidentId: IncidentId;
  readonly selectedActionId?: ActionId;
}

export interface IncidentResolvedEvent
  extends GameEventBase<"incident.resolved"> {
  readonly actionId: ActionId;
  readonly appliedDelta: StatDelta;
  readonly incidentId: IncidentId;
  readonly succeeded: boolean;
}

export interface IncidentFailedEvent extends GameEventBase<"incident.failed"> {
  readonly actionId: ActionId;
  readonly incidentId: IncidentId;
}

export interface EscalationUpdatedEvent
  extends GameEventBase<"escalation.updated"> {
  readonly currentLevel: number;
  readonly previousLevel: number;
  readonly reason: "incident-failure" | "manual" | "stat-threshold" | "time";
}

export interface ChainReactionScheduledEvent
  extends GameEventBase<"chainReaction.scheduled"> {
  readonly delayMs: number;
  readonly depth: number;
  readonly sourceIncidentId: IncidentId;
}

export interface CommentaryCuedEvent
  extends GameEventBase<"commentary.cued"> {
  readonly message: string;
  readonly priority: "high" | "low" | "normal";
  readonly sourceEventType: Exclude<GameEventType, "commentary.cued">;
}

export interface StatisticsUpdatedEvent
  extends GameEventBase<"statistics.updated"> {
  readonly after: GlobalStats;
  readonly before: GlobalStats;
  readonly delta: StatDelta;
}

export type GameEvent =
  | ChainReactionScheduledEvent
  | CommentaryCuedEvent
  | EscalationUpdatedEvent
  | IncidentFailedEvent
  | IncidentGeneratedEvent
  | IncidentResolvedEvent
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | RolesAssignedEvent
  | SessionCreatedEvent
  | SessionEndedEvent
  | SessionStartedEvent
  | StatisticsUpdatedEvent
  | VoteClosedEvent
  | VoteOpenedEvent
  | VoteRegisteredEvent;

export type GameEventType = GameEvent["type"];

export type GameEventOfType<TType extends GameEventType> = Extract<
  GameEvent,
  { readonly type: TType }
>;

export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminated union member: ${String(value)}`);
}
