#!/usr/bin/env node

import { runInit } from "./init.js";
import { runTypegen } from "./typegen.js";

const command = process.argv[2];

switch (command) {
	case "init": {
		const args = parseArgs(process.argv.slice(3));
		runInit({
			dir: args["--dir"],
			configPath: args["--config-path"],
			schemaPath: args["--schema-path"],
			envExamplePath: args["--env-example-path"],
			force: args["--force"] === "true" || args["-f"] === "true",
		});
		break;
	}
	case "typegen": {
		const args = parseArgs(process.argv.slice(3));
		const schemaPath = args["--schema-path"] ?? args["_schema"];
		if (!schemaPath) {
			console.error("Usage: jd-config typegen --schema-path <path> [--output <path>]");
			process.exit(1);
		}
		runTypegen({
			schemaPath,
			output: args["--output"],
		});
		break;
	}
	default:
		console.log(`Usage:
  jd-config init      Scaffold schema.yaml, Config.yaml, .env.example
  jd-config typegen   Generate TypeScript types from schema.yaml`);
		process.exit(command ? 1 : 0);
}

function parseArgs(args: string[]): Record<string, string> {
	const result: Record<string, string> = {};
	for (let i = 0; i < args.length; i++) {
		const arg = args[i]!;
		if (arg.startsWith("--")) {
			const val = args[i + 1];
			if (val && !val.startsWith("--")) {
				result[arg] = val;
				i++;
			} else {
				result[arg] = "true";
			}
		} else if (arg.startsWith("-") && !arg.startsWith("--")) {
			const val = args[i + 1];
			if (val && !val.startsWith("-")) {
				result[arg] = val;
				i++;
			} else {
				result[arg] = "true";
			}
		} else {
			result["_"] = arg;
		}
	}
	return result;
}
