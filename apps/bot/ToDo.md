# JordanDev Bot — Shell-like Tools TODO Specification

## Document Goals

This document defines a structured TODO list for adding practical shell-like tools to the JordanDev Discord bot.

Each tool includes:

- A trackable TODO item.
- A collapsible implementation section.
- Functional specifications.
- Required or recommended packages.
- A short library-focused tutorial.
- Validation rules.
- Security notes.
- Acceptance criteria.

---

## Global Implementation Requirements

- [ ] Build a shared tool registry for all shell-like tools.

<details>
<summary>Specs / Packages / Tutorial</summary>

### Purpose

The bot needs a centralized registry so tools can be discovered, documented, enabled, disabled, searched, and used by the `which` command.

### Required Metadata Per Tool

Each tool should expose metadata similar to:

- `name`
- `aliases`
- `category`
- `description`
- `usage`
- `examples`
- `enabled`
- `adminOnly`
- `devOnly`
- `cooldown`
- `inputLimits`
- `outputMode`

### Recommended Packages

- `zod` for input validation.
- `fastest-levenshtein` for fuzzy search in `which`.

### Small Tutorial

Use a registry object or map where every utility registers itself.

Example concept:

```js
const tools = new Map();

tools.set("json", {
  name: "json",
  aliases: ["json-format", "jsonfmt"],
  category: "Dev Utilities",
  enabled: true,
});
```

The `which` tool should read from this registry instead of hardcoding command names.

### Acceptance Criteria

- Every tool can be found by its canonical name.
- Every alias maps back to the canonical tool.
- Disabled tools are still detectable by maintainers.
- Public users cannot see private/dev-only tools unless intended.

</details>

---

- [ ] Build shared input validation utilities.

<details>
<summary>Specs / Packages / Tutorial</summary>

### Purpose

All tools need consistent validation for text length, URLs, domains, IDs, encodings, and unsafe inputs.

### Recommended Package

- `zod`

### Validation Requirements

- Maximum input length.
- Maximum output length.
- Required argument checks.
- Type checks.
- Enum checks for modes such as `encode`, `decode`, `format`, `parse`.
- Safe error messages.

### Small Tutorial

Use schemas for tool input, not manual scattered checks.

Example concept:

```js
const schema = z.object({
  mode: z.enum(["encode", "decode"]),
  input: z.string().min(1).max(8000),
});

const parsed = schema.safeParse(rawInput);
```

### Acceptance Criteria

- Invalid input never reaches tool logic.
- Error messages are human-readable.
- Validation behavior is consistent across tools.
- User-provided input is never trusted directly.

</details>

---

- [ ] Build shared output formatting utilities.

<details>
<summary>Specs / Packages / Tutorial</summary>

### Purpose

Tool output must stay readable and safe inside Discord.

### Requirements

- Escape user mentions.
- Escape role mentions.
- Escape everyone/here mentions.
- Truncate long output.
- Convert oversized output to file attachment.
- Use consistent success/warning/error styles.
- Avoid raw stack traces.

### Recommended Native APIs

- String replacement utilities.
- `Buffer.byteLength()` for size measurement.

### Small Tutorial

Before sending tool output, run it through a safe formatter.

Example concept:

```js
const safe = text
  .replaceAll("@everyone", "@\u200beveryone")
  .replaceAll("@here", "@\u200bhere");
```

### Acceptance Criteria

- Tool output cannot mass-ping users.
- Large output is handled gracefully.
- Stack traces are hidden from users.
- Attachments are used when content exceeds safe limits.

</details>

---

- [ ] Build shared network safety utilities.

<details>
<summary>Specs / Packages / Tutorial</summary>

### Purpose

Network tools such as `http`, `scan-url`, `ping-host`, `dns`, and `whois` must not become SSRF tools.

### Required Protections

Block requests to:

- `localhost`
- `127.0.0.0/8`
- `10.0.0.0/8`
- `172.16.0.0/12`
- `192.168.0.0/16`
- IPv6 loopback
- IPv6 link-local
- cloud metadata IPs
- private/internal hostnames

### Recommended Packages

- `ipaddr.js`
- `tldts`

### Native APIs

- `node:dns/promises`
- `URL`

### Small Tutorial

Resolve a hostname before making the request, then check whether the resolved IP is public.

Example concept:

```js
const records = await dns.lookup(hostname, { all: true });

for (const record of records) {
  const parsed = ipaddr.parse(record.address);
  // Reject private, loopback, link-local, and reserved ranges.
}
```

### Acceptance Criteria

- Public domains are allowed.
- Localhost is rejected.
- Private IPs are rejected.
- Redirects are re-validated before following.
- Every network action has a timeout.

</details>

---

# Phase 1 — Dev Utilities

---

- [ ] Implement `json formatter`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Format, validate, minify, and optionally sort JSON input.

## Category

Dev Utilities

## Suggested Names

- `json`
- `json-format`
- `jsonfmt`

## Functional Specs

The tool should support:

- JSON formatting.
- JSON validation.
- JSON minification.
- Optional indentation size.
- Optional sorted keys.
- File output when the result is too large.

## Inputs

- Raw JSON string.
- Optional mode:
  - `format`
  - `minify`
  - `validate`
- Optional indent value:
  - `2`
  - `4`
- Optional `sortKeys` boolean.

## Outputs

- Formatted JSON.
- Validation result.
- Error message for invalid JSON.
- Size before and after formatting.

## Required Native APIs

- `JSON.parse()`
- `JSON.stringify()`

## Recommended Packages

- `prettier` for advanced formatting.
- `jsonc-parser` if JSONC support is wanted later.

## Small Tutorial

For strict JSON, native APIs are enough.

```js
const parsed = JSON.parse(input);
const formatted = JSON.stringify(parsed, null, 2);
```

For Prettier-based formatting:

```js
const formatted = await prettier.format(input, {
  parser: "json",
});
```

Use native JSON first unless you need Prettier consistency across many formats.

## Validation Rules

- Reject empty input.
- Reject input above the configured size limit.
- Do not use `eval`.
- Catch JSON parse errors.
- Escape mentions in the output.

## Edge Cases

- Root JSON is an array.
- Root JSON is a string.
- Root JSON is a number.
- Input has trailing commas.
- Input has comments.
- Output exceeds Discord limits.

## Acceptance Criteria

