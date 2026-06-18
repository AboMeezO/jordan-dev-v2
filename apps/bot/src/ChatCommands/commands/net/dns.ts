import { promises as dns } from "node:dns";

import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const RECORD_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA", "SRV", "CAA"] as const;
type RecordType = (typeof RECORD_TYPES)[number];

const dnsSchema = z.object({
  domain: textInputSchema(253),
  type: z.enum(RECORD_TYPES).default("A"),
});

async function resolveDNS(hostname: string, type: string): Promise<string[]> {
  switch (type) {
    case "A": {
      const r = await dns.resolve4(hostname);
      return r;
    }
    case "AAAA": {
      const r = await dns.resolve6(hostname);
      return r;
    }
    case "MX": {
      const r = await dns.resolveMx(hostname);
      return r.map((e) => `${e.priority} ${e.exchange}`);
    }
    case "TXT": {
      const r = await dns.resolveTxt(hostname);
      return r.map((e) => e.join(" "));
    }
    case "NS": {
      const r = await dns.resolveNs(hostname);
      return r;
    }
    case "CNAME": {
      const r = await dns.resolveCname(hostname);
      return r;
    }
    case "SOA": {
      const r = await dns.resolveSoa(hostname);
      return [
        `nsname=${r.nsname}`,
        `hostmaster=${r.hostmaster}`,
        `serial=${r.serial}`,
        `refresh=${r.refresh}`,
        `retry=${r.retry}`,
        `expire=${r.expire}`,
        `minttl=${r.minttl}`,
      ];
    }
    case "SRV": {
      const r = await dns.resolveSrv(hostname);
      return r.map((e) => `${e.priority} ${e.weight} ${e.port} ${e.name}`);
    }
    case "CAA": {
      const r = await dns.resolveCaa(hostname);
      return r.map((e) => `${(e as unknown as { flags: number }).flags} ${(e as unknown as { tag: string }).tag} "${(e as unknown as { value: string }).value}"`);
    }
    default:
      return [];
  }
}

export const dnsCommand = subcommand({
  name: "dns",
  aliases: ["dns-lookup"],
  description: "Perform DNS lookups for a domain.",
  category: "Network / Security Tools",
  cooldown: 3_000,
  inputLimits: { maxInputLength: 300 },
  availability: {
    contexts: ["guild", "dm"],
  },
  usage: {
    formats: ["dns <domain> [type]"],
    arguments: [
      { name: "domain", description: "Domain to query.", required: true },
      { name: "type", description: `Record type: ${RECORD_TYPES.join(", ")} (default: A)`, required: false },
    ],
    examples: [
      { command: "dns example.com", description: "A records." },
      { command: "dns example.com MX", description: "MX records." },
    ],
  },
  async execute({ invocation, message }) {
    const typeRaw = invocation.options.type as string | undefined;
    const domain = invocation.positionalArgs.filter((a) => !a.startsWith("--")).join(" ").trim();

    const resolvedType = typeRaw?.toUpperCase() ?? "A" as RecordType;
    const parsed = dnsSchema.safeParse({ domain, type: resolvedType });

    if (!parsed.success) {
      await message.reply(parsed.error.issues.map((i) => i.message).join(", "));
      return;
    }

    const { domain: hostname, type } = parsed.data;

    try {
      const records = await resolveDNS(hostname, type);

      if (records.length === 0) {
        await message.reply(`No ${type} records found for ${hostname}.`);
        return;
      }

      const lines = records.map((r, i) => `${i + 1}. ${r}`);
      await message.reply(safeInline(
        `DNS ${type} records for ${hostname}:\n${lines.join("\n")}`,
        1900,
      ));
    } catch (error) {
      const err = error as NodeJS.ErrnoException;

      if (err.code === "ENOTFOUND") {
        await message.reply(`Domain "${hostname}" not found.`);
      } else if (err.code === "ENODATA") {
        await message.reply(`No ${type} records found for ${hostname}.`);
      } else {
        await message.reply(`DNS lookup failed: ${err.message}`);
      }
    }
  },
});
