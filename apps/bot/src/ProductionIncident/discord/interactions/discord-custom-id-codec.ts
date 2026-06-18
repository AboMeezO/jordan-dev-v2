import type {
	ActionId,
	IncidentId,
	PlayerId,
	SessionId,
} from "../../engine/index.js";

const CUSTOM_ID_NAMESPACE = "pi";
const CUSTOM_ID_VERSION = "v1";
const DISCORD_CUSTOM_ID_MAX_LENGTH = 100;

export type DiscordActionRouteKey = string & {
	readonly __brand: "DiscordActionRouteKey";
};

export interface DecodedDiscordActionCustomId {
	readonly key: DiscordActionRouteKey;
	readonly kind: "action" | "instant";
	readonly version: typeof CUSTOM_ID_VERSION;
}

export interface DecodedDiscordVoteCustomId {
	readonly actionId: ActionId;
	readonly incidentId: IncidentId;
	readonly kind: "vote";
	readonly sessionId: SessionId;
	readonly version: typeof CUSTOM_ID_VERSION;
}

export type DiscordLobbyAction =
	| "cancel"
	| "end"
	| "join"
	| "start";

export interface DecodedDiscordLobbyCustomId {
	readonly action: DiscordLobbyAction;
	readonly kind: "lobby";
	readonly sessionId: SessionId;
	readonly version: typeof CUSTOM_ID_VERSION;
}

export class DiscordCustomIdCodec {
	public decodeAction(
		customId: string,
	): DecodedDiscordActionCustomId {
		return this.decodeRouteKey(customId, "a", "action");
	}

	public decodeInstant(
		customId: string,
	): DecodedDiscordActionCustomId {
		return this.decodeRouteKey(customId, "i", "instant");
	}

	private decodeRouteKey(
		customId: string,
		expectedKind: "a" | "i",
		decodedKind: DecodedDiscordActionCustomId["kind"],
	): DecodedDiscordActionCustomId {
		const parts = customId.split(":");

		if (
			parts.length !== 4 ||
			parts[0] !== CUSTOM_ID_NAMESPACE ||
			parts[1] !== CUSTOM_ID_VERSION ||
			parts[2] !== expectedKind
		) {
			throw new Error(
				"Invalid Production Incident route custom ID.",
			);
		}

		const [, version, kind, key] = parts;

		if (
			version !== CUSTOM_ID_VERSION ||
			kind !== expectedKind ||
			key === undefined ||
			!isCompactKey(key)
		) {
			throw new Error(
				"Route custom ID is missing a valid key.",
			);
		}

		return {
			key: key,
			kind: decodedKind,
			version,
		};
	}

	public decodeLobby(
		customId: string,
	): DecodedDiscordLobbyCustomId {
		const parts = customId.split(":");

		if (
			parts.length !== 5 ||
			parts[0] !== CUSTOM_ID_NAMESPACE ||
			parts[1] !== CUSTOM_ID_VERSION ||
			parts[2] !== "lobby"
		) {
			throw new Error(
				"Invalid Production Incident lobby custom ID.",
			);
		}

		const [, version, kind, sessionId, action] = parts;

		if (
			version !== CUSTOM_ID_VERSION ||
			kind !== "lobby" ||
			sessionId === undefined ||
			sessionId.length === 0 ||
			!isLobbyAction(action)
		) {
			throw new Error(
				"Lobby custom ID is missing required identifiers.",
			);
		}

		return {
			action,
			kind,
			sessionId: sessionId as SessionId,
			version,
		};
	}

	public decodeVote(
		customId: string,
	): DecodedDiscordVoteCustomId {
		const parts = customId.split(":");

		if (
			parts.length !== 6 ||
			parts[0] !== CUSTOM_ID_NAMESPACE ||
			parts[1] !== CUSTOM_ID_VERSION ||
			parts[2] !== "vote"
		) {
			throw new Error(
				"Invalid Production Incident vote custom ID.",
			);
		}

		const [
			,
			version,
			kind,
			sessionId,
			incidentId,
			actionId,
		] = parts;

		if (
			version !== CUSTOM_ID_VERSION ||
			kind !== "vote" ||
			sessionId === undefined ||
			sessionId.length === 0 ||
			incidentId === undefined ||
			incidentId.length === 0 ||
			actionId === undefined ||
			actionId.length === 0
		) {
			throw new Error(
				"Vote custom ID is missing required identifiers.",
			);
		}

		return {
			actionId: actionId as ActionId,
			incidentId: incidentId as IncidentId,
			kind,
			sessionId: sessionId as SessionId,
			version,
		};
	}

	public encodeVote(input: {
		readonly actionId: ActionId;
		readonly incidentId: IncidentId;
		readonly sessionId: SessionId;
	}): string {
		return this.assertCustomIdLength(
			[
				CUSTOM_ID_NAMESPACE,
				CUSTOM_ID_VERSION,
				"vote",
				input.sessionId,
				input.incidentId,
				input.actionId,
			].join(":"),
		);
	}

	public encodeLobby(input: {
		readonly action: DiscordLobbyAction;
		readonly sessionId: SessionId;
	}): string {
		return this.assertCustomIdLength(
			[
				CUSTOM_ID_NAMESPACE,
				CUSTOM_ID_VERSION,
				"lobby",
				input.sessionId,
				input.action,
			].join(":"),
		);
	}

	public encodeAction(input: {
		readonly key: DiscordActionRouteKey;
	}): string {
		return this.encodeRouteKey("a", input.key);
	}

	public encodeInstant(input: {
		readonly key: DiscordActionRouteKey;
	}): string {
		return this.encodeRouteKey("i", input.key);
	}

	private encodeRouteKey(
		kind: "a" | "i",
		key: DiscordActionRouteKey,
	): string {
		if (!isCompactKey(key)) {
			throw new Error(
				"Action route key must be compact and URL-safe.",
			);
		}

		return this.assertCustomIdLength(
			[
				CUSTOM_ID_NAMESPACE,
				CUSTOM_ID_VERSION,
				kind,
				key,
			].join(":"),
		);
	}

	public playerIdFromDiscordUserId(
		userId: string,
	): PlayerId {
		if (userId.trim().length === 0) {
			throw new Error("Discord user ID must not be empty.");
		}

		return `player-${userId}` as PlayerId;
	}

	private assertCustomIdLength(customId: string): string {
		if (customId.length > DISCORD_CUSTOM_ID_MAX_LENGTH) {
			throw new Error(
				"Discord custom ID exceeds the 100 character limit.",
			);
		}

		return customId;
	}
}

function isLobbyAction(
	value: string | undefined,
): value is DiscordLobbyAction {
	return (
		value === "cancel" ||
		value === "end" ||
		value === "join" ||
		value === "start"
	);
}

function isCompactKey(
	value: string,
): value is DiscordActionRouteKey {
	return /^[A-Za-z0-9_-]{1,32}$/.test(value);
}