- Valid compact JSON becomes readable multiline JSON.
- Invalid JSON returns a clear error.
- Minify mode returns compact JSON.
- Oversized output becomes an attachment.
- No user input can trigger code execution.

</details>

---

- [ ] Implement `base64`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Encode and decode Base64 text safely.

## Category

Dev Utilities

## Suggested Names

- `base64`
- `b64`

## Functional Specs

The tool should support:

- Base64 encode.
- Base64 decode.
- UTF-8 text.
- Optional Base64URL mode later.

## Inputs

- Mode:
  - `encode`
  - `decode`
- Text input.

## Outputs

- Encoded string.
- Decoded string.
- Input byte length.
- Output byte length.

## Required Native APIs

- `Buffer`

## Recommended Packages

No package required.

## Small Tutorial

Base64 encoding and decoding can be handled with `Buffer`.

```js
const encoded = Buffer.from(input, "utf8").toString("base64");
const decoded = Buffer.from(input, "base64").toString("utf8");
```

For Base64URL, normalize characters:

```js
const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
```

## Validation Rules

- Reject empty input.
- Limit input size.
- In decode mode, validate that the input looks like Base64.
- Warn if decoded output contains binary/control characters.

## Edge Cases

- Arabic text.
- Unicode characters.
- Emojis.
- Missing Base64 padding.
- URL-safe Base64.
- Binary data decoded as text.

## Acceptance Criteria

- `hello` encodes correctly.
- Encoded `hello` decodes correctly.
- Unicode survives encode/decode.
- Invalid Base64 gives a clear warning.
- Large output is truncated or attached safely.

</details>

---

- [ ] Implement `url`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Encode, decode, parse, and inspect URLs or URL components.

## Category

Dev Utilities

## Suggested Names

- `url`
- `uri`

## Functional Specs

The tool should support:

- URL component encoding.
- URL component decoding.
- URL parsing.
- Query parameter inspection.
- URL normalization.

## Inputs

- Mode:
  - `encode`
  - `decode`
  - `parse`
- Text or URL.

## Outputs

For encode/decode:

- Transformed text.

For parse:

- Protocol.
- Hostname.
- Port.
- Pathname.
- Query parameters.
- Hash fragment.
- Origin.

## Required Native APIs

- `encodeURIComponent()`
- `decodeURIComponent()`
- `URL`

## Recommended Packages

- `tldts` if domain parsing is needed.

## Small Tutorial

For URL component transforms:

```js
const encoded = encodeURIComponent(input);
const decoded = decodeURIComponent(input);
```

For parsing:

```js
const parsed = new URL(input);
const hostname = parsed.hostname;
const params = parsed.searchParams;
```

## Validation Rules

- Reject malformed URLs in parse mode.
- Reject unsafe protocols in URL-aware features.
- Handle decode errors safely.
- Never assume a string is a valid URL before `new URL()` succeeds.

## Edge Cases

- Spaces.
- Arabic text.
- Bad percent encoding.
- URL without protocol.
- Duplicate query parameters.
- URL with username/password.

## Acceptance Criteria

- Text with spaces encodes correctly.
- Encoded text decodes correctly.
- Valid URLs are parsed into components.
- Malformed URL input returns a controlled error.
- Unsafe protocols are rejected where relevant.

</details>

---

- [ ] Implement `hash`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Generate hashes for text input.

## Category

Dev Utilities

## Suggested Names

- `hash`
- `checksum`

## Functional Specs

The tool should support:

- `md5`
- `sha1`
- `sha256`
- `sha512`

Optional future support:

- `sha3-256`
- `blake2b512`

## Inputs

- Algorithm.
- Text input.

## Outputs

- Algorithm name.
- Hash digest.
- Digest encoding.
- Input byte length.

## Required Native APIs

- `node:crypto`

## Recommended Packages

No package required for standard algorithms.

## Small Tutorial

Use Node's crypto hash API.

```js
const digest = crypto.createHash("sha256").update(input, "utf8").digest("hex");
```

Check available algorithms if needed:

```js
const algorithms = crypto.getHashes();
```

## Validation Rules

- Algorithm must be allowlisted.
- Reject empty text unless empty-string hashing is intentionally supported.
- Limit input size.
- Warn that MD5 and SHA1 are not secure for password storage.

## Edge Cases

- Empty string.
- Unicode input.
- Newlines.
- Huge input.
- Unsupported algorithm.

## Acceptance Criteria

- SHA-256 hash is stable for the same input.
- Unsupported algorithms are rejected.
- MD5/SHA1 include a small warning.
- Output is deterministic.

</details>

---

- [ ] Implement `uuid`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Generate and validate UUIDs.

## Category

Dev Utilities

## Suggested Names

- `uuid`
- `guid`

## Functional Specs

The tool should support:

- Generate UUID v4.
- Validate UUID.
- Detect UUID version.
- Optional multiple UUID generation with a strict limit.

## Inputs

- Mode:
  - `generate`
  - `validate`
- Optional count.
- Optional UUID string for validation.

## Outputs

- Generated UUID.
- Validation status.
- UUID version.

## Required Native APIs

- `crypto.randomUUID()`

## Recommended Packages

- `uuid` if you want helper functions such as validation and version detection.

## Small Tutorial

For generation:

```js
const id = crypto.randomUUID();
```

With the `uuid` package:

```js
const id = v4();
const isValid = validate(input);
const uuidVersion = version(input);
```

## Validation Rules

- Limit count, for example max 10.
- Validate UUID format before version detection.
- Accept uppercase UUIDs.
- Reject extremely long input.

## Edge Cases

- UUID without dashes.
- Uppercase UUID.
- Invalid version.
- Multiple UUID generation spam.

## Acceptance Criteria

- Generated UUID is valid v4.
- Valid UUIDs pass validation.
- Invalid strings fail validation.
- Count limit is enforced.

</details>

---

- [ ] Implement `timestamp`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Generate Discord timestamps from dates, current time, or relative durations.

## Category

Dev Utilities

## Suggested Names

- `timestamp`
- `time`
- `discord-time`

## Functional Specs

The tool should support:

- Current timestamp.
- Date string parsing.
- Relative duration parsing.
- Discord timestamp styles.

## Inputs

- `now`
- Date string.
- Relative duration such as:
  - `10m`
  - `2h`
  - `3d`
- Optional style:
  - `t`
  - `T`
  - `d`
  - `D`
  - `f`
  - `F`
  - `R`

