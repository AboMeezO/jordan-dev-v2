import type {
  EventId,
  IncidentId,
  PlayerId,
  SessionId,
  TimerId,
} from "../domain/ids.js";

export interface IdGenerator {
  createEventId(): EventId;
  createIncidentId(): IncidentId;
  createPlayerId(sourceId: string): PlayerId;
  createSessionId(): SessionId;
  createTimerId(): TimerId;
}

