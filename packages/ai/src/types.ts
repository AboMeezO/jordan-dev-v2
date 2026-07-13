import type { generateText, Schema, Tool } from "ai";
import type { Message } from "discord.js";
import type { z } from "zod";
import type { z as z3 } from "zod/v3";
import type { AiContext } from "./context.js";
export type { AiContext } from "./context.js";

export type AIGenerateResult = Awaited<ReturnType<typeof generateText>>;

export type SelectAiModel = (
	ctx: AiContext,
	message: Message,
) => Promise<SelectAiModelResult>;

export type SelectAiModelResult = Omit<
	Parameters<typeof generateText>[0],
	"messages" | "prompt"
>;

export interface ConfigureAI {
	disableBuiltInTools?: boolean;

	messageFilter?: (
		ctx: AiContext,
		message: Message,
	) => Promise<boolean>;

	selectAiModel: SelectAiModel;

	prepareSystemPrompt?: (
		ctx: AiContext,
		message: Message,
	) => Promise<string>;

	preparePrompt?: (
		ctx: AiContext,
		message: Message,
	) => Promise<string | AiMessage>;

	onProcessingStart?: (
		ctx: AiContext,
		message: Message,
	) => Promise<void>;

	onProcessingFinish?: (
		ctx: AiContext,
		message: Message,
	) => Promise<void>;

	onResult?: (
		ctx: AiContext,
		message: Message,
		result: AIGenerateResult,
	) => Promise<void>;

	onError?: (
		ctx: AiContext,
		message: Message,
		error: Error,
	) => Promise<void>;
}

export type AiMessage = Parameters<typeof generateText>[0]["messages"] & {};

export type ToolParameterType = z.ZodType | z3.ZodType | Schema<any>;

export type InferParameters<T extends ToolParameterType> =
	T extends Schema<any>
		? T["_type"]
		: T extends z.ZodTypeAny
			? z.infer<T>
			: T extends z3.ZodTypeAny
				? z3.infer<T>
				: never;

export interface CreateToolOptions<T extends ToolParameterType, R = unknown> {
	name: string;
	description: string;
	inputSchema: T;
	execute: ToolExecuteFunction<T, R>;
}

export type ToolExecuteFunction<T extends ToolParameterType, R> = (
	ctx: AiContext,
	input: InferParameters<T>,
) => R | Promise<R>;