## Outputs

- Unix timestamp in seconds.
- Discord timestamp string.
- Multiple Discord style previews.
- Parsed date preview.

## Required Native APIs

- `Date`

## Recommended Packages

- `ms` for duration parsing.
- `chrono-node` for natural-language dates.
- `date-fns` for formatting if needed.

## Small Tutorial

Discord timestamps use Unix seconds.

```js
const seconds = Math.floor(date.getTime() / 1000);
const full = `<t:${seconds}:F>`;
const relative = `<t:${seconds}:R>`;
```

For relative durations:

```js
const offset = ms("2h");
const date = new Date(Date.now() + offset);
```

## Validation Rules

- Reject invalid dates.
- Reject extremely far future or past dates if desired.
- Limit relative durations.
- Make timezone behavior explicit.

## Edge Cases

- Milliseconds vs seconds confusion.
- Ambiguous date strings.
- Timezone differences.
- Invalid duration.
- Negative duration.

## Acceptance Criteria

- `now` returns current Discord timestamp.
- `2h` returns a future relative timestamp.
- Valid date strings are parsed.
- Invalid date strings return a clear error.
- All Discord styles are generated correctly.

</details>

---

# Phase 2 — Code Tools

---

- [ ] Implement `regex test`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Test regular expressions against text and show matches, groups, and flags.

## Category

Code Tools

## Suggested Names

- `regex`
- `regex-test`
- `re`

## Functional Specs

The tool should support:

- Pattern testing.
- Flags.
- Global matching.
- Capture groups.
- Named capture groups.
- Match ranges.
- ReDoS risk detection.

## Inputs

- Regex pattern.
- Optional flags.
- Test text.

## Outputs

- Match count.
- Matched values.
- Capture groups.
- Named groups.
- Index/range.
- ReDoS warning if suspicious.

## Required Native APIs

- `RegExp`
- `String.prototype.matchAll()`

## Recommended Packages

- `safe-regex2` for detecting potentially catastrophic regex.
- `regexp-tree` if deeper parsing is needed.

## Small Tutorial

Create a RegExp from user input only after validation.

```js
const regex = new RegExp(pattern, flags);
const matches = [...text.matchAll(regex)];
```

If the user does not include the global flag and you want all matches, add `g` internally after validating flags.

```js
const normalizedFlags = flags.includes("g") ? flags : `${flags}g`;
```

## Validation Rules

- Limit pattern length.
- Limit test text length.
- Validate flags.
- Reject duplicate flags.
- Catch invalid regex syntax.
- Use a ReDoS safety check.
- Avoid infinite loops from zero-length matches.

## Edge Cases

- Invalid regex syntax.
- Empty string matches.
- Lookbehind patterns.
- Named groups.
- Unicode flag behavior.
- Very slow regex.

## Acceptance Criteria

- Valid regex returns matches.
- Invalid regex returns syntax error.
- Capture groups are shown.
- Named groups are shown.
- Risky regex patterns are warned or rejected.

</details>

---

# Phase 3 — Network Tools

---

- [ ] Implement `ping-host`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Check whether a host or host:port is reachable without executing system shell commands.

## Category

Network Tools

## Suggested Names

- `ping-host`
- `ping`
- `tcping`

## Functional Specs

The tool should support:

- DNS resolution.
- TCP connection check.
- Optional port check.
- Latency measurement.
- Timeout handling.

## Inputs

- Hostname or IP.
- Optional port.
- Optional timeout.

## Outputs

- Resolved IP address.
- Reachability status.
- DNS lookup time.
- TCP connect time.
- Failure reason.

## Required Native APIs

- `node:dns/promises`
- `node:net`
- `performance.now()`

## Recommended Packages

- `ipaddr.js` for IP classification.
- `tldts` for domain normalization.

## Small Tutorial

Use DNS lookup first.

```js
const records = await dns.lookup(host, { all: true });
```

Then test TCP connectivity with `net.Socket`.

```js
const socket = net.createConnection({ host, port });
```

Measure time before and after connection.

## Validation Rules

- Reject localhost.
- Reject private IP ranges.
- Reject invalid hostnames.
- Limit timeout.
- Limit repeated checks.
- Do not call the OS `ping` command with user input.

## Edge Cases

- DNS resolves but TCP fails.
- Host has IPv6 only.
- Domain does not resolve.
- Firewall drops packets.
- Port is closed.
- Port is filtered.

## Acceptance Criteria

- Public host resolves successfully.
- Public open port reports reachable.
- Closed port reports failure.
- Private/internal targets are blocked.
- Timeout is handled cleanly.

</details>

---

- [ ] Implement `dns`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Query DNS records for a domain.

## Category

Network Tools

## Suggested Names

- `dns`
- `dig`
- `resolve`

## Functional Specs

The tool should support record types:

- `A`
- `AAAA`
- `CNAME`
- `MX`
- `TXT`
- `NS`
- `SOA`
- `CAA`

## Inputs

- Domain.
- Optional record type.

## Outputs

- Records.
- Record type.
- Domain.
- Normalized result table.
- Clear error for missing records.

## Required Native APIs

- `node:dns/promises`

## Recommended Packages

- `tldts` for extracting and validating domains.

## Small Tutorial

Use `dns.resolve()` for generic record lookup.

```js
const records = await dns.resolve(domain, "A");
```

For MX records:

```js
const records = await dns.resolveMx(domain);
```

For TXT records, flatten nested TXT arrays.

```js
const flat = records.map((parts) => parts.join(""));
```

## Validation Rules

- Accept domains, not full URLs.
- If a URL is provided, extract the hostname or return a clear error.
- Validate record type against an allowlist.
- Reject internal hostnames if this tool is public.

## Edge Cases

- No records for a valid domain.
- TXT records returned as arrays.
- Internationalized domain names.
- CNAME chain.
- Resolver timeout.

## Acceptance Criteria

- A records are displayed correctly.
- MX records show priority and exchange.
- TXT records are readable.
- Unsupported record types are rejected.
- DNS failures are explained clearly.

</details>

---

- [ ] Implement `whois`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Look up domain registration information.

## Category

Network Tools

## Suggested Names

- `whois`
- `domain-info`

## Functional Specs

The tool should display:

- Registrar.
- Creation date.
- Expiration date.
- Updated date.
- Name servers.
- Domain status.
- WHOIS privacy status if obvious.

