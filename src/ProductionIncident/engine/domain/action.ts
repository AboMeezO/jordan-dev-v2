import type { ActionId, RoleId } from "./ids.js";
import type { StatDelta } from "./stats.js";

export type ActionRiskLevel = "critical" | "high" | "low" | "medium";
export type ActionKind = "instant" | "vote";

export type ActionTag =
  | "auth"
  | "cache"
  | "database"
  | "deploy"
  | "fallback"
  | "frontend"
  | "hotfix"
  | "ignore"
  | "inspect"
  | "metrics"
  | "oauth"
  | "payments"
  | "provider"
  | "queue"
  | "rate-limit"
  | "rollback"
  | "scale"
  | "security"
  | "trace"
  | "webhook"
  | "workers"
  | "restart";

export interface ActionEffect {
  readonly delayedEffects?: readonly StatDelta[];
  readonly immediate: StatDelta;
}

export interface Action {
  readonly allowedRoleIds?: readonly RoleId[];
  readonly emojiKey?: string;
  readonly failure: ActionEffect;
  readonly id: ActionId;
  readonly kind: ActionKind;
  readonly label: string;
  readonly risk: ActionRiskLevel;
  readonly success: ActionEffect;
  readonly successRate: number;
  readonly tags: readonly ActionTag[];
}
