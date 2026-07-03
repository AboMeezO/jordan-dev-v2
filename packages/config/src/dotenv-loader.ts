import { existsSync, readFileSync, writeFileSync } from "node:fs";

export function parseEnvFile(content: string): Record<string, string> {
	const vars: Record<string, string> = {};
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const eqIndex = trimmed.indexOf("=");
		if (eqIndex === -1) continue;
		const key = trimmed.slice(0, eqIndex).trim();
		let value = trimmed.slice(eqIndex + 1).trim();
		if (!key) continue;
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		vars[key] = value;
	}
	return vars;
}

function setNested(obj: Record<string, unknown>, path: readonly string[], value: string): void {
	let current = obj;
	for (let i = 0; i < path.length - 1; i++) {
		const segment = path[i]!;
		if (!(segment in current) || typeof current[segment] !== "object" || current[segment] === null) {
			current[segment] = {};
		}
		current = current[segment] as Record<string, unknown>;
	}
	const lastKey = path[path.length - 1]!;
	current[lastKey] = value;
}

export function envToNestedObject(
	envVars: Record<string, string>,
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(envVars)) {
		if (key.includes(".")) {
			const parts = key.split(".");
			setNested(result, parts, value);
		} else {
			result[key] = value;
		}
	}
	return result;
}

export function syncEnvFile(
	envFilePath: string,
	flatKeys: Map<string, { type: string; required: boolean; default?: unknown }>,
): void {
	const existingKeys = new Set<string>();
	let existingContent = "";

	if (existsSync(envFilePath)) {
		existingContent = readFileSync(envFilePath, "utf-8");
		const parsed = parseEnvFile(existingContent);
		for (const key of Object.keys(parsed)) {
			existingKeys.add(key);
		}
	}

	const linesToAdd: string[] = [];
	for (const [flatPath, info] of flatKeys) {
		if (!existingKeys.has(flatPath)) {
			const value = info.default !== undefined ? String(info.default) : "";
			linesToAdd.push(`${flatPath}=${value}`);
		}
	}

	if (linesToAdd.length === 0) return;

	let content = existingContent;
	if (content.length > 0 && !content.endsWith("\n")) {
		content += "\n";
	}
	if (content.length > 0) {
		content += "\n";
	}
	content += linesToAdd.join("\n") + "\n";

	writeFileSync(envFilePath, content, "utf-8");
}
