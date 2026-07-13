import { MessageFlags } from "discord.js";

export function componentsV2Flags(): [
	typeof MessageFlags.IsComponentsV2,
] {
	return [MessageFlags.IsComponentsV2];
}

export function componentsV2EphemeralFlags(): [
	typeof MessageFlags.IsComponentsV2,
	typeof MessageFlags.Ephemeral,
] {
	return [
		MessageFlags.IsComponentsV2,
		MessageFlags.Ephemeral,
	];
}