## Inputs

- Domain name.
- Optional raw output mode.

## Outputs

- Compact WHOIS summary.
- Optional raw WHOIS attachment.
- Failure reason if not found.

## Recommended Packages

- `whoiser`
- `tldts`

## Small Tutorial

Use `whoiser` to query WHOIS servers.

```js
const result = await whoiser(domain);
```

WHOIS field names differ by TLD, so build a normalizer that checks multiple possible keys.

Example normalized fields:

- `registrar`
- `creationDate`
- `expirationDate`
- `updatedDate`
- `nameServers`

## Validation Rules

- Accept domain names only.
- Extract hostname from URL only if desired.
- Reject private/internal hostnames.
- Rate-limit strongly.
- Cache results.
- Do not show massive raw output inline.

## Edge Cases

- Domain not registered.
- Unsupported TLD.
- Privacy-protected WHOIS.
- WHOIS rate limits.
- Different date formats.
- Multiple registrar fields.

## Acceptance Criteria

- Registered domain returns summary.
- Unregistered domain returns a clear result.
- Privacy-protected data does not break parsing.
- Large raw output becomes an attachment.
- WHOIS rate limit errors are handled.

</details>

---

- [ ] Implement `http` / `https check`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Check a URL response status, headers, redirects, and timing.

## Category

Network Tools

## Suggested Names

- `http`
- `https`
- `curl`
- `url-check`

## Functional Specs

The tool should support:

- HTTP/HTTPS URL checking.
- Status code display.
- Response time measurement.
- Redirect chain inspection.
- Selected response headers.
- Content-Type display.
- Content-Length display.
- HTTPS detection.

## Inputs

- URL.
- Optional method:
  - `HEAD`
  - `GET`
- Optional redirect mode.
- Optional headers display.

## Outputs

- Initial URL.
- Final URL.
- Status code.
- Status text.
- Response time.
- Redirect count.
- Redirect chain.
- Content-Type.
- Server header if present.
- HTTPS yes/no.

## Required Native APIs

- `URL`
- `fetch`
- `AbortController`
- `performance.now()`

## Recommended Packages

- `undici` for advanced HTTP control.
- `ipaddr.js` for SSRF protection.
- `tldts` for domain parsing.

## Small Tutorial

Use `HEAD` first to avoid downloading the response body.

```js
const controller = new AbortController();
const startedAt = performance.now();

const response = await fetch(url, {
  method: "HEAD",
  redirect: "manual",
  signal: controller.signal,
});

const duration = performance.now() - startedAt;
```

If a server rejects `HEAD`, optionally retry with `GET` but read only a tiny limited amount of data.

## Validation Rules

- Allow only `http:` and `https:`.
- Reject localhost and private IPs.
- Validate DNS result before request.
- Re-check every redirect target.
- Limit redirect count.
- Use timeout.
- Avoid downloading full bodies.

## Edge Cases

- Server blocks HEAD.
- Redirect to private IP.
- Invalid TLS certificate.
- Too many redirects.
- HTTP to HTTPS redirect.
- Cloudflare 403.
- Large response body.

## Acceptance Criteria

- Valid HTTPS URL returns status and timing.
- Redirects are shown.
- Private/internal URLs are blocked.
- Timeout returns a clean error.
- HEAD failure is handled gracefully.

</details>

---

# Phase 4 — Git / GitHub Tools

---

- [ ] Implement `github user`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Fetch and display a GitHub user profile summary.

## Category

Git / GitHub Tools

## Suggested Names

- `github user`
- `gh user`
- `ghu`

## Functional Specs

The tool should display:

- Username.
- Display name.
- Bio.
- Company.
- Location.
- Public repositories.
- Followers.
- Following.
- Account creation date.
- Profile URL.

## Inputs

- GitHub username.
- Optional GitHub profile URL.

## Outputs

- Clean profile summary.
- Avatar URL or image preview.
- GitHub profile link.

## Recommended Packages

- `@octokit/rest`
- Optional: native `fetch`

## Required External Service

- GitHub REST API.

## Small Tutorial

Use Octokit for cleaner GitHub API calls.

```js
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const response = await octokit.rest.users.getByUsername({
  username,
});
```

A GitHub token is recommended to reduce rate-limit problems.

## Validation Rules

- Validate username format.
- Support usernames up to GitHub's max username length.
- Extract username from GitHub profile URL if needed.
- Handle 404.
- Cache responses briefly.

## Edge Cases

- User does not exist.
- User was renamed.
- User is suspended.
- GitHub API rate limit.
- Missing profile fields.

## Acceptance Criteria

- Valid user returns a profile summary.
- Invalid user returns not found.
- Profile URL input works.
- Missing fields do not break output.
- Rate limit response is handled cleanly.

</details>

---

- [ ] Implement `gitignore`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Generate `.gitignore` templates for languages, frameworks, tools, and operating systems.

## Category

Git / GitHub Tools

## Suggested Names

- `gitignore`
- `ignore`

## Functional Specs

The tool should support:

- Single template generation.
- Multiple template merge.
- Template listing.
- Unknown template suggestions.

## Inputs

- Template names:
  - `node`
  - `python`
  - `java`
  - `nextjs`
  - `react`
  - `vscode`
  - `jetbrains`
  - `windows`
  - `macos`
  - `linux`
- Optional list mode.

## Outputs

- `.gitignore` content.
- Used templates.
- Unknown template warnings.
- Attachment if output is long.

## Recommended Approaches

Choose one:

1. Local templates stored in the repo.
2. Fetch templates from GitHub's official gitignore repository.
3. Use a gitignore template API.

## Recommended Packages

- No required package.
- `fastest-levenshtein` for template suggestions.

## Small Tutorial

A local-template approach is the most stable.

```js
const template = templates.get("node");
```

For remote templates:

```js
const response = await fetch(rawTemplateUrl);
const text = await response.text();
```

Cache remote templates so the command still works if the network fails.

## Validation Rules

- Use allowlisted template names.
- Normalize aliases such as `nodejs` to `node`.
- Limit number of templates per request.
- Deduplicate repeated sections.

## Edge Cases

- Unknown template.
- Network failure.
- Template name typo.
- Duplicate templates.
- Output too long.

## Acceptance Criteria

