import { z } from "zod";

import { loadYamlFile } from "./yaml-utils.js";

export interface SchemaField {
	type?: string;
	default?: unknown;
	optional?: boolean;
	min?: number;
	max?: number;
	pattern?: string;
	description?: string;
}

export interface SchemaDefinition {
	[key: string]: SchemaField | SchemaDefinition;
}

export interface CompiledSchema {
	schema: z.ZodObject<z.ZodRawShape>;
	defaults: Record<string, unknown>;
	flatKeys: Map<
		string,
		{ type: string; required: boolean; default?: unknown }
	>;
}

export function isSchemaField(
	value: unknown,
): value is SchemaField {
	if (typeof value !== "object" || value === null)
		return false;
	const keys = new Set(Object.keys(value));
	const validKeys = new Set([
		"type",
		"default",
		"optional",
		"min",
		"max",
		"pattern",
		"description",
	]);
	for (const key of keys) {
		if (!validKeys.has(key)) return false;
	}
	return keys.size > 0;
}

function inferType(value: unknown): string {
	if (typeof value === "number") return "number";
	if (typeof value === "boolean") return "boolean";
	if (typeof value === "string") return "string";
	return "string";
}

function compileLeaf(field: SchemaField): z.ZodType {
	const type = field.type ?? "string";
	let schema: z.ZodType;

	switch (type) {
		case "string": {
			let s = z.string();
			if (field.min !== undefined) s = s.min(field.min);
			if (field.max !== undefined) s = s.max(field.max);
			if (field.pattern)
				s = s.regex(new RegExp(field.pattern));
			schema = s;
			break;
		}
		case "number": {
			let n = z.coerce.number();
			if (field.min !== undefined) n = n.min(field.min);
			if (field.max !== undefined) n = n.max(field.max);
			schema = n;
			break;
		}
		case "boolean":
			schema = z.coerce.boolean();
			break;
		case "array":
			schema = z.array(z.unknown());
			break;
		default:
			schema = z.unknown();
	}

	if (field.default !== undefined) {
		schema = schema.default(field.default as never);
	} else if (field.optional) {
		schema = schema.nullish();
	}

	return schema;
}

function collectDefaults(
	def: SchemaDefinition | SchemaField,
	prefix: string,
	defaults: Record<string, unknown>,
	flatKeys: Map<
		string,
		{ type: string; required: boolean; default?: unknown }
	>,
): void {
	for (const [key, value] of Object.entries(def)) {
		const fullPath = prefix ? `${prefix}.${key}` : key;
		if (isSchemaField(value)) {
			const type = value.type ?? "string";
			flatKeys.set(fullPath, {
				type,
				required:
					value.default === undefined && !value.optional,
				default: value.default,
			});
			if (value.default !== undefined) {
				setNested(
					defaults,
					fullPath.split("."),
					value.default,
				);
			}
		} else if (
			typeof value === "object" &&
			value !== null
		) {
			collectDefaults(
				value as SchemaDefinition,
				fullPath,
				defaults,
				flatKeys,
			);
		}
	}
}

function compileObject(
	def: SchemaDefinition,
): z.ZodObject<z.ZodRawShape> {
	const shape: Record<string, z.ZodType> = {};
	for (const [key, value] of Object.entries(def)) {
		if (isSchemaField(value)) {
			shape[key] = compileLeaf(value);
		} else if (
			typeof value === "object" &&
			value !== null
		) {
			shape[key] = compileObject(value as SchemaDefinition);
		}
	}
	return z.object(shape);
}

function setNested(
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

export function parseSchema(
	raw: Record<string, unknown>,
): CompiledSchema {
	const schemaDef = raw as SchemaDefinition;
	const defaults: Record<string, unknown> = {};
	const flatKeys = new Map<
		string,
		{ type: string; required: boolean; default?: unknown }
	>();
	collectDefaults(schemaDef, "", defaults, flatKeys);
	const schema = compileObject(schemaDef);
	return { schema, defaults, flatKeys };
}

export function compileSchema(
	schemaPath: string,
): CompiledSchema {
	const raw = loadYamlFile(schemaPath);
	return parseSchema(raw);
}
