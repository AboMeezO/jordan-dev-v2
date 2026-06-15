import type { Client } from "discord.js";
export default function (client: Client) {
  console.log(`Client is ready as ${client.user?.tag}`);
}