- Node template is generated.
- Multiple templates merge correctly.
- Unknown templates produce suggestions.
- Output can be sent as an attachment.
- Works offline if local templates are used.

</details>

---

- [ ] Implement `github repo`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Fetch and display a GitHub repository summary.

## Category

Git / GitHub Tools

## Suggested Names

- `github repo`
- `gh repo`
- `repo`

## Functional Specs

The tool should display:

- Repository name.
- Owner.
- Description.
- Stars.
- Forks.
- Open issues.
- Default branch.
- License.
- Primary language.
- Topics.
- Last updated date.
- Latest release if available.

## Inputs

- `owner/repo`.
- GitHub repository URL.

## Outputs

- Repository summary.
- Repository URL.
- Clone URL.
- Latest release summary.

## Recommended Packages

- `@octokit/rest`
- Optional: native `fetch`

## Small Tutorial

Use Octokit repository endpoints.

```js
const repoResponse = await octokit.rest.repos.get({
  owner,
  repo,
});
```

For latest release:

```js
const releaseResponse = await octokit.rest.repos.getLatestRelease({
  owner,
  repo,
});
```

Handle `404` from latest release as “No releases found”.

## Validation Rules

- Parse `owner/repo` safely.
- Extract owner and repo from GitHub URLs.
- Handle private/inaccessible repositories.
- Cache responses briefly.
- Do not expose GitHub token errors.

## Edge Cases

- No release.
- No license.
- Archived repo.
- Forked repo.
- Transferred repo.
- Rate limit.

## Acceptance Criteria

- Public repo returns summary.
- Repo URL input works.
- Missing release does not fail the command.
- Missing license displays cleanly.
- Rate limit is handled.

</details>

---

- [ ] Implement `github issue`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Fetch and display a GitHub issue summary.

## Category

Git / GitHub Tools

## Suggested Names

- `github issue`
- `gh issue`
- `issue`

## Functional Specs

The tool should display:

- Issue title.
- Issue number.
- State.
- Author.
- Labels.
- Assignees.
- Milestone.
- Comment count.
- Created date.
- Updated date.
- Closed date if closed.
- Body excerpt.
- Issue URL.

## Inputs

- `owner/repo#number`.
- `owner/repo number`.
- GitHub issue URL.

## Outputs

- Compact issue summary.
- Labels as readable names.
- Body excerpt with safe truncation.
- PR warning if the issue is actually a pull request.

## Recommended Packages

- `@octokit/rest`

## Small Tutorial

Use the GitHub issues endpoint.

```js
const issueResponse = await octokit.rest.issues.get({
  owner,
  repo,
  issue_number,
});
```

GitHub pull requests are also issues internally, so check for the `pull_request` field.

```js
const isPullRequest = Boolean(issue.pull_request);
```

## Validation Rules

- Issue number must be a positive integer.
- Parse issue URLs carefully.
- Escape mentions from issue body.
- Truncate body excerpt.
- Handle 404 and rate limits.

## Edge Cases

- Issue is a pull request.
- Issue not found.
- Repository private.
- Many labels.
- Long body.
- Deleted user author.

## Acceptance Criteria

- Open issue returns summary.
- Closed issue returns summary.
- Pull request issue is detected.
- Invalid issue number is rejected.
- Issue URL input works.

</details>

---

# Phase 5 — Discord Tools

---

- [ ] Implement `snowflake`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Decode Discord snowflake IDs into creation time and internal components.

## Category

Discord Tools

## Suggested Names

- `snowflake`
- `sf`
- `idinfo`

## Functional Specs

The tool should support:

- Raw Discord IDs.
- User mentions.
- Role mentions.
- Channel mentions.
- Creation timestamp extraction.
- Discord timestamp output.

## Inputs

- Snowflake ID.
- Mention string.

## Outputs

- Snowflake ID.
- Created date.
- Unix timestamp.
- Discord timestamp.
- Worker ID.
- Process ID.
- Increment.

## Required Native APIs

- `BigInt`

## Recommended Packages

No package required.

## Small Tutorial

Discord snowflakes contain the timestamp in the upper bits.

```js
const discordEpoch = 1420070400000n;
const timestampMs = (BigInt(id) >> 22n) + discordEpoch;
const date = new Date(Number(timestampMs));
```

Extract components using bit shifts and masks.

## Validation Rules

- Extract numeric ID from mentions.
- Validate digits only.
- Use `BigInt`, not normal number arithmetic.
- Reject IDs that are too short or too long.

## Edge Cases

- User mention input.
- Channel mention input.
- Role mention input.
- Invalid snowflake-like number.
- Very large number.

## Acceptance Criteria

- Valid ID returns correct creation date.
- Mentions are parsed correctly.
- Invalid input is rejected.
- BigInt conversion errors are handled.

</details>

---

- [ ] Implement `color`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Parse and convert colors between HEX, RGB, HSL, and decimal formats.

## Category

Discord Tools

## Suggested Names

- `color`
- `colour`
- `hex`

## Functional Specs

The tool should support:

- HEX input.
- RGB input.
- HSL input.
- Decimal color input.
- Discord role color number.
- Color preview.

## Inputs

- Color string or number.

## Outputs

- HEX.
- RGB.
- HSL.
- Decimal.
- Optional preview image.
- Optional embed color preview.

## Recommended Packages

- `colord`
- Optional: `sharp` for preview image generation.

## Small Tutorial

Use `colord` for parsing and conversion.

```js
const color = colord(input);

const hex = color.toHex();
const rgb = color.toRgb();
const hsl = color.toHsl();
```

For Discord embeds, the decimal color can be derived from the hex value.

## Validation Rules

- Validate parsed color.
- Accept short HEX such as `#fff`.
- Accept HEX without `#` if desired.
- Reject RGB values outside 0-255.
- Reject invalid HSL values.

## Edge Cases

- `#fff`.
- `5865F2` without hash.
- `rgb(88, 101, 242)`.
- Decimal color input.
- Alpha colors.
- Invalid color names.

## Acceptance Criteria

- HEX converts to RGB and HSL.
- RGB converts to HEX.
- Decimal converts to HEX.
- Invalid input returns a clear error.
- Preview is visually understandable.

</details>

---

- [ ] Implement `avatar`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Display a user's Discord avatar.

## Category

Discord Tools

## Suggested Names

- `avatar`
- `pfp`

## Functional Specs

The tool should support:

