import { maxPermissionLevel } from "../guards/permissions.js";
import { createInvocation } from "../parser/index.js";
import type {
	ChatCommandDefinition,
	ChatCommandInvocation,
	ChatCommandParseResult,
	ChatPermissionLevel,
	CommandTreeNode,
} from "../types.js";

export interface ChatCommandResolution {
	readonly allowPrefixless: boolean;
	readonly command: ChatCommandDefinition;
	readonly invocation: ChatCommandInvocation;
	readonly permission: ChatPermissionLevel;
	readonly subcommands: readonly ChatCommandDefinition[];
}

interface StoredCommand {
	readonly definition: ChatCommandDefinition;
	readonly children: ReadonlyMap<string, StoredCommand>;
}

export class ChatCommandRegistry {
	private readonly commands = new Map<
		string,
		StoredCommand
	>();

	public register(command: ChatCommandDefinition): void {
		this.addToMap(this.commands, command);
	}

	public resolve(
		parseResult: ChatCommandParseResult,
	): ChatCommandResolution | undefined {
		const segment = parseResult.segments[0];
		const words = segment?.words;

		if (!words || words.length === 0) {
			return undefined;
		}

		const firstToken = words[0]?.toLowerCase();

		if (!firstToken) {
			return undefined;
		}

		const rootCommand = this.commands.get(firstToken);

		if (!rootCommand) {
			return undefined;
		}

		let command: StoredCommand = rootCommand;
		const path = [command.definition.name];
		const permissions: (ChatPermissionLevel | undefined)[] =
			[command.definition.permission];
		let consumed = 1;

		while (consumed < words.length) {
			const nextToken = words[consumed]?.toLowerCase();

			if (!nextToken) {
				break;
			}

			const child = command.children.get(nextToken);

			if (!child) {
				break;
			}

			command = child;
			path.push(command.definition.name);
			permissions.push(command.definition.permission);
			consumed += 1;
		}

		const rawArgs = words.slice(consumed);
		const invocation = createInvocation(
			parseResult,
			path,
			rawArgs,
		);

		return {
			allowPrefixless:
				rootCommand.definition.allowPrefixless !== false,
			command: command.definition,
			invocation,
			permission: maxPermissionLevel(permissions),
			subcommands: uniqueSubcommands(command.children),
		};
	}

	public find(
		commandPath: readonly string[],
		prefix: string,
	): ChatCommandResolution | undefined {
		const [firstToken, ...remainingPath] = commandPath.map(
			(part) => part.toLowerCase(),
		);

		if (!firstToken) {
			return undefined;
		}

		const rootCommand = this.commands.get(firstToken);

		if (!rootCommand) {
			return undefined;
		}

		let command: StoredCommand = rootCommand;
		const path = [command.definition.name];
		const permissions: (ChatPermissionLevel | undefined)[] =
			[command.definition.permission];

		for (const token of remainingPath) {
			const child = command.children.get(token);

			if (!child) {
				return undefined;
			}

			command = child;
			path.push(command.definition.name);
			permissions.push(command.definition.permission);
		}

		const invocation = createInvocation(
			{
				prefix:
					rootCommand.definition.allowPrefixless !== false
						? ""
						: prefix,
				segments: [
					{ operators: [], redirects: [], words: path },
				],
			},
			path,
			[],
		);

		return {
			allowPrefixless:
				rootCommand.definition.allowPrefixless !== false,
			command: command.definition,
			invocation,
			permission: maxPermissionLevel(permissions),
			subcommands: uniqueSubcommands(command.children),
		};
	}

	public listRootCommands(): readonly ChatCommandDefinition[] {
		return uniqueSubcommands(this.commands);
	}

	public listRootTreeNodes(): CommandTreeNode[] {
		const seen = new Set<ChatCommandDefinition>();
		const nodes: CommandTreeNode[] = [];

		for (const command of this.commands.values()) {
			if (seen.has(command.definition)) continue;
			seen.add(command.definition);
			nodes.push(
				toTreeNode(command.definition, [
					command.definition.name,
				]),
			);
		}

		return nodes;
	}

	private addToMap(
		map: Map<string, StoredCommand>,
		command: ChatCommandDefinition,
	): void {
		const key = command.name.toLowerCase();

		if (map.has(key)) {
			throw new Error(
				`Duplicate chat command: ${command.name}`,
			);
		}

		const children = new Map<string, StoredCommand>();

		for (const subcommand of command.subcommands ?? []) {
			this.addToMap(children, subcommand);
		}

		const stored = { children, definition: command };
		map.set(key, stored);

		for (const alias of command.aliases ?? []) {
			const aliasKey = alias.toLowerCase();

			if (map.has(aliasKey)) {
				throw new Error(
					`Duplicate chat command alias: ${alias}`,
				);
			}

			map.set(aliasKey, stored);
		}
	}
}

function uniqueSubcommands(
	commands: ReadonlyMap<string, StoredCommand>,
): readonly ChatCommandDefinition[] {
	return Array.from(
		new Set(Array.from(commands.values())),
	).map((command) => command.definition);
}

export function toTreeNode(
	definition: ChatCommandDefinition,
	path: readonly string[],
	depth: number = 0,
): CommandTreeNode {
	const maxDepth = 5;

	return {
		aliases: definition.aliases ?? [],
		allowPrefixless: definition.allowPrefixless !== false,
		category: definition.category ?? null,
		children:
			depth < maxDepth
				? (definition.subcommands ?? [])
						.filter(
							(s): s is ChatCommandDefinition =>
								s !== undefined,
						)
						.map((sub) =>
							toTreeNode(
								sub,
								[...path, sub.name],
								depth + 1,
							),
						)
				: [],
		cooldown: definition.cooldown ?? null,
		description: definition.description,
		enabled: definition.enabled !== false,
		kind: definition.kind ?? "command",
		name: definition.name,
		path,
		permission: definition.permission ?? "public",
	};
}
