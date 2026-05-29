import type {
  Action,
  ActionId,
  ActionTag,
  IncidentTemplate,
  IncidentTemplateId,
} from "../domain/index.js";

export class CatalogValidationError extends Error {
  public constructor(public readonly failures: readonly string[]) {
    super(`Production Incident catalog validation failed:\n${failures.join("\n")}`);
    this.name = "CatalogValidationError";
  }
}

export function validateCatalogs(
  templates: readonly IncidentTemplate[],
  actions: readonly Action[],
): void {
  const failures = [
    ...validateActions(actions),
    ...validateTemplates(templates, new Set(actions.flatMap((action) => action.tags))),
    ...validateReachability(templates, actions),
  ];

  if (failures.length > 0) {
    throw new CatalogValidationError(failures);
  }
}

function validateActions(actions: readonly Action[]): readonly string[] {
  const failures: string[] = [];
  const seen = new Set<ActionId>();

  if (actions.length === 0) {
    failures.push("Action catalog must not be empty.");
  }

  for (const action of actions) {
    if (seen.has(action.id)) {
      failures.push(`Duplicate action ID: ${action.id}`);
    }

    seen.add(action.id);

    if (action.label.trim().length === 0) {
      failures.push(`Action ${action.id} must have a label.`);
    }

    if (action.tags.length === 0) {
      failures.push(`Action ${action.id} must include at least one tag.`);
    }

    if (action.successRate < 0 || action.successRate > 1) {
      failures.push(`Action ${action.id} successRate must be between 0 and 1.`);
    }
  }

  return failures;
}

function validateTemplates(
  templates: readonly IncidentTemplate[],
  actionTags: ReadonlySet<ActionTag>,
): readonly string[] {
  const failures: string[] = [];
  const seen = new Set<IncidentTemplateId>();

  if (templates.length === 0) {
    failures.push("Incident template catalog must not be empty.");
  }

  for (const template of templates) {
    if (seen.has(template.id)) {
      failures.push(`Duplicate incident template ID: ${template.id}`);
    }

    seen.add(template.id);

    if (template.weight <= 0 || !Number.isFinite(template.weight)) {
      failures.push(`Template ${template.id} weight must be positive.`);
    }

    if (template.severityRange.length === 0) {
      failures.push(`Template ${template.id} must include at least one severity.`);
    }

    if (template.rootCauses.length === 0) {
      failures.push(`Template ${template.id} must include root causes.`);
    }

    if (template.affectedServices.length === 0) {
      failures.push(`Template ${template.id} must include affected services.`);
    }

    if (template.titles.length === 0) {
      failures.push(`Template ${template.id} must include titles.`);
    }

    if (template.descriptions.length === 0) {
      failures.push(`Template ${template.id} must include descriptions.`);
    }

    if (template.actionTags.length === 0) {
      failures.push(`Template ${template.id} must include action tags.`);
    }

    for (const tag of template.actionTags) {
      if (!actionTags.has(tag)) {
        failures.push(`Template ${template.id} references missing action tag: ${tag}`);
      }
    }
  }

  return failures;
}

function validateReachability(
  templates: readonly IncidentTemplate[],
  actions: readonly Action[],
): readonly string[] {
  const failures: string[] = [];
  const reachableActionIds = new Set<ActionId>();

  for (const template of templates) {
    for (const action of actions) {
      if (action.tags.some((tag) => template.actionTags.includes(tag))) {
        reachableActionIds.add(action.id);
      }
    }
  }

  for (const action of actions) {
    if (!reachableActionIds.has(action.id)) {
      failures.push(`Action ${action.id} is unreachable from all templates.`);
    }
  }

  return failures;
}