- User mention.
- User ID.
- Default to the command author if no user is provided.
- Global avatar.
- Server avatar if available.
- Static and animated avatars.
- Size selection.

## Inputs

- Optional user mention or ID.
- Optional size.
- Optional format.

## Outputs

- Avatar URL.
- Global avatar URL.
- Server avatar URL if different.
- Download/open links.

## Required Packages

- `discord.js`

## Small Tutorial

Use Discord.js user/member avatar methods.

```js
const user = await client.users.fetch(userId);
const avatarUrl = user.displayAvatarURL({ size: 1024 });
```

For server avatar, use the guild member object.

```js
const memberAvatar = member.displayAvatarURL({ size: 1024 });
```

## Validation Rules

- Validate ID format.
- Allow only supported image sizes.
- Allow only supported formats.
- Handle user fetch failures.
- Avoid excessive API calls.

## Edge Cases

- User not in the server.
- User has no custom avatar.
- User has animated avatar.
- Server avatar differs from global avatar.
- Invalid user ID.

## Acceptance Criteria

- Mention returns avatar.
- ID returns avatar.
- No input returns caller avatar.
- Animated avatar uses GIF if available.
- Server avatar is shown when available.

</details>

---

- [ ] Implement `banner`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Display a user's Discord profile banner or accent color.

## Category

Discord Tools

## Suggested Names

- `banner`
- `user-banner`

## Functional Specs

The tool should support:

- User mention.
- User ID.
- Default to caller if no user is provided.
- Banner URL.
- Animated banner if available.
- Accent color fallback.

## Inputs

- Optional user mention or ID.
- Optional size.

## Outputs

- Banner URL if available.
- Accent color if no banner exists.
- Clear message if neither exists.

## Required Packages

- `discord.js`

## Small Tutorial

Fetch the full user with force when banner data may not be cached.

```js
const user = await client.users.fetch(userId, { force: true });
const bannerUrl = user.bannerURL({ size: 1024 });
```

If there is no banner, check accent color.

```js
const accentColor = user.hexAccentColor;
```

## Validation Rules

- Validate user ID.
- Limit API calls.
- Cache results briefly.
- Allow only valid image sizes.
- Handle users without banners.

## Edge Cases

- No banner.
- No accent color.
- Animated banner.
- User fetch fails.
- Discord API rate limit.

## Acceptance Criteria

- User with banner displays banner.
- User without banner displays accent color if available.
- No input uses command author.
- Invalid user returns a clear error.

</details>

---

- [ ] Implement `server info`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Display useful information about the current Discord server.

## Category

Discord Tools

## Suggested Names

- `serverinfo`
- `server-info`
- `guildinfo`

## Functional Specs

The tool should support sections:

- Overview.
- Roles.
- Channels.
- Emojis.
- Boosts.
- Security.

## Inputs

- Optional section.
- Optional compact/full mode.

## Outputs

Overview:

- Server name.
- Server ID.
- Owner.
- Created date.
- Member count.
- Bot count if available.
- Channel count.
- Role count.
- Emoji count.
- Boost level.
- Verification level.

Security:

- Verification level.
- MFA level.
- Explicit content filter.
- Default message notifications.
- Dangerous permissions summary.

## Required Packages

- `discord.js`

## Small Tutorial

Most server data is available from the guild object.

```js
const guild = interaction.guild;
const owner = await guild.fetchOwner();
```

For member counts, prefer cached values unless you have the required intents and a good reason to fetch all members.

## Validation Rules

- Must run inside a guild.
- Do not run in DMs.
- Avoid fetching all members in large guilds.
- Respect bot permissions.
- Handle missing intents.

## Edge Cases

- Missing member intent.
- Large guild.
- Owner fetch failure.
- Hidden channels.
- Bot lacks permissions.

## Acceptance Criteria

- Overview section works.
- Roles section works.
- Channels section works.
- Security section works.
- DM usage returns a clear error.

</details>

---

# Phase 6 — Security / Moderation Utilities

---

- [ ] Implement `scan url`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Inspect URLs for redirects, suspicious patterns, unsafe protocols, and basic risk signals.

## Category

Security / Moderation Utilities

## Suggested Names

- `scan-url`
- `url-scan`
- `link-scan`

## Functional Specs

The tool should inspect:

- Protocol.
- Hostname.
- Domain.
- Public/private IP status.
- Redirect chain.
- Final URL.
- Status code.
- Content type.
- Suspicious patterns.
- Executable file extensions.
- Punycode domains.
- URL shorteners.

## Inputs

- URL.
- Optional depth mode.

## Outputs

- Original URL.
- Normalized URL.
- Final URL.
- Redirect chain.
- HTTP status.
- Content type.
- Risk flags.
- Verdict:
  - `Looks normal`
  - `Suspicious`
  - `Blocked`
  - `Unknown`

## Required Native APIs

- `URL`
- `node:dns/promises`
- `fetch`
- `AbortController`

## Recommended Packages

- `undici`
- `tldts`
- `ipaddr.js`
- Optional: `link-preview-js`

## Optional External Services

- Google Safe Browsing API.
- VirusTotal API.

These require API keys and stricter rate limits.

## Small Tutorial

Parse the URL first.

```js
const parsed = new URL(input);
```

Resolve the hostname and reject private IPs before making a request.

```js
const addresses = await dns.lookup(parsed.hostname, { all: true });
```

Fetch one redirect step at a time using manual redirects.

```js
const response = await fetch(url, {
  method: "HEAD",
  redirect: "manual",
});
```

Re-validate every redirect target before following it.

## Validation Rules

- Allow only `http:` and `https:`.
- Reject localhost.
- Reject private IPs.
- Reject internal hostnames.
- Limit redirects.
- Use timeout.
- Do not download large bodies.
- Never claim a URL is 100% safe.
- Warn instead of guaranteeing safety.

## Suspicious Signals

- Non-HTTPS URL.
- IP address instead of domain.
- Punycode domain.
- Too many subdomains.
- Encoded URL inside query string.
- Executable file extension.
- Suspicious redirect chain.
- URL contains username/password.
- Final domain differs from initial domain.

## Edge Cases

- URL shorteners.
- Redirect loops.
- Redirect to private IP.
- Server blocks HEAD.
- Punycode phishing.
- Unicode lookalike domains.
- Large downloads.
- Cloudflare challenges.

## Acceptance Criteria

