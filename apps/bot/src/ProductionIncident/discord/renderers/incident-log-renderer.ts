import type { Incident } from "../../engine/index.js";

export type LogBlockStyle = "ansi" | "diff" | "plain";

export function renderIncidentLogsBlock(
  incident: Incident,
  style: LogBlockStyle = "diff",
): string {
  const lines = fakeServerLogs(incident);

  switch (style) {
    case "ansi":
      return [
        "```ansi",
        ...lines.map((line) => ansiLine(line)),
        "```",
      ].join("\n");
    case "diff":
      return [
        "```diff",
        ...lines.map((line) => diffLine(line)),
        "```",
      ].join("\n");
    case "plain":
      return [
        "```log",
        ...lines.map((line) => `[${line.time}] ${line.level.padEnd(5)} ${line.service} ${line.message}`),
        "```",
      ].join("\n");
  }
}

interface FakeLogLine {
  readonly level: "ERROR" | "INFO" | "WARN";
  readonly message: string;
  readonly service: string;
  readonly time: string;
}

function fakeServerLogs(incident: Incident): readonly FakeLogLine[] {
  const service = incident.affectedServices[0] ?? "production";
  const rootCause = incident.rootCause;

  switch (incident.category) {
    case "authentication":
      return [
        { level: "ERROR", message: `token verification failed: ${rootCause}`, service, time: "15:41:03" },
        { level: "WARN", message: "session-store latency above threshold", service: "session-store", time: "15:41:04" },
        { level: "INFO", message: "candidate fix: rotate keys or reissue tokens", service, time: "15:41:05" },
      ];
    case "deployment":
      return [
        { level: "ERROR", message: `release healthcheck failed: ${rootCause}`, service, time: "15:41:03" },
        { level: "WARN", message: "feature flag drift detected across workers", service: "deploy-pipeline", time: "15:41:04" },
        { level: "INFO", message: "rollback candidate detected: deploy-7f2a", service, time: "15:41:05" },
      ];
    case "infrastructure":
      return [
        { level: "ERROR", message: `dependency pressure detected: ${rootCause}`, service, time: "15:41:03" },
        { level: "WARN", message: "queue depth rising faster than consumers", service: "worker-pool", time: "15:41:04" },
        { level: "INFO", message: "capacity and failover checks are reachable", service, time: "15:41:05" },
      ];
    case "payments":
      return [
        { level: "ERROR", message: `checkout provider failure: ${rootCause}`, service, time: "15:41:03" },
        { level: "WARN", message: "webhook retry backlog is growing", service: "payments-webhook", time: "15:41:04" },
        { level: "INFO", message: "fallback provider healthcheck passed", service, time: "15:41:05" },
      ];
    case "security":
      return [
        { level: "ERROR", message: `suspicious access pattern: ${rootCause}`, service, time: "15:41:03" },
        { level: "WARN", message: "admin scope checks are elevated", service: "access-control", time: "15:41:04" },
        { level: "INFO", message: "lockdown and key rotation paths available", service, time: "15:41:05" },
      ];
    case "performance":
      return [
        { level: "ERROR", message: `request timeout after 3000ms: ${rootCause}`, service, time: "15:41:03" },
        { level: "WARN", message: "p95 latency is above deploy guardrail", service: "api-gateway", time: "15:41:04" },
        { level: "INFO", message: "scale and cache recovery options detected", service, time: "15:41:05" },
      ];
  }
}

function diffLine(line: FakeLogLine): string {
  const prefix = line.level === "ERROR" ? "-" : line.level === "WARN" ? "!" : "+";
  return `${prefix} ${line.level.padEnd(5)} ${line.service} ${line.message}`;
}

function ansiLine(line: FakeLogLine): string {
  const color = line.level === "ERROR"
    ? "\u001b[31m"
    : line.level === "WARN"
      ? "\u001b[33m"
      : "\u001b[32m";

  return `${color}[${line.time}] ${line.level.padEnd(5)} ${line.service} ${line.message}\u001b[0m`;
}
