import { readFileSync, writeFileSync } from "node:fs";
import { parse, stringify } from "yaml";

export function loadYamlFile(path: string): Record<string, unknown> {
	const content = readFileSync(path, "utf-8");
	const parsed = parse(content);
	if (typeof parsed !== "object" || parsed === null) {
		return {};
	}
	return parsed as Record<string, unknown>;
}

export function writeYamlFile(path: string, data: Record<string, unknown>): void {
	writeFileSync(path, stringify(data, { lineWidth: 120 }), "utf-8");
}

export function yamlFileExists(path: string): boolean {
	try {
		readFileSync(path);
		return true;
	} catch {
		return false;
	}
}
