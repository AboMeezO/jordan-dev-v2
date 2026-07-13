import {
	loadYamlFile,
	writeYamlFile,
	yamlFileExists,
} from "./yaml-utils.js";

export function findMissingKeys(
	config: Record<string, unknown>,
	schemaDefaults: Record<string, unknown>,
	prefix = "",
): string[] {
	const missing: string[] = [];
	for (const [key, defaultValue] of Object.entries(
		schemaDefaults,
	)) {
		const fullPath = prefix ? `${prefix}.${key}` : key;
		const configValue = config[key];
		if (configValue === undefined) {
			missing.push(fullPath);
		} else if (
			typeof defaultValue === "object" &&
			defaultValue !== null &&
			!Array.isArray(defaultValue)
		) {
			if (
				typeof configValue !== "object" ||
				configValue === null
			) {
				missing.push(fullPath);
			} else {
				missing.push(
					...findMissingKeys(
						configValue as Record<string, unknown>,
						defaultValue as Record<string, unknown>,
						fullPath,
					),
				);
			}
		}
	}
	return missing;
}

export function mergeDefaults(
	config: Record<string, unknown>,
	defaults: Record<string, unknown>,
): Record<string, unknown> {
	const result: Record<string, unknown> = { ...config };
	for (const [key, defaultValue] of Object.entries(
		defaults,
	)) {
		if (!(key in result) || result[key] === undefined) {
			result[key] = defaultValue;
		} else if (
			typeof defaultValue === "object" &&
			defaultValue !== null &&
			!Array.isArray(defaultValue)
		) {
			const configValue = result[key];
			if (
				typeof configValue === "object" &&
				configValue !== null &&
				!Array.isArray(configValue)
			) {
				result[key] = mergeDefaults(
					configValue as Record<string, unknown>,
					defaultValue as Record<string, unknown>,
				);
			}
		}
	}
	return result;
}

export function autoSync(
	configPath: string,
	schemaDefaults: Record<string, unknown>,
): Record<string, unknown> {
	let config: Record<string, unknown> = {};
	if (yamlFileExists(configPath)) {
		config = loadYamlFile(configPath);
	}

	const merged = mergeDefaults(config, schemaDefaults);
	const missing = findMissingKeys(config, schemaDefaults);

	if (missing.length > 0) {
		writeYamlFile(configPath, merged);
	}

	return merged;
}

function deepSet(
	obj: Record<string, unknown>,
	path: readonly string[],
	value: unknown,
): void {
	let current = obj;
	for (let i = 0; i < path.length - 1; i++) {
		const segment = path[i]!;
		if (
			!(segment in current) ||
			typeof current[segment] !== "object" ||
			current[segment] === null
		) {
			current[segment] = {};
		}
		current = current[segment] as Record<string, unknown>;
	}
	current[path[path.length - 1]!] = value;
}

function deepHas(
	obj: Record<string, unknown>,
	path: readonly string[],
): boolean {
	let current: unknown = obj;
	for (const segment of path) {
		if (typeof current !== "object" || current === null)
			return false;
		current = (current as Record<string, unknown>)[segment];
		if (current === undefined) return false;
	}
	return true;
}

export function syncConfigWithSchema(
	configPath: string,
	flatKeys: Map<
		string,
		{ type: string; required: boolean; default?: unknown }
	>,
): Record<string, unknown> {
	let config: Record<string, unknown> = {};
	if (yamlFileExists(configPath)) {
		config = loadYamlFile(configPath);
	}

	const result: Record<string, unknown> = JSON.parse(
		JSON.stringify(config),
	);
	const added: string[] = [];

	for (const [flatPath, info] of flatKeys) {
		const parts = flatPath.split(".");
		if (!deepHas(result, parts)) {
			const value =
				info.default !== undefined ? info.default : null;
			deepSet(result, parts, value);
			added.push(flatPath);
		}
	}

	if (added.length > 0) {
		writeYamlFile(configPath, result);
	}

	return result;
}
