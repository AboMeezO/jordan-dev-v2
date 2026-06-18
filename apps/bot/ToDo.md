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

- [x] Build a shared tool registry for all shell-like tools.
- [x] Build shared input validation utilities.
- [x] Build shared output formatting utilities.
- [x] Build shared network safety utilities.

---

# Phase 1 — Dev Utilities

---

- [x] Implement `json formatter`.
- [x] Implement `base64`.
- [x] Implement `url`.
- [x] Implement `hash`.
- [x] Implement `uuid`.
- [x] Implement `timestamp`.

---

# Phase 2 — Code Tools

---

- [x] Implement `regex test`.

---

# Phase 3 — Network Tools

---

- [ ] Implement `ping-host`. (Deferred — requires `net.Socket`; low priority)
- [x] Implement `dns`.
- [x] Implement `whois`.
- [x] Implement `http` / `https check` (as `url-scan`).

---

# Phase 4 — Git / GitHub Tools

---

- [x] Implement `github user`.
- [x] Implement `gitignore`.
- [x] Implement `github repo`.
- [x] Implement `github issue`.

---

# Phase 5 — Discord Tools

---

- [x] Implement `snowflake`.
- [x] Implement `color`.
- [x] Implement `avatar`.

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

- [x] Implement `banner`.

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

- [x] Implement `server info`.

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

- [x] Implement `scan url` (as `url-scan`).

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

- [x] Implement `jwt decode`.

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

- [x] Implement `case`.

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

- [x] Implement `slug`.

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

- [x] Implement `morse`.

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

- [x] Implement `which`.

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

- [x] `zod`
- [x] `ms`
- [x] `@octokit/rest`
- [x] `whoiser`
- [x] `tldts`
- [x] `ipaddr.js`
- [x] `jose`
- [x] `colord`
- [x] `change-case`
- [x] `slugify`
- [x] `safe-regex2`
- [x] `fastest-levenshtein`

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

- [x] `json formatter`
- [x] `base64`
- [x] `url`
- [x] `hash`
- [x] `uuid`
- [x] `timestamp`
- [x] `case`
- [x] `slug`
- [x] `morse`
- [x] `snowflake`
- [x] `which`

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

- [x] `avatar`
- [x] `banner`
- [x] `server info`
- [x] `github user`
- [x] `github repo`
- [x] `github issue`
- [x] `gitignore`

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

- [x] `regex test`
- [x] `dns`
- [ ] `ping-host` (Deferred)
- [x] `http` / `https check` (as `url-scan`)
- [x] `whois`
- [x] `scan url` (as `url-scan`)
- [x] `jwt decode`

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

- [x] Never execute user input through a shell.
- [x] Never use `exec(userInput)`.
- [x] Never trust URLs before parsing and validating them.
- [x] Block local/private/internal network targets.
- [x] Re-check every redirect destination.
- [x] Use timeouts on all network requests.
- [x] Use cooldowns on all commands.
- [x] Use stricter cooldowns on network commands.
- [x] Escape all mentions in user-generated output.
- [x] Do not log JWTs.
- [x] Do not log sensitive URL query strings.
- [x] Do not expose raw stack traces.
- [x] Do not claim scanned URLs are guaranteed safe.
- [x] Keep GitHub tokens in environment variables only.
- [x] Cache external API responses where reasonable.
- [x] Convert oversized output to attachments.
- [x] Keep every tool testable as a standalone function.

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
