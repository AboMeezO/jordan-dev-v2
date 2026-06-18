import { AttachmentBuilder } from "discord.js";

import type { ChatCommandDefinition } from "./types.js";

const MAX_INLINE_LENGTH = 1900;
const MAX_ATTACHMENT_LENGTH = 8_000_000;

const EVERYONE_PATTERN = /@everyone/g;
const HERE_PATTERN = /@here/g;
const USER_MENTION_PATTERN = /<@!?\d{17,20}>/g;
const ROLE_MENTION_PATTERN = /<@&\d{17,20}>/g;
const CHANNEL_MENTION_PATTERN = /<#\d{17,20}>/g;

export function escapeMentions(text: string): string {
	return text
		.replace(EVERYONE_PATTERN, "@\u200beveryone")
		.replace(HERE_PATTERN, "@\u200bhere")
		.replace(USER_MENTION_PATTERN, (match) => {
			const id = match.replace(/[<@!>]/g, "");
			return `<@\u200b${id}>`;
		})
		.replace(ROLE_MENTION_PATTERN, (match) => {
			const id = match.replace(/[<@&>]/g, "");
			return `<@&\u200b${id}>`;
		})
		.replace(CHANNEL_MENTION_PATTERN, (match) => {
			const id = match.replace(/[<#>]/g, "");
			return `<#\u200b${id}>`;
		});
}

export function safeInline(
	text: string,
	maxLength = MAX_INLINE_LENGTH,
): string {
	return escapeMentions(text).slice(0, maxLength);
}

export function safeCodeBlock(
	text: string,
	language = "",
	maxLength = MAX_INLINE_LENGTH,
): string {
	const escaped = escapeMentions(text);
	const codeFence = `\`\`\`${language}\n`;
	const available =
		maxLength - codeFence.length - "\n```".length;
	const content = escaped.slice(0, available);

	return `${codeFence}${content}\n\`\`\``;
}

export function ansiShellOutput(
	lines: readonly string[],
	maxLength = MAX_INLINE_LENGTH,
): string {
	const escaped = lines.map((line) => escapeMentions(line));
	const content = escaped
		.join("\n")
		.slice(0, maxLength - "```ansi\n\n```".length);

	return `\`\`\`ansi\n${content}\n\`\`\``;
}

export type SafeOutputResult =
	| { readonly content: string }
	| { readonly attachment: AttachmentBuilder };

export function safeOutput(
	text: string,
	command?: ChatCommandDefinition,
): SafeOutputResult {
	const escaped = escapeMentions(text);
	const maxLength =
		command?.inputLimits?.maxOutputLength ??
		MAX_ATTACHMENT_LENGTH;

	if (escaped.length <= MAX_INLINE_LENGTH) {
		return { content: escaped.slice(0, MAX_INLINE_LENGTH) };
	}

	const truncated = escaped.slice(
		0,
		Math.min(
			escaped.length,
			MAX_ATTACHMENT_LENGTH,
			maxLength,
		),
	);
	const attachment = new AttachmentBuilder(
		Buffer.from(truncated, "utf-8"),
		{
			name: "output.txt",
		},
	);

	return { attachment };
}

export function errorOutput(message: string): string {
	return escapeMentions(message).slice(
		0,
		MAX_INLINE_LENGTH,
	);
}

export function unknownErrorOutput(): string {
	return "An unexpected error occurred. Please try again later.";
}

export function formatErrorBoundary(
	error: unknown,
): string {
	const message =
		error instanceof Error ? error.message : String(error);

	if (
		message.includes("stack") ||
		message.includes("SyntaxError") ||
		message.includes("ReferenceError") ||
		message.includes("TypeError")
	) {
		return "An unexpected error occurred. Please try again later.";
	}

	return escapeMentions(message).slice(
		0,
		MAX_INLINE_LENGTH,
	);
}
