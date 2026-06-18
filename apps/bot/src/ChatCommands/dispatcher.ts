import type { Client, Message } from "discord.js";

import { checkCommandAvailability } from "./availability.js";
import { checkCooldown, formatRemainingTime } from "./cooldown.js";
import { parseChatCommandInput } from "./parser.js";
import { canUseChatCommand } from "./permissions.js";
import type {
  ChatCommandRegistry,
  ChatCommandResolution,
} from "./registry.js";
import type { ChatCommandParseResult } from "./types.js";
import { renderUsageGuide } from "./usage-guide.js";

export interface DispatchChatCommandInput {
  readonly client: Client;
  readonly message: Message;
  readonly prefix: string;
  readonly registry: ChatCommandRegistry;
}

export async function dispatchChatCommand(
  input: DispatchChatCommandInput,
): Promise<boolean> {
  if (input.message.author.bot) {
    return false;
  }

  const resolved = resolveMessageCommand(input);

  if (!resolved) {
    return false;
  }

  const { parsed, resolution } = resolved;
  const firstSegment = parsed.segments[0];

  if (!firstSegment) {
    return false;
  }

  if (parsed.segments.length > 1 || firstSegment.operators.length > 0) {
    await input.message.reply(
      "Pipelines and command chaining are parsed but not enabled yet.",
    );
    return true;
  }

  if (firstSegment.redirects.length > 0) {
    await input.message.reply(
      "Redirection syntax is parsed but Discord output targets are not enabled yet.",
    );
    return true;
  }

  if (!resolution.command.execute) {
    await input.message.reply(renderUsageGuide({
      command: resolution.command,
      commandPath: resolution.invocation.commandPath,
      permission: resolution.permission,
      prefix: resolution.invocation.prefix,
      subcommands: resolution.subcommands,
    }));
    return true;
  }

  if (!canUseChatCommand(input.message, resolution.permission)) {
    await input.message.reply("You do not have permission to use that command.");
    return true;
  }

  const availability = checkCommandAvailability(resolution.command, input.message);

  if (!availability.allowed) {
    await input.message.reply(availability.reason);
    return true;
  }

  const cooldown = checkCooldown(resolution.command, input.message);

  if (!cooldown.allowed && cooldown.remainingMs !== undefined) {
    await input.message.reply(
      `Please wait ${formatRemainingTime(cooldown.remainingMs)} before using this command again.`,
    );
    return true;
  }

  await resolution.command.execute({
    client: input.client,
    invocation: resolution.invocation,
    message: input.message,
    registry: input.registry,
  });

  return true;
}

export async function executeChatCommandResolution(
  input: DispatchChatCommandInput & {
    readonly resolution: ChatCommandResolution;
  },
): Promise<boolean> {
  const { resolution } = input;

  if (!resolution.command.execute) {
    await input.message.reply(renderUsageGuide({
      command: resolution.command,
      commandPath: resolution.invocation.commandPath,
      permission: resolution.permission,
      prefix: resolution.invocation.prefix,
      subcommands: resolution.subcommands,
    }));
    return true;
  }

  const availability = checkCommandAvailability(resolution.command, input.message);

  if (!availability.allowed) {
    await input.message.reply(availability.reason);
    return true;
  }

  const cooldown = checkCooldown(resolution.command, input.message);

  if (!cooldown.allowed && cooldown.remainingMs !== undefined) {
    await input.message.reply(
      `Please wait ${formatRemainingTime(cooldown.remainingMs)} before using this command again.`,
    );
    return true;
  }

  await resolution.command.execute({
    client: input.client,
    invocation: resolution.invocation,
    message: input.message,
    registry: input.registry,
  });

  return true;
}

function resolveMessageCommand(
  input: DispatchChatCommandInput,
):
  | {
      readonly parsed: ChatCommandParseResult;
      readonly resolution: ChatCommandResolution;
    }
  | undefined {
  const prefixed = parseChatCommandInput(input.message.content, input.prefix);

  if (prefixed) {
    const resolution = input.registry.resolve(prefixed);

    if (resolution) {
      return { parsed: prefixed, resolution };
    }

    return undefined;
  }

  const prefixless = parseChatCommandInput(input.message.content, "");

  if (!prefixless) {
    return undefined;
  }

  const resolution = input.registry.resolve(prefixless);

  if (!resolution?.allowPrefixless) {
    return undefined;
  }

  return { parsed: prefixless, resolution };
}
