import type {
  ChatCommandDefinition,
  ChatCommandUsageExample,
  ChatCommandUsageGuide,
  ChatPermissionLevel,
} from "./types.js";

export interface RenderUsageGuideInput {
  readonly command: ChatCommandDefinition;
  readonly commandPath: readonly string[];
  readonly prefix: string;
  readonly subcommands?: readonly ChatCommandDefinition[];
  readonly permission?: ChatPermissionLevel;
}

export function renderUsageGuide(input: RenderUsageGuideInput): string {
  const usage = input.command.usage;
  const label = `${input.prefix}${input.commandPath.join(" ")}`;
  const lines = [`**${label}**`, input.command.description];

  if (input.permission && input.permission !== "public") {
    lines.push("", `Permission: \`${input.permission}\``);
  }

  appendUsageSection(lines, "Formats", formatFormats(label, usage));
  appendUsageSection(lines, "Use cases", usage?.useCases);
  appendUsageSection(lines, "Arguments", formatArguments(usage));
  appendUsageSection(lines, "Options", formatOptions(usage));
  appendUsageSection(lines, "Examples", formatExamples(label, usage?.examples));
  appendUsageSection(lines, "Subcommands", formatSubcommands(input.subcommands));
  appendUsageSection(lines, "Notes", usage?.notes);

  return lines.join("\n").slice(0, 1900);
}

export function renderCommandList(
  commands: readonly ChatCommandDefinition[],
): string {
  const lines = ["**Available command trees**"];

  for (const command of commands) {
    const prefix = command.allowPrefixless === true ? "" : "!";
    lines.push(`- \`${prefix}${command.name}\` - ${command.description}`);
  }

  lines.push("", "Use `jd help <command>` for a detailed guide.");

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
    const required = argument.required === false ? "optional" : "required";
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
    const value = option.valueName ? ` <${option.valueName}>` : "";
    const required = option.required === true ? ", required" : "";

    return `- \`--${option.name}${value}\`${aliases}${required} - ${option.description}`;
  });
}

function formatExamples(
  label: string,
  examples: readonly ChatCommandUsageExample[] | undefined,
): readonly string[] | undefined {
  return examples?.map((example) => {
    const command = isCompleteExampleCommand(label, example.command)
      ? example.command
      : `${label} ${example.command}`.trim();
    return example.description
      ? `- \`${command}\` - ${example.description}`
      : `- \`${command}\``;
  });
}

function isCompleteExampleCommand(label: string, command: string): boolean {
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
    (subcommand) => `- \`${subcommand.name}\` - ${subcommand.description}`,
  );
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
