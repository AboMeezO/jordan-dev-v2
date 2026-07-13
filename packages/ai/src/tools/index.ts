import type { Tool } from "ai";
import type {
	AiContext,
	InferParameters,
	ToolExecuteFunction,
	ToolParameterType,
} from "../types.js";

export function createTool<
	T extends ToolParameterType,
	R = unknown,
>(options: {
	name: string;
	description: string;
	inputSchema: T;
	execute: ToolExecuteFunction<T, R>;
}): Tool {
	return {
		description: options.description,
		inputSchema: options.inputSchema,
		execute: async (input: any) => {
			return options.execute(
				input as AiContext,
				input as InferParameters<T>,
			);
		},
	} as unknown as Tool;
}
