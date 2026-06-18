import type { GameplayManager } from "../../engine/index.js";
import { DiscordCustomIdCodec } from "./discord-custom-id-codec.js";

export interface DiscordVoteInteractionDto {
	readonly customId: string;
	readonly userId: string;
}

export class DiscordInteractionRouter {
	public constructor(
		private readonly gameplayManager: GameplayManager,
		private readonly customIdCodec = new DiscordCustomIdCodec(),
	) {}

	public async handleVoteInteraction(
		interaction: DiscordVoteInteractionDto,
	): Promise<void> {
		const command = this.decodeVoteCustomId(
			interaction.customId,
			interaction.userId,
		);
		await this.gameplayManager.submitVote(command);
	}

	public decodeVoteCustomId(
		customId: string,
		userId: string,
	) {
		const decoded = this.customIdCodec.decodeVote(customId);

		return {
			actionId: decoded.actionId,
			incidentId: decoded.incidentId,
			playerId:
				this.customIdCodec.playerIdFromDiscordUserId(
					userId,
				),
			sessionId: decoded.sessionId,
		};
	}
}
