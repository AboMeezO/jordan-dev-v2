import type { ChatCommandDefinition } from "#ChatCommands";

import { dateCommand } from "./date.js";
import { envCommand } from "./env.js";
import { groupsCommand } from "./groups.js";
import { hostnameCommand } from "./hostname.js";
import { idCommand } from "./id.js";
import { lsCommand } from "./ls.js";
import { manCommand } from "./man.js";
import { psCommand } from "./ps.js";
import { pwdCommand } from "./pwd.js";
import { sudoCommand } from "./sudo.js";
import { unameCommand } from "./uname.js";
import { uptimeCommand } from "./uptime.js";
import { whoamiCommand } from "./whoami.js";

export const shellCommandTrees: readonly ChatCommandDefinition[] = [
  whoamiCommand,
  idCommand,
  groupsCommand,
  hostnameCommand,
  pwdCommand,
  dateCommand,
  uptimeCommand,
  unameCommand,
  psCommand,
  envCommand,
  lsCommand,
  manCommand,
  sudoCommand,
];
