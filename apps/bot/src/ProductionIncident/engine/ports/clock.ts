import type { UnixMillis } from "../domain/ids.js";

export interface Clock {
  now(): UnixMillis;
}

