import type { ActionTag } from "./action.js";
import type { RoleId } from "./ids.js";

export type RoleKind =
  | "backend-engineer"
  | "devops"
  | "intern"
  | "qa"
  | "security-engineer";

export interface Role {
  readonly allowedActionTags: readonly ActionTag[];
  readonly description: string;
  readonly displayName: string;
  readonly id: RoleId;
  readonly kind: RoleKind;
  readonly voteWeight: number;
}

