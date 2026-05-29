import { randomUUID } from "node:crypto";

import type {
  EventId,
  IdGenerator,
  IncidentId,
  PlayerId,
  SessionId,
  TimerId,
} from "../index.js";

export class RuntimeIdGenerator implements IdGenerator {
  public createEventId(): EventId {
    return `event-${randomUUID()}` as EventId;
  }

  public createIncidentId(): IncidentId {
    return `incident-${randomUUID()}` as IncidentId;
  }

  public createPlayerId(sourceId: string): PlayerId {
    return `player-${sourceId}` as PlayerId;
  }

  public createSessionId(): SessionId {
    return `session-${randomUUID()}` as SessionId;
  }

  public createTimerId(): TimerId {
    return `timer-${randomUUID()}` as TimerId;
  }
}

