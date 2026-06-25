import type { CaaRecord } from "node:dns";
import { promises as dns } from "node:dns";

import { z } from "zod";

import { subcommand } from "#ChatCommands";
import { safeInline } from "#ChatCommands";
import { textInputSchema } from "#ChatCommands";

const DOMAIN_COOLDOWN_MS = 5_000;
const domainCooldowns = new Map<string, number>();

const RECORD_TYPES = [
	"A",
	"AAAA",
	"MX",
	"TXT",
	"NS",
	"CNAME",
	"SOA",
	"SRV",
	"CAA",
] as const;

const dnsSchema = z.object({
	domain: textInputSchema(253),
	type: z.enum(RECORD_TYPES).default("A"),
});

async function resolveDNS(
	hostname: string,
	type: string,
): Promise<string[]> {
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
			return r.map(
				(e) =>
					`${e.priority} ${e.weight} ${e.port} ${e.name}`,
			);
		}
		case "CAA": {
			const r = await dns.resolveCaa(hostname);
			return r.map(formatCaaRecord);
		}
		default:
			return [];
	}
}

function formatCaaRecord(record: CaaRecord): string {
	const [tag, value] = getCaaTagValue(record);

	return `${record.critical} ${tag} "${value}"`;
}

function getCaaTagValue(record: CaaRecord): [string, string] {
	if (record.issue !== undefined) {
		return ["issue", record.issue];
	}

	if (record.issuewild !== undefined) {
		return ["issuewild", record.issuewild];
	}

	if (record.iodef !== undefined) {
		return ["iodef", record.iodef];
	}

	if (record.contactemail !== undefined) {
		return ["contactemail", record.contactemail];
	}

	if (record.contactphone !== undefined) {
		return ["contactphone", record.contactphone];
	}

	return ["unknown", ""];
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
			{
				name: "domain",
				description: "Domain to query.",
				required: true,
			},
			{
				name: "type",
				description: `Record type: ${RECORD_TYPES.join(", ")} (default: A)`,
				required: false,
			},
		],
		examples: [
			{
				command: "dns example.com",
				description: "A records.",
			},
			{
				command: "dns example.com MX",
				description: "MX records.",
			},
		],
	},
	async execute({ invocation, message }) {
		const typeRaw = invocation.options.type as
			| string
			| undefined;
		const domain = invocation.positionalArgs
			.filter((a) => !a.startsWith("--"))
			.join(" ")
			.trim();

		const resolvedType =
			typeRaw?.toUpperCase() ?? ("A");
		const parsed = dnsSchema.safeParse({
			domain,
			type: resolvedType,
		});

		if (!parsed.success) {
			await message.reply(
				parsed.error.issues
					.map((i) => i.message)
					.join(", "),
			);
			return;
		}

		const { domain: hostname, type } = parsed.data;

		const domainKey = hostname.toLowerCase();
		const lastQuery = domainCooldowns.get(domainKey);
		if (lastQuery && Date.now() - lastQuery < DOMAIN_COOLDOWN_MS) {
			await message.reply(
				`Domain "${hostname}" was queried recently. Please wait before querying it again.`,
			);
			return;
		}

		try {
			domainCooldowns.set(domainKey, Date.now());
			const records = await resolveDNS(hostname, type);

			if (records.length === 0) {
				await message.reply(
					`No ${type} records found for ${hostname}.`,
				);
				return;
			}

			const lines = records.map((r, i) => `${i + 1}. ${r}`);
			await message.reply(
				safeInline(
					`DNS ${type} records for ${hostname}:\n${lines.join("\n")}`,
					1900,
				),
			);
		} catch (error) {
			const err = error as NodeJS.ErrnoException;

			if (err.code === "ENOTFOUND") {
				await message.reply(
					`Domain "${hostname}" not found.`,
				);
			} else if (err.code === "ENODATA") {
				await message.reply(
					`No ${type} records found for ${hostname}.`,
				);
			} else {
				await message.reply(
					`DNS lookup failed: ${err.message}`,
				);
			}
		}
	},
});
