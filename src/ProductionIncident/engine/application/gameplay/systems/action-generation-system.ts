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
      action.kind === "vote" &&
      action.tags.some((tag) => template.actionTags.includes(tag)),
    );
    const count = severity === "critical" ? 4 : 3;
    const sorted = [...matching].sort((left, right) => {
      const scoreDelta =
        this.scoreAction(right, template, severity) -
        this.scoreAction(left, template, severity);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return left.label.localeCompare(right.label);
    });

    return sorted.slice(0, count);
  }

  public selectInstantActions(template: IncidentTemplate): readonly Action[] {
    return this.actions
      .filter((action) =>
        action.kind === "instant" &&
        action.tags.some((tag) => template.actionTags.includes(tag)),
      )
      .slice(0, 2);
  }

  private scoreAction(
    action: Action,
    template: IncidentTemplate,
    severity: IncidentSeverity,
  ): number {
    const tagOverlap = action.tags.filter((tag) => template.actionTags.includes(tag)).length;
    const riskFit = severity === "low"
      ? 5 - RISK_RANK[action.risk]
      : RISK_RANK[action.risk];
    return tagOverlap * 10 + riskFit;
  }
}

export { RISK_RANK };