- Normal HTTPS URL gives a clean result.
- Shortened URL shows redirect chain.
- Localhost/private IP is blocked.
- Punycode domain is flagged.
- Executable download is flagged.
- Verdict language avoids false certainty.

</details>

---

- [ ] Implement `jwt decode`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Decode JWT header and payload without verifying the signature.

## Category

Security / Moderation Utilities

## Suggested Names

- `jwt`
- `jwt-decode`

## Functional Specs

The tool should support:

- JWT header decoding.
- JWT payload decoding.
- Expiration check.
- Issued-at display.
- Not-before display.
- Algorithm display.
- Clear warning that signature is not verified.

## Inputs

- JWT string.

## Outputs

- Header JSON.
- Payload JSON.
- Algorithm.
- Expiration time.
- Expired status.
- Issuer.
- Audience.
- Subject.
- Warning message.

## Recommended Packages

- `jose`

## Optional Packages

- `jsonwebtoken`

## Small Tutorial

Use `jose` decode helpers.

```js
const header = decodeProtectedHeader(token);
const payload = decodeJwt(token);
```

This only decodes the token. It does not verify the signature.

For expiration:

```js
const expiresAt = new Date(payload.exp * 1000);
const expired = Date.now() > expiresAt.getTime();
```

## Validation Rules

- JWT must have exactly 3 parts.
- Reject JWE tokens unless explicitly supported.
- Limit token length.
- Do not log the token.
- Do not display the full token back to the user.
- Use ephemeral output if possible.

## Edge Cases

- Malformed JWT.
- Expired JWT.
- Missing `exp`.
- `alg: none`.
- Very large payload.
- JWE with 5 parts.
- Non-JSON payload.

## Acceptance Criteria

- Valid JWT decodes header and payload.
- Expired token is detected.
- Malformed token returns a clean error.
- JWE token is marked unsupported.
- Signature warning is always shown.

</details>

---

# Phase 7 — Text Tools

---

- [ ] Implement `case`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Convert text between common programming and writing case styles.

## Category

Text Tools

## Suggested Names

- `case`
- `convert-case`

## Functional Specs

The tool should support:

- camelCase.
- PascalCase.
- snake_case.
- kebab-case.
- CONSTANT_CASE.
- Title Case.
- Sentence case.
- lower case.
- UPPER CASE.

## Inputs

- Target case.
- Text input.

## Outputs

- Converted text.
- Target case.
- Optional detected words.

## Recommended Packages

- `change-case`

## Small Tutorial

Use functions from `change-case`.

```js
const camel = camelCase(input);
const pascal = pascalCase(input);
const snake = snakeCase(input);
const kebab = paramCase(input);
```

Different versions of the package may expose slightly different function names, so confirm the installed API during implementation.

## Validation Rules

- Target case must be allowlisted.
- Limit input length.
- Escape mentions.
- Preserve numbers when possible.
- Make Unicode behavior predictable.

## Edge Cases

- `helloWorld`.
- `HTTPServerError`.
- `hello-world`.
- `hello_world`.
- Multiple spaces.
- Numbers inside words.
- Mixed Arabic and English.

## Acceptance Criteria

- Text converts to camelCase.
- Text converts to PascalCase.
- Text converts to snake_case.
- Text converts to kebab-case.
- Invalid target case is rejected.

</details>

---

- [ ] Implement `slug`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Convert text into URL-friendly slugs.

## Category

Text Tools

## Suggested Names

- `slug`
- `slugify`

## Functional Specs

The tool should support:

- Lowercase slugs.
- Dash separator.
- Optional underscore separator.
- Symbol removal.
- Repeated separator cleanup.
- Optional Arabic preservation/transliteration behavior.

## Inputs

- Text input.
- Optional separator.
- Optional strict mode.

## Outputs

- Slug.
- Slug length.
- Warning if output is empty.

## Recommended Packages

- `slugify`

## Small Tutorial

Use `slugify` with strict mode.

```js
const slug = slugify(input, {
  lower: true,
  strict: true,
});
```

For custom separators:

```js
const slug = slugify(input, {
  lower: true,
  replacement: "-",
});
```

## Validation Rules

- Limit input length.
- Reject empty input.
- Reject empty slug output.
- Normalize repeated separators.
- Trim leading/trailing separators.

## Edge Cases

- Emojis.
- Arabic text.
- Punctuation-heavy titles.
- Already-slugified text.
- Multiple spaces.
- Very long titles.

## Acceptance Criteria

- `My Cool Project!` becomes `my-cool-project`.
- Repeated spaces are cleaned.
- Symbols are removed or normalized.
- Empty output is handled.
- Separator option works.

</details>

---

- [ ] Implement `morse`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Encode English text to Morse code and decode Morse code back to text.

## Category

Text Tools

## Suggested Names

- `morse`
- `morse-code`

## Functional Specs

The tool should support:

- Encoding letters A-Z.
- Encoding numbers 0-9.
- Encoding basic punctuation.
- Decoding Morse code.
- Word separation using `/`.
- Unsupported character warnings.

## Inputs

- Mode:
  - `encode`
  - `decode`
- Text or Morse input.

## Outputs

- Encoded Morse.
- Decoded text.
- Unsupported characters list.

## Recommended Packages

No package required.

## Required Data

A static Morse mapping table.

## Small Tutorial

Use a map for encoding.

```js
const morse = {
  A: ".-",
  B: "-...",
  C: "-.-.",
};
```

For decoding, reverse the map.

```js
const reverse = Object.fromEntries(
  Object.entries(morse).map(([letter, code]) => [code, letter]),
);
```

## Validation Rules

- Limit input length.
- Normalize text to uppercase for encoding.
- Use spaces between letters.
- Use `/` between words.
- Warn on unsupported characters.

## Edge Cases

- Lowercase input.
- Multiple spaces.
- Unknown punctuation.
- Arabic text.
- Malformed Morse code.
- Missing separators.

## Acceptance Criteria

- `hello` encodes correctly.
- Morse for `HELLO` decodes correctly.
- Spaces become `/`.
- Unsupported characters are reported.
- Malformed Morse does not crash.

</details>

---

# Phase 8 — Linux-like Fun but Useful

---

- [ ] Implement `which`.

<details>
<summary>Specs / Packages / Tutorial</summary>

## Purpose

Show whether a bot tool exists and display its metadata, similar to the shell `which` idea.

