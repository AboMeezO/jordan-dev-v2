import { z } from "zod";

export function textInputSchema(maxLength = 100_000): z.ZodString {
  return z.string().min(1, "Input cannot be empty.").max(
    maxLength,
    `Input cannot exceed ${maxLength.toLocaleString()} characters.`,
  );
}

export function optionalTextInputSchema(maxLength = 100_000) {
  return z.string().max(
    maxLength,
    `Input cannot exceed ${maxLength.toLocaleString()} characters.`,
  ).optional();
}

export function modeSchema<T extends readonly string[]>(
  modes: T,
  defaultMode: T[number],
) {
  return z.enum(modes).default(defaultMode);
}

export function urlSchema() {
  return z.string().url("Invalid URL format.").max(10_000, "URL too long.");
}

export function httpUrlSchema() {
  return z.string().url("Invalid URL format.").max(10_000, "URL too long.")
    .refine((url: string) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    }, "Only http: and https: URLs are allowed.");
}

export function domainSchema() {
  return z.string().min(1, "Domain cannot be empty.").max(253, "Domain too long.")
    .regex(
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      "Invalid domain format.",
    );
}

export function discordSnowflakeSchema() {
  return z.string().regex(/^\d{17,20}$/, "Invalid Discord snowflake ID.");
}

export function base64Schema() {
  return z.string().min(1, "Input cannot be empty.")
    .regex(
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
      "Invalid Base64 encoding.",
    );
}

export function hashAlgorithmSchema() {
  return z.enum(["md5", "sha1", "sha256", "sha512"]).default("sha256");
}

export function integerSchema(min: number, max: number) {
  return z.number().int().min(min).max(max);
}

export function safeCommandStringSchema(maxLength = 500) {
  return z.string().min(1).max(maxLength)
    .regex(/^[\w\s.-]+$/, "Input contains unsafe characters.");
}

export function portSchema() {
  return z.number().int().min(1).max(65535);
}

export function extractPositionalInput(
  positionalArgs: readonly string[],
): string | undefined {
  return positionalArgs.length > 0 ? positionalArgs.join(" ") : undefined;
}

export function extractOptionString(
  options: Readonly<Record<string, true | readonly string[]>>,
  name: string,
): string | undefined {
  const value = options[name];
  return Array.isArray(value) ? value[0] : undefined;
}

export function extractOptionFlag(
  options: Readonly<Record<string, true | readonly string[]>>,
  name: string,
): boolean {
  return options[name] !== undefined;
}
