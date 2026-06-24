import { existsSync, readFileSync } from "node:fs";

import { config as loadDotenv } from "dotenv";

import { autoSync } from "./auto-sync.js";
import { envToNestedObject, parseEnvFile } from "./dotenv-loader.js";
import { compileSchema } from "./schema.js";
import { yamlFileExists, loadYamlFile } from "./yaml-utils.js";
import type { CompiledSchema } from "./schema.js";

export interface CreateConfigOptions {
	configPath?: string | undefined;
	schemaPath?: string | undefined;
	env?: Record<string, string | undefined> | undefined;
	autoSyncEnabled?: boolean | undefined;
	envFilePath?: string | undefined;
}

export interface Config {
	get<T = unknown>(path: string): T;
	getAll(): Record<string, unknown>;
	validate(): void;
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = { ...target };
	for (const [key, value] of Object.entries(source)) {
		if (
			typeof value === "object" &&
			value !== null &&
			!Array.isArray(value) &&
			typeof result[key] === "object" &&
			result[key] !== null &&
			!Array.isArray(result[key])
		) {
			result[key] = deepMerge(
				result[key] as Record<string, unknown>,
				value as Record<string, unknown>,
			);
		} else {
			result[key] = value;
		}
	}
	return result;
}

function getNested(obj: Record<string, unknown>, path: string): unknown {
	const parts = path.split(".");
	let current: unknown = obj;
	for (const part of parts) {
		if (typeof current !== "object" || current === null) return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return current;
}

export function createConfig(options: CreateConfigOptions): Config {
	let compiledSchema: CompiledSchema | null = null;
	let merged: Record<string, unknown> = {};
	let validated = false;

	if (options.schemaPath) {
		compiledSchema = compileSchema(options.schemaPath);
		merged = { ...compiledSchema.defaults };
	}

	if (options.autoSyncEnabled && options.configPath && compiledSchema) {
		merged = autoSync(options.configPath, compiledSchema.defaults);
	} else if (options.configPath && yamlFileExists(options.configPath)) {
		const configData = loadYamlFile(options.configPath);
		merged = deepMerge(merged, configData);
	}

	const envObj: Record<string, string> = {};

	if (options.envFilePath && existsSync(options.envFilePath)) {
		const envContent = readFileSync(options.envFilePath, "utf-8");
		const parsed = parseEnvFile(envContent);
		Object.assign(envObj, parsed);
	}

	const runtimeEnv = options.env;
	if (runtimeEnv) {
		for (const [key, value] of Object.entries(runtimeEnv)) {
			if (value !== undefined) {
				envObj[key] = value;
			}
		}
	}

	if (Object.keys(envObj).length > 0) {
		const envConfig = envToNestedObject(envObj);
		for (const [key, value] of Object.entries(envConfig)) {
			if (
				typeof value === "object" &&
				value !== null &&
				!Array.isArray(value) &&
				typeof merged[key] === "object" &&
				merged[key] !== null &&
				!Array.isArray(merged[key])
			) {
				merged[key] = deepMerge(
					merged[key] as Record<string, unknown>,
					value as Record<string, unknown>,
				);
			} else {
				merged[key] = value;
			}
		}
	}

	return {
		get<T = unknown>(path: string): T {
			return getNested(merged, path) as T;
		},
		getAll(): Record<string, unknown> {
			return merged;
		},
		validate(): void {
			if (validated) return;
			if (!compiledSchema) return;
			const result = compiledSchema.schema.safeParse(merged);
			if (!result.success) {
			const issues = result.error.issues ?? [];
			const lines = issues.map((e) => `  ${e.path.map(String).join(".")}: ${e.message}`);
			throw new Error(`Config validation failed:\n${lines.join("\n")}`);
		}
			merged = result.data as Record<string, unknown>;
			validated = true;
		},
	};
}
