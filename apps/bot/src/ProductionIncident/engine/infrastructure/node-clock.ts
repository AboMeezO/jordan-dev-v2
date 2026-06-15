import type { Clock, UnixMillis } from "../index.js";

export class NodeClock implements Clock {
  public now(): UnixMillis {
    return Date.now() as UnixMillis;
  }
}

