import type {
	ChatCommandDefinition,
	ChatCommandUsageExample,
	ChatCommandUsageGuide,
	ChatPermissionLevel,
	CommandTreeNode,
} from "./types.js";

export interface RenderUsageGuideInput {
	readonly command: ChatCommandDefinition;
	readonly commandPath: readonly string[];
	readonly prefix: string;
	readonly subcommands?: readonly ChatCommandDefinition[];
	readonly permission?: ChatPermissionLevel;
}

export function renderUsageGuide(
	input: RenderUsageGuideInput,
): string {
	const usage = input.command.usage;
	const label = `${input.prefix}${input.commandPath.join(" ")}`;
	const lines = [`**${label}**`, input.command.description];

	const meta: string[] = [];

	if (input.command.category) {
		meta.push(`Category: \`${input.command.category}\``);
	}

	if (input.permission && input.permission !== "public") {
		meta.push(`Permission: \`${input.permission}\``);
	}

	if (input.command.cooldown) {
		meta.push(`Cooldown: ${input.command.cooldown}ms`);
	}

	if (input.command.ownerOnly) {
		meta.push("Owner only");
	}

	if (input.command.devOnly) {
		meta.push("Dev only");
	}

	if (input.command.enabled === false) {
		meta.push("**Disabled**");
	}

	if (input.command.availability?.contexts) {
		meta.push(
			`Allowed in: ${input.command.availability.contexts.join(", ")}`,
		);
	}

	if (meta.length > 0) {
		lines.push("", ...meta);
	}

	appendUsageSection(
		lines,
		"Formats",
		formatFormats(label, usage),
	);
	appendUsageSection(lines, "Use cases", usage?.useCases);
	appendUsageSection(
		lines,
		"Arguments",
		formatArguments(usage),
	);
	appendUsageSection(
		lines,
		"Options",
		formatOptions(usage),
	);
	appendUsageSection(
		lines,
		"Examples",
		formatExamples(label, usage?.examples),
	);
	appendUsageSection(
		lines,
		"Subcommands",
		formatSubcommands(input.subcommands),
	);
	appendUsageSection(lines, "Notes", usage?.notes);

	return lines.join("\n").slice(0, 1900);
}

export function renderCommandList(
	commands: readonly ChatCommandDefinition[],
): string {
	const lines = ["**Available command trees**"];

	for (const command of commands) {
		const prefix =
			command.allowPrefixless !== false ? "" : "!";
		let entry = `- \`${prefix}${command.name}\``;

		if (command.category) {
			entry += ` [${command.category}]`;
		}

		if (command.enabled === false) {
			entry += " (disabled)";
		}

		entry += ` - ${command.description}`;
		lines.push(entry);
	}

	lines.push(
		"",
		"Use `man <command>` for a detailed guide.",
	);

	return lines.join("\n").slice(0, 1900);
}

function formatFormats(
	label: string,
	usage: ChatCommandUsageGuide | undefined,
): readonly string[] {
	return (usage?.formats ?? [`${label}`]).map((format) =>
		format.startsWith("!") || /^[A-Za-z]/.test(format)
			? `\`${format}\``
			: `\`${label} ${format}\``,
	);
}

function formatArguments(
	usage: ChatCommandUsageGuide | undefined,
): readonly string[] | undefined {
	return usage?.arguments?.map((argument) => {
		const required =
			argument.required === false ? "optional" : "required";
		return `- \`${argument.name}\` (${required}) - ${argument.description}`;
	});
}

function formatOptions(
	usage: ChatCommandUsageGuide | undefined,
): readonly string[] | undefined {
	return usage?.options?.map((option) => {
		const aliases = option.aliases?.length
			? `, aliases: ${option.aliases.map((alias) => `\`${alias}\``).join(", ")}`
			: "";
		const value = option.valueName
			? ` <${option.valueName}>`
			: "";
		const required =
			option.required === true ? ", required" : "";

		return `- \`--${option.name}${value}\`${aliases}${required} - ${option.description}`;
	});
}

function formatExamples(
	label: string,
	examples: readonly ChatCommandUsageExample[] | undefined,
): readonly string[] | undefined {
	return examples?.map((example) => {
		const command = isCompleteExampleCommand(
			label,
			example.command,
		)
			? example.command
			: `${label} ${example.command}`.trim();
		return example.description
			? `- \`${command}\` - ${example.description}`
			: `- \`${command}\``;
	});
}

function isCompleteExampleCommand(
	label: string,
	command: string,
): boolean {
	return (
		command.includes(" ") ||
		command.startsWith("!") ||
		command === label ||
		command === label.replace(/^!/, "")
	);
}

function formatSubcommands(
	subcommands: readonly ChatCommandDefinition[] | undefined,
): readonly string[] | undefined {
	return subcommands?.map(
		(subcommand) =>
			`- \`${subcommand.name}\` - ${subcommand.description}`,
	);
}

export function renderCommandTree(
	nodes: readonly CommandTreeNode[],
	prefix: string = "",
): string {
	const lines: string[] = [];

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i];
		if (!node) continue;
		const isLast = i === nodes.length - 1;
		const connector = isLast ? "└─ " : "├─ ";
		const label = `${node.allowPrefixless ? "" : "!"}${node.name}`;
		const suffix = node.children.length === 0
			? " \x1b[90m(λ)\x1b[0m"
			: node.kind === "group"
				? " \x1b[35m[\x1b[95mgroup\x1b[35m]\x1b[0m"
				: "";
		const meta = buildNodeMeta(node);
		const line = `${prefix}${connector}${label}${suffix}${meta}`;
		lines.push(line);

		if (node.children.length > 0) {
			const childPrefix = prefix + (isLast ? "   " : "│  ");
			lines.push(
				renderCommandTree(node.children, childPrefix),
			);
		}
	}

	const result = lines.join("\n");
	return prefix === "" ? `\`\`\`ansi\n${result}\n\`\`\`` : result;
}

export function renderCommandTreeShell(
	nodes: readonly CommandTreeNode[],
): string[] {
	const result: string[] = [];

	function walk(
		treeNodes: readonly CommandTreeNode[],
		parentPath: readonly string[],
	): void {
		for (const node of treeNodes) {
			const fullPath = [...parentPath, node.name];
			const pathStr = fullPath.join(" ");
			const kind = node.kind === "subcommand" ? "sub" : node.kind;

			result.push(`command=${pathStr}`);
			result.push(`  kind=${kind}`);
			result.push(`  description=${node.description}`);
			result.push(`  permission=${node.permission}`);
			result.push(`  prefixless=${node.allowPrefixless}`);
			result.push(`  enabled=${node.enabled}`);
			result.push(`  category=${node.category ?? ""}`);
			result.push(`  aliases=${node.aliases.join(",")}`);

			if (node.children.length > 0) {
				walk(node.children, fullPath);
			}
		}
	}

	walk(nodes, []);
	return result;
}

function buildNodeMeta(node: CommandTreeNode): string {
	const parts: string[] = [];

	if (node.category) {
		parts.push(`\x1b[35m[\x1b[95m${node.category}\x1b[35m]\x1b[0m`);
	}

	if (!node.enabled) {
		parts.push("(disabled)");
	}

	if (node.permission !== "public") {
		parts.push(`\x1b[31m(\x1b[91m${node.permission}\x1b[31m)\x1b[0m`);
	}

	return parts.length > 0 ? ` ${parts.join(" ")}` : "";
}

function appendUsageSection(
	lines: string[],
	title: string,
	items: readonly string[] | undefined,
): void {
	if (!items || items.length === 0) {
		return;
	}

	lines.push("", `**${title}**`, ...items);
}