## Category

Linux-like Fun but Useful

## Suggested Names

- `which`
- `where`
- `tool`

## Functional Specs

The tool should support:

- Lookup by command name.
- Lookup by alias.
- Fuzzy suggestions.
- Tool status display.
- Category display.
- Basic usage display.

## Inputs

- Tool name or alias.

## Outputs

- Found/not found.
- Canonical tool name.
- Category.
- Description.
- Aliases.
- Enabled/disabled status.
- Access level.
- Usage.
- Similar tools if not found.

## Required Internal Dependency

- Shared tool registry.

## Recommended Packages

- `fastest-levenshtein`

## Small Tutorial

Search the registry first by canonical name, then by alias.

```js
const direct = registry.get(input);
```

For suggestions, compare the input against known tool names.

```js
const score = distance(input, tool.name);
```

Return the closest few matches under a safe threshold.

## Validation Rules

- Input must be a simple tool name.
- Do not execute anything.
- Hide tools the user is not allowed to see if necessary.
- Keep output short.

## Edge Cases

- Alias lookup.
- Typo.
- Disabled tool.
- Dev-only tool.
- Category name instead of command name.

## Acceptance Criteria

- Existing tool is found.
- Alias resolves to canonical tool.
- Typo returns useful suggestions.
- Unknown tool returns not found.
- Disabled tools display status correctly.

</details>

---

# Recommended Package Installation Plan

## Minimal Package Set

- [ ] `zod`
- [ ] `ms`
- [ ] `@octokit/rest`
- [ ] `whoiser`
- [ ] `tldts`
- [ ] `ipaddr.js`
- [ ] `jose`
- [ ] `colord`
- [ ] `change-case`
- [ ] `slugify`
- [ ] `safe-regex2`
- [ ] `fastest-levenshtein`

<details>
<summary>Why this set is enough</summary>

This package set covers the selected tools without adding unnecessary heavy dependencies.

- `zod`: validation across all tools.
- `ms`: duration parsing for timestamp.
- `@octokit/rest`: GitHub user/repo/issue APIs.
- `whoiser`: WHOIS lookups.
- `tldts`: domain parsing.
- `ipaddr.js`: network safety checks.
- `jose`: JWT decoding.
- `colord`: color parsing/conversion.
- `change-case`: case conversions.
- `slugify`: slug generation.
- `safe-regex2`: regex safety checks.
- `fastest-levenshtein`: suggestions for `which` and `gitignore`.

Optional packages such as `prettier`, `undici`, `sharp`, and `chrono-node` can be added only if the initial implementation needs them.

</details>

---

## Optional Package Set

- [ ] `prettier`
- [ ] `undici`
- [ ] `chrono-node`
- [ ] `date-fns`
- [ ] `sharp`
- [ ] `link-preview-js`
- [ ] `jsonc-parser`
- [ ] `regexp-tree`

<details>
<summary>When to use optional packages</summary>

Use optional packages only when the native or minimal implementation becomes too limited.

- `prettier`: better JSON/code formatting.
- `undici`: more control over HTTP behavior.
- `chrono-node`: natural language date parsing.
- `date-fns`: polished date formatting.
- `sharp`: image-based color previews.
- `link-preview-js`: richer URL preview data.
- `jsonc-parser`: JSON with comments/trailing commas.
- `regexp-tree`: advanced regex parsing.

</details>

---

# Suggested Build Order

## Stage 1 — Low-Risk Local Utilities

- [ ] `json formatter`
- [ ] `base64`
- [ ] `url`
- [ ] `hash`
- [ ] `uuid`
- [ ] `timestamp`
- [ ] `case`
- [ ] `slug`
- [ ] `morse`
- [ ] `snowflake`
- [ ] `which`

<details>
<summary>Reasoning</summary>

These tools do not require external APIs, do not perform network requests, and are easier to test.

They are the best first milestone because they establish:

- Validation patterns.
- Output formatting.
- Registry structure.
- Error handling.
- Documentation style.

</details>

---

## Stage 2 — Discord and GitHub Utilities

- [ ] `avatar`
- [ ] `banner`
- [ ] `server info`
- [ ] `github user`
- [ ] `github repo`
- [ ] `github issue`
- [ ] `gitignore`

<details>
<summary>Reasoning</summary>

These tools depend on Discord or GitHub APIs, but they are still controlled and predictable.

They require:

- API error handling.
- Rate-limit handling.
- Better caching.
- Permission-aware output.

</details>

---

## Stage 3 — Network and Security Utilities

- [ ] `regex test`
- [ ] `dns`
- [ ] `ping-host`
- [ ] `http` / `https check`
- [ ] `whois`
- [ ] `scan url`
- [ ] `jwt decode`

<details>
<summary>Reasoning</summary>

These tools need the most careful safety rules.

They involve:

- SSRF protection.
- Timeouts.
- Private IP blocking.
- Redirect validation.
- Sensitive input handling.
- Strong rate limits.

They should be implemented after the shared validation, registry, and output safety systems are already stable.

</details>

---

# Final Security Checklist

- [ ] Never execute user input through a shell.
- [ ] Never use `exec(userInput)`.
- [ ] Never trust URLs before parsing and validating them.
- [ ] Block local/private/internal network targets.
- [ ] Re-check every redirect destination.
- [ ] Use timeouts on all network requests.
- [ ] Use cooldowns on all commands.
- [ ] Use stricter cooldowns on network commands.
- [ ] Escape all mentions in user-generated output.
- [ ] Do not log JWTs.
- [ ] Do not log sensitive URL query strings.
- [ ] Do not expose raw stack traces.
- [ ] Do not claim scanned URLs are guaranteed safe.
- [ ] Keep GitHub tokens in environment variables only.
- [ ] Cache external API responses where reasonable.
- [ ] Convert oversized output to attachments.
- [ ] Keep every tool testable as a standalone function.

---

# Completion Definition

A tool is considered complete only when:

- [ ] Its input schema is implemented.
- [ ] Its core logic is implemented.
- [ ] Its output is safely formatted.
- [ ] Its errors are handled cleanly.
- [ ] Its edge cases are tested.
- [ ] Its acceptance criteria pass.
- [ ] Its metadata is registered.
- [ ] It appears correctly in `which`.
- [ ] It respects cooldowns and permissions.
- [ ] It has no unsafe shell execution.
