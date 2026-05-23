import type { ActionId, RoleId } from "./ids.js";
import type { StatDelta } from "./stats.js";

export type ActionRiskLevel = "critical" | "high" | "low" | "medium";

export type ActionTag =
  | "auth"
  | "deploy"
  | "hotfix"
  | "ignore"
  | "inspect"
  | "rollback"
  | "scale"
  | "security"
  | "restart";

export interface ActionEffect {
  readonly delayedEffects?: readonly StatDelta[];
  readonly immediate: StatDelta;
}

export interface Action {
  readonly allowedRoleIds?: readonly RoleId[];
  readonly failure: ActionEffect;
  readonly id: ActionId;
  readonly label: string;
  readonly risk: ActionRiskLevel;
  readonly success: ActionEffect;
  readonly successRate: number;
  readonly tags: readonly ActionTag[];
}

