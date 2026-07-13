import { TextDisplayBuilder } from "discord.js";

export function buildTextDisplay(
	content: string,
): TextDisplayBuilder {
	return new TextDisplayBuilder().setContent(content);
}
