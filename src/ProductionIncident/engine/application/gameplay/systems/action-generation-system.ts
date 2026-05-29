import type {
  Action,
  ActionRiskLevel,
  IncidentSeverity,
  IncidentTemplate,
} from "../../../domain/index.js";

const RISK_RANK: Readonly<Record<ActionRiskLevel, number>> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export class ActionGenerationSystem {
  public constructor(private readonly actions: readonly Action[]) {}

  public selectActions(
    template: IncidentTemplate,
    severity: IncidentSeverity,
  ): readonly Action[] {
    const matching = this.actions.filter((action) =>
      action.tags.some((tag) => template.actionTags.includes(tag)),
    );
    const sorted = [...matching].sort((left, right) => {
      const riskDelta = RISK_RANK[left.risk] - RISK_RANK[right.risk];
      return riskDelta === 0 ? left.label.localeCompare(right.label) : riskDelta;
    });
    const count = severity === "critical" ? 4 : 3;

    return sorted.slice(0, count);
  }
}

export { RISK_RANK };

