import type { Action, ActionId } from "../domain/index.js";

export const ACTION_CATALOG: readonly Action[] = [
  {
    failure: {
      immediate: {
        developerSanity: -8,
        infrastructureCost: 4,
        serverStability: -10,
        userHappiness: -8,
      },
    },
    id: "action-inspect-logs" as ActionId,
    emojiKey: "logs",
    kind: "instant",
    label: "Inspect logs",
    risk: "low",
    success: {
      immediate: {
        developerSanity: -2,
        serverStability: 4,
        userHappiness: 2,
      },
    },
    successRate: 0.82,
    tags: ["inspect"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -10,
        infrastructureCost: 8,
        serverStability: -16,
        userHappiness: -12,
      },
    },
    id: "action-restart-service" as ActionId,
    emojiKey: "backend",
    kind: "vote",
    label: "Restart service",
    risk: "medium",
    success: {
      immediate: {
        infrastructureCost: 2,
        serverStability: 12,
        userHappiness: 4,
      },
    },
    successRate: 0.68,
    tags: ["restart", "scale"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -12,
        infrastructureCost: 12,
        serverStability: -18,
        userHappiness: -16,
      },
    },
    id: "action-hotfix" as ActionId,
    emojiKey: "deploy",
    kind: "vote",
    label: "Ship hotfix",
    risk: "high",
    success: {
      immediate: {
        developerSanity: -6,
        infrastructureCost: 6,
        serverStability: 18,
        userHappiness: 8,
      },
    },
    successRate: 0.58,
    tags: ["hotfix", "deploy", "auth", "security"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -4,
        infrastructureCost: 6,
        serverStability: -8,
        userHappiness: -12,
      },
    },
    id: "action-rollback" as ActionId,
    emojiKey: "deploy",
    kind: "vote",
    label: "Rollback deploy",
    risk: "medium",
    success: {
      immediate: {
        infrastructureCost: 4,
        serverStability: 16,
        userHappiness: 6,
      },
    },
    successRate: 0.72,
    tags: ["rollback", "deploy"],
  },
  {
    failure: {
      delayedEffects: [
        {
          developerSanity: -8,
          serverStability: -14,
          userHappiness: -16,
        },
      ],
      immediate: {
        serverStability: -6,
        userHappiness: -10,
      },
    },
    id: "action-ignore" as ActionId,
    emojiKey: "warning",
    kind: "vote",
    label: "Ignore alert",
    risk: "critical",
    success: {
      immediate: {
        developerSanity: 4,
      },
    },
    successRate: 0.18,
    tags: ["ignore"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -8,
        infrastructureCost: 10,
        serverStability: -10,
        userHappiness: -8,
      },
    },
    id: "action-scale-capacity" as ActionId,
    emojiKey: "backend",
    kind: "vote",
    label: "Scale capacity",
    risk: "low",
    success: {
      immediate: {
        infrastructureCost: 12,
        serverStability: 14,
        userHappiness: 5,
      },
    },
    successRate: 0.76,
    tags: ["scale", "restart"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -10,
        serverStability: -12,
        userHappiness: -18,
      },
    },
    id: "action-lockdown" as ActionId,
    emojiKey: "security",
    kind: "vote",
    label: "Lock down access",
    risk: "high",
    success: {
      immediate: {
        developerSanity: -4,
        serverStability: 10,
        userHappiness: 6,
      },
    },
    successRate: 0.64,
    tags: ["security", "auth"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -6,
        infrastructureCost: 8,
        serverStability: -12,
        userHappiness: -8,
      },
    },
    id: "action-drain-traffic" as ActionId,
    emojiKey: "backend",
    kind: "vote",
    label: "Drain traffic",
    risk: "medium",
    success: {
      immediate: {
        infrastructureCost: 6,
        serverStability: 13,
        userHappiness: 4,
      },
    },
    successRate: 0.7,
    tags: ["scale", "restart"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -9,
        infrastructureCost: 7,
        serverStability: -15,
        userHappiness: -10,
      },
    },
    id: "action-flush-cache" as ActionId,
    emojiKey: "database",
    kind: "vote",
    label: "Flush cache",
    risk: "medium",
    success: {
      immediate: {
        infrastructureCost: 3,
        serverStability: 15,
        userHappiness: 5,
      },
    },
    successRate: 0.66,
    tags: ["cache", "restart", "scale"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -12,
        infrastructureCost: 10,
        serverStability: -20,
        userHappiness: -12,
      },
    },
    id: "action-replay-migration" as ActionId,
    emojiKey: "database",
    kind: "vote",
    label: "Replay migration",
    risk: "critical",
    success: {
      immediate: {
        developerSanity: -8,
        infrastructureCost: 8,
        serverStability: 20,
        userHappiness: 7,
      },
    },
    successRate: 0.5,
    tags: ["database", "deploy", "hotfix"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -8,
        serverStability: -12,
        userHappiness: -14,
      },
    },
    id: "action-rotate-keys" as ActionId,
    emojiKey: "security",
    kind: "vote",
    label: "Rotate keys",
    risk: "high",
    success: {
      immediate: {
        developerSanity: -5,
        infrastructureCost: 4,
        serverStability: 12,
        userHappiness: 6,
      },
    },
    successRate: 0.62,
    tags: ["auth", "security"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -6,
        serverStability: -14,
        userHappiness: -10,
      },
    },
    id: "action-disable-feature-flag" as ActionId,
    emojiKey: "deploy",
    kind: "vote",
    label: "Disable flag",
    risk: "low",
    success: {
      immediate: {
        serverStability: 10,
        userHappiness: 3,
      },
    },
    successRate: 0.78,
    tags: ["deploy", "rollback"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -4,
        infrastructureCost: 2,
        serverStability: -4,
      },
    },
    id: "action-check-metrics" as ActionId,
    emojiKey: "status",
    kind: "instant",
    label: "Check metrics",
    risk: "low",
    success: {
      immediate: {
        developerSanity: -1,
      },
    },
    successRate: 1,
    tags: ["metrics", "inspect", "scale"],
  },
  {
    failure: {
      immediate: {
        developerSanity: -4,
        serverStability: -4,
      },
    },
    id: "action-trace-request" as ActionId,
    emojiKey: "logs",
    kind: "instant",
    label: "Trace request",
    risk: "low",
    success: {
      immediate: {
        developerSanity: -1,
      },
    },
    successRate: 1,
    tags: ["trace", "inspect", "auth", "deploy"],
  },
  {
    emojiKey: "backend",
    failure: {
      immediate: {
        developerSanity: -7,
        infrastructureCost: 6,
        serverStability: -12,
        userHappiness: -8,
      },
    },
    id: "action-restart-api" as ActionId,
    kind: "vote",
    label: "Restart API",
    risk: "medium",
    success: {
      immediate: {
        infrastructureCost: 3,
        serverStability: 13,
        userHappiness: 4,
      },
    },
    successRate: 0.7,
    tags: ["restart", "rate-limit", "scale"],
  },
  {
    emojiKey: "backend",
    failure: {
      immediate: {
        developerSanity: -8,
        infrastructureCost: 8,
        serverStability: -14,
        userHappiness: -7,
      },
    },
    id: "action-scale-workers" as ActionId,
    kind: "vote",
    label: "Scale workers",
    risk: "low",
    success: {
      immediate: {
        infrastructureCost: 10,
        serverStability: 12,
        userHappiness: 5,
      },
    },
    successRate: 0.74,
    tags: ["workers", "queue", "scale"],
  },
  {
    emojiKey: "backend",
    failure: {
      immediate: {
        developerSanity: -6,
        infrastructureCost: 5,
        serverStability: -10,
        userHappiness: -9,
      },
    },
    id: "action-drain-queue" as ActionId,
    kind: "vote",
    label: "Drain queue",
    risk: "medium",
    success: {
      immediate: {
        infrastructureCost: 5,
        serverStability: 10,
        userHappiness: 8,
      },
    },
    successRate: 0.69,
    tags: ["queue", "workers"],
  },
  {
    emojiKey: "database",
    failure: {
      immediate: {
        developerSanity: -10,
        infrastructureCost: 9,
        serverStability: -18,
        userHappiness: -10,
      },
    },
    id: "action-promote-replica" as ActionId,
    kind: "vote",
    label: "Promote replica",
    risk: "high",
    success: {
      immediate: {
        infrastructureCost: 8,
        serverStability: 18,
        userHappiness: 6,
      },
    },
    successRate: 0.6,
    tags: ["database", "fallback"],
  },
  {
    emojiKey: "frontend",
    failure: {
      immediate: {
        developerSanity: -7,
        infrastructureCost: 4,
        serverStability: -8,
        userHappiness: -14,
      },
    },
    id: "action-rebuild-frontend" as ActionId,
    kind: "vote",
    label: "Rebuild frontend",
    risk: "medium",
    success: {
      immediate: {
        serverStability: 9,
        userHappiness: 13,
      },
    },
    successRate: 0.71,
    tags: ["frontend", "deploy", "hotfix"],
  },
  {
    emojiKey: "deploy",
    failure: {
      immediate: {
        developerSanity: -8,
        infrastructureCost: 3,
        serverStability: -10,
        userHappiness: -8,
      },
    },
    id: "action-enable-fallback" as ActionId,
    kind: "vote",
    label: "Enable fallback",
    risk: "low",
    success: {
      immediate: {
        infrastructureCost: 5,
        serverStability: 10,
        userHappiness: 7,
      },
    },
    successRate: 0.77,
    tags: ["fallback", "provider", "payments"],
  },
  {
    emojiKey: "deploy",
    failure: {
      immediate: {
        developerSanity: -6,
        infrastructureCost: 6,
        serverStability: -9,
        userHappiness: -12,
      },
    },
    id: "action-switch-provider" as ActionId,
    kind: "vote",
    label: "Switch provider",
    risk: "high",
    success: {
      immediate: {
        infrastructureCost: 10,
        serverStability: 14,
        userHappiness: 10,
      },
    },
    successRate: 0.57,
    tags: ["provider", "payments", "fallback"],
  },
  {
    emojiKey: "backend",
    failure: {
      immediate: {
        developerSanity: -8,
        infrastructureCost: 4,
        serverStability: -11,
        userHappiness: -9,
      },
    },
    id: "action-retry-failed-jobs" as ActionId,
    kind: "vote",
    label: "Retry failed jobs",
    risk: "medium",
    success: {
      immediate: {
        infrastructureCost: 3,
        serverStability: 9,
        userHappiness: 7,
      },
    },
    successRate: 0.68,
    tags: ["queue", "webhook", "workers"],
  },
  {
    emojiKey: "security",
    failure: {
      immediate: {
        developerSanity: -8,
        serverStability: -10,
        userHappiness: -9,
      },
    },
    id: "action-reissue-tokens" as ActionId,
    kind: "vote",
    label: "Reissue tokens",
    risk: "medium",
    success: {
      immediate: {
        developerSanity: -3,
        serverStability: 11,
        userHappiness: 8,
      },
    },
    successRate: 0.66,
    tags: ["auth", "oauth", "security"],
  },
  {
    emojiKey: "database",
    failure: {
      immediate: {
        developerSanity: -12,
        infrastructureCost: 6,
        serverStability: -18,
        userHappiness: -10,
      },
    },
    id: "action-patch-migration" as ActionId,
    kind: "vote",
    label: "Patch migration",
    risk: "high",
    success: {
      immediate: {
        developerSanity: -6,
        infrastructureCost: 4,
        serverStability: 17,
        userHappiness: 7,
      },
    },
    successRate: 0.55,
    tags: ["database", "deploy", "hotfix"],
  },
];

