import type {
	Action,
	GameSession,
	Incident,
	IncidentSeverity,
	IncidentTemplate,
	RandomSource,
	UnixMillis,
} from "../../../index.js";
import type { IdGenerator } from "../../../ports/index.js";

const SEVERITY_RANK: Readonly<
	Record<IncidentSeverity, number>
> = {
	low: 1,
	medium: 2,
	high: 3,
	critical: 4,
};

export class IncidentEngine {
	public constructor(
		private readonly templates: readonly IncidentTemplate[],
		private readonly randomSource: RandomSource,
		private readonly idGenerator: IdGenerator,
	) {}

	public createIncident(
		template: IncidentTemplate,
		createdAt: UnixMillis,
		severity: IncidentSeverity,
		actionOptions: readonly Action[],
		instantActionOptions: readonly Action[],
		voteWindowMs: number,
	): Incident {
		return {
			actionOptions,
			affectedServices: [
				this.pick(template.affectedServices),
			],
			category: template.category,
			createdAt,
			description: this.pick(template.descriptions),
			id: this.idGenerator.createIncidentId(),
			instantActionOptions,
			rootCause: this.pick(template.rootCauses),
			severity,
			status: "voting",
			templateId: template.id,
			title: this.pick(template.titles),
			votingClosesAt: (createdAt +
				voteWindowMs) as UnixMillis,
		};
	}

	public selectTemplate(
		session: GameSession,
	): IncidentTemplate {
		const activeTemplateIds =
			session.state.status === "running" ||
			session.state.status === "paused" ||
			session.state.status === "recovering"
				? new Set(
						[...session.state.activeIncidents.values()].map(
							(incident) => incident.templateId,
						),
					)
				: new Set<IncidentTemplate["id"]>();
		const eligible = this.templates.filter(
			(template) => !activeTemplateIds.has(template.id),
		);
		const candidates =
			eligible.length > 0 ? eligible : this.templates;
		const totalWeight = candidates.reduce(
			(sum, template) => sum + template.weight,
			0,
		);
		let roll = this.randomSource.nextFloat() * totalWeight;

		for (const template of candidates) {
			roll -= template.weight;

			if (roll <= 0) {
				return template;
			}
		}

		const fallback = candidates.at(-1);

		if (fallback === undefined) {
			throw new Error(
				"Incident template catalog cannot be empty.",
			);
		}

		return fallback;
	}

	public selectSeverity(
		template: IncidentTemplate,
		session: GameSession,
		escalationLevel: number,
	): IncidentSeverity {
		const pressure =
			escalationLevel +
			(session.stats.serverStability < 50 ? 1 : 0) +
			(session.stats.userHappiness < 50 ? 1 : 0);
		const sorted = [...template.severityRange].sort(
			(left, right) =>
				SEVERITY_RANK[left] - SEVERITY_RANK[right],
		);
		const index = Math.min(
			sorted.length - 1,
			Math.floor(pressure / 2),
		);
		const severity = sorted[index];

		if (severity === undefined) {
			throw new Error(
				"Incident template must include at least one severity.",
			);
		}

		return severity;
	}

	private pick<TValue>(values: readonly TValue[]): TValue {
		const value =
			values[
				this.randomSource.nextInteger(0, values.length - 1)
			];

		if (value === undefined) {
			throw new Error("Cannot pick from an empty catalog.");
		}

		return value;
	}
}
