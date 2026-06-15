import { chatCommandTrees } from "./commands/index.js";
import { ChatCommandRegistry } from "./registry.js";

export function createDefaultChatCommandRegistry(): ChatCommandRegistry {
  const registry = new ChatCommandRegistry();

  for (const command of chatCommandTrees) {
    registry.register(command);
  }

  return registry;
}
