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
];
