import type { Action, ActionTag } from "./action.js";
import type {
	ActionId,
	IncidentId,
	IncidentTemplateId,
	UnixMillis,
} from "./ids.js";

export type IncidentCategory =
	| "authentication"
	| "deployment"
	| "infrastructure"
	| "payments"
	| "performance"
	| "security";

export type IncidentSeverity =
	| "critical"
	| "high"
	| "low"
	| "medium";

export type IncidentStatus =
	| "active"
	| "expired"
	| "failed"
	| "resolved"
	| "voting";

export interface IncidentTemplate {
	readonly actionTags: readonly ActionTag[];
	readonly affectedServices: readonly string[];
	readonly category: IncidentCategory;
	readonly descriptions: readonly string[];
	readonly id: IncidentTemplateId;
	readonly rootCauses: readonly string[];
	readonly severityRange: readonly IncidentSeverity[];
	readonly tags: readonly string[];
	readonly titles: readonly string[];
	readonly weight: number;
}

export interface Incident {
	readonly actionOptions: readonly Action[];
	readonly affectedServices: readonly string[];
	readonly category: IncidentCategory;
	readonly createdAt: UnixMillis;
	readonly description: string;
	readonly id: IncidentId;
	readonly instantActionOptions: readonly Action[];
	readonly rootCause: string;
	readonly selectedActionId?: ActionId;
	readonly severity: IncidentSeverity;
	readonly status: IncidentStatus;
	readonly templateId: IncidentTemplateId;
	readonly title: string;
	readonly votingClosesAt?: UnixMillis;
}
