import type { Client, Message } from "discord.js";

import {
  createDefaultChatCommandRegistry,
  dispatchChatCommand,
} from "../../ChatCommands/index.js";

const DEFAULT_PREFIX = "!";
const registry = createDefaultChatCommandRegistry();

export default async function (
  message: Message,
  client: Client,
): Promise<void> {
  await dispatchChatCommand({
    client,
    message,
    prefix: process.env.PREFIX ?? DEFAULT_PREFIX,
    registry,
  });
}

