import type {
	Action,
	ActionId,
	Incident,
	Player,
	RoleId,
} from "../../../domain/index.js";
import type { RandomSource } from "../../../ports/index.js";
import { RISK_RANK } from "./action-generation-system.js";

export class VotingSystem {
	public constructor(
		private readonly randomSource: RandomSource,
	) {}

	public selectWinningAction(
		incident: Incident,
		votes: readonly {
			readonly actionId: ActionId;
			readonly weight: number;
		}[],
	): Action | undefined {
		if (votes.length === 0) {
			return incident.actionOptions.find((action) =>
				action.tags.includes("ignore"),
			);
		}

		const scoreByActionId = new Map<ActionId, number>();

		for (const vote of votes) {
			scoreByActionId.set(
				vote.actionId,
				(scoreByActionId.get(vote.actionId) ?? 0) +
					vote.weight,
			);
		}

		const highestScore = Math.max(
			...scoreByActionId.values(),
		);
		const tied = incident.actionOptions.filter(
			(action) =>
				scoreByActionId.get(action.id) === highestScore,
		);
		const lowestRisk = Math.min(
			...tied.map((action) => RISK_RANK[action.risk]),
		);
		const safestTied = tied.filter(
			(action) => RISK_RANK[action.risk] === lowestRisk,
		);

		return safestTied[
			this.randomSource.nextInteger(
				0,
				safestTied.length - 1,
			)
		];
	}

	public voteWeightFor(player: Player): number {
		const roleWeights: Readonly<Record<string, number>> = {
			"role-backend-engineer": 1.2,
			"role-devops": 1.35,
			"role-intern": 0.8,
			"role-qa": 1.1,
			"role-security-engineer": 1.3,
		};
		const roleId: RoleId | undefined = player.roleId;

		return roleId === undefined
			? 1
			: (roleWeights[roleId] ?? 1);
	}
}
