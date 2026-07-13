import {
	writeFileSync,
	existsSync,
	mkdirSync,
} from "node:fs";
import { resolve } from "node:path";

import { stringify } from "yaml";

export interface InitOptions {
	dir?: string | undefined;
	configPath?: string | undefined;
	schemaPath?: string | undefined;
	envExamplePath?: string | undefined;
	force?: boolean | undefined;
}

const defaultSchema = {
	server: {
		port: {
			type: "number",
			default: 3000,
			min: 1,
			max: 65535,
			description: "Server port",
		},
		host: {
			type: "string",
			default: "0.0.0.0",
			description: "Server host",
		},
	},
};

const defaultConfig = {
	server: {
		port: 3000,
		host: "0.0.0.0",
	},
};

const defaultEnvExample = `# Environment overrides for @jd/config
# Use dot notation for nested keys (e.g., SERVER.PORT=4000)
# These values override the YAML config files at runtime.

# SERVER.PORT=4000
# SERVER.HOST=0.0.0.0
`;

export function runInit(options: InitOptions): void {
	const dir = options.dir
		? resolve(options.dir)
		: process.cwd();
	const configPath =
		options.configPath ?? resolve(dir, "Config.yaml");
	const schemaPath =
		options.schemaPath ?? resolve(dir, "schema.yaml");
	const envExamplePath =
		options.envExamplePath ?? resolve(dir, ".env.example");

	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}

	const filesToCreate: Array<{
		path: string;
		content: string;
		label: string;
	}> = [
		{
			path: schemaPath,
			content: stringify(defaultSchema, { lineWidth: 120 }),
			label: "schema.yaml",
		},
		{
			path: configPath,
			content: stringify(defaultConfig, { lineWidth: 120 }),
			label: "Config.yaml",
		},
		{
			path: envExamplePath,
			content: defaultEnvExample,
			label: ".env.example",
		},
	];

	for (const file of filesToCreate) {
		if (existsSync(file.path) && !options.force) {
			console.log(
				`  SKIP  ${file.label} — already exists (use --force to overwrite)`,
			);
			continue;
		}
		writeFileSync(file.path, file.content, "utf-8");
		console.log(`  OK    ${file.label}`);
	}
}
