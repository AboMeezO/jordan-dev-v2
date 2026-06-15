import type {
  ChatCommandContext,
  ChatCommandDefinition,
  ChatCommandNodeKind,
  ChatCommandUsageGuide,
  ChatPermissionLevel,
} from "./types.js";

interface ChatCommandNodeInput {
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly description: string;
  readonly permission?: ChatPermissionLevel;
  readonly subcommands?: readonly ChatCommandDefinition[];
  readonly usage?: ChatCommandUsageGuide;
}

interface ChatCommandTreeInput extends ChatCommandNodeInput {
  readonly allowPrefixless?: boolean;
  readonly execute?: (context: ChatCommandContext) => Promise<void> | void;
}

interface ChatCommandGroupInput extends ChatCommandNodeInput {
  readonly execute?: (context: ChatCommandContext) => Promise<void> | void;
}

interface ChatSubcommandInput extends ChatCommandNodeInput {
  readonly execute: (context: ChatCommandContext) => Promise<void> | void;
}

export function commandTree(
  input: ChatCommandTreeInput,
): ChatCommandDefinition {
  return buildNode("command", input);
}

export function commandGroup(
  input: ChatCommandGroupInput,
): ChatCommandDefinition {
  return buildNode("group", input);
}

export function subcommand(
  input: ChatSubcommandInput,
): ChatCommandDefinition {
  return buildNode("subcommand", input);
}

function buildNode(
  kind: ChatCommandNodeKind,
  input: ChatCommandTreeInput | ChatCommandGroupInput | ChatSubcommandInput,
): ChatCommandDefinition {
  return {
    ...(input.aliases ? { aliases: input.aliases } : {}),
    ...(kind === "command" &&
    (input as ChatCommandTreeInput).allowPrefixless !== undefined
      ? { allowPrefixless: (input as ChatCommandTreeInput).allowPrefixless }
      : {}),
    description: input.description,
    ...(input.execute ? { execute: input.execute } : {}),
    kind,
    name: input.name,
    ...(input.permission ? { permission: input.permission } : {}),
    ...(input.subcommands ? { subcommands: input.subcommands } : {}),
    ...(input.usage ? { usage: input.usage } : {}),
  };
}
