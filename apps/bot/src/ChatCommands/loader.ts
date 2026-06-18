import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { Logger } from "#Logger";
import type { ChatCommandDefinition } from "./types.js";
import { toTreeNode } from "./registry.js";
import { renderCommandTree } from "./usage-guide.js";

const log = new Logger("loader");

function isCommandShape(value: unknown): value is ChatCommandDefinition {
	return (
		typeof value === "object" &&
		value !== null &&
		"name" in value &&
		"description" in value &&
		typeof (value as Record<string, unknown>).name === "string" &&
		typeof (value as Record<string, unknown>).description === "string"
	);
}

function extractCommandDefinitions(
	exported: unknown,
): ChatCommandDefinition[] {
	const results: ChatCommandDefinition[] = [];

	if (Array.isArray(exported)) {
		for (const item of exported) {
			if (isCommandShape(item)) {
				results.push(item);
			}
		}
	} else if (isCommandShape(exported)) {
		results.push(exported);
	}

	return results;
}

async function scanDirectory(
	dirPath: string,
): Promise<ChatCommandDefinition[]> {
	const results: ChatCommandDefinition[] = [];
	const entries = await readdir(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = resolve(dirPath, entry.name);

		if (entry.isDirectory()) {
			const nested = await scanDirectory(fullPath);
			results.push(...nested);
			continue;
		}

		if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".js")) {
			continue;
		}

		if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".spec.ts")) {
			continue;
		}

		if (entry.name === "index.ts" || entry.name === "index.js") {
			continue;
		}

		if (entry.name === "root.ts" || entry.name === "root.js") {
			continue;
		}

		try {
			const mod = await import(pathToFileURL(fullPath).href);

			for (const key of Object.keys(mod)) {
				const exported = (mod as Record<string, unknown>)[key];
				if (!exported) continue;

				const commands = extractCommandDefinitions(exported);
				results.push(...commands);
			}
		} catch (error) {
			log.warn(`Failed to load ${entry.name}:`, error);
		}
	}

	return results;
}

export async function loadCommandDefinitions(
	basePath: string,
	manifest?: readonly ChatCommandDefinition[],
): Promise<ChatCommandDefinition[]> {
	const seen = new Set<ChatCommandDefinition>();
	const seenNames = new Set<string>();
	const result: ChatCommandDefinition[] = [];

	function add(cmd: ChatCommandDefinition): void {
		if (seen.has(cmd)) return;
		if (seenNames.has(cmd.name.toLowerCase())) return;
		seen.add(cmd);
		seenNames.add(cmd.name.toLowerCase());
		result.push(cmd);

		for (const sub of cmd.subcommands ?? []) {
			seen.add(sub);
		}
	}

	if (manifest) {
		for (const cmd of manifest) {
			add(cmd);
		}
	}

	const discovered = await scanDirectory(basePath);

	for (const cmd of discovered) {
		add(cmd);
	}

	const treeNodes = result.map((def) =>
		toTreeNode(def, [def.name]),
	);

	for (const node of treeNodes) {
		const rendered = renderCommandTree([node]);
		for (const line of rendered.split("\n")) {
			log.debug(line);
		}
	}

	log.info(`Loaded ${result.length} command trees`);

	return result;
}
