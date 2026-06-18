# Core Engine Architecture

Design the game engine as a **standalone, event-driven system** in TypeScript. Define strict **domain models** (no `any`) for all game concepts. For example, use `interface` or `class` for players, roles, game state and incidents. Enable strict TS options (`strict: true`, `noImplicitAny`, `strictNullChecks`, etc.) in `tsconfig.json` to enforce type safety【30†L206-L214】【30†L115-L124】. At runtime, maintain a `Map<string, GameSession>` (keyed by guild or thread ID) to hold each game’s state in memory; Discord.js itself caches guild data in `client.guilds.cache`【19†L174-L182】, and our sessions can be stored similarly.

- **Key classes/types:** e.g. `GameSession`, `Player`, `IncidentDirector`, `Incident`, `Action`. Each has explicit types for properties (no implicit types on public interfaces【30†L124-L133】).
- **Session state:** Keep stability, happiness, sanity as numeric fields on the session object. Use discriminated unions or enums for states (e.g. `enum GameState { WAITING, RUNNING, ENDED }`). Model all state transitions and outcomes in code.
- **Immutability:** Where possible, treat session state as immutable snapshots passed to handlers, or carefully update via methods. This aligns with domain-driven design – model “Game”, not how it’s displayed【30†L148-L160】.
- **Caching:** Preload incident templates into memory (e.g. a `Map<string, IncidentTemplate>`). Optionally use an in-memory cache (or lightweight JSON database) if the engine needs fast lookup or persistence later【25†L506-L514】.

By separating logic from Discord, you can later swap the interface without touching core logic.

# Incident Template Schema

Define incident **templates** in static JSON/YAML files and load them into the engine. Each template is a blueprint, not a fixed event. For example:

```ts
// src/types/incident.ts
export interface IncidentActionConfig {
	id: string;
	label: string;
	tags: string[];
	allowedRoles?: string[];
	successRate: number;
	effects: {
		stability?: number;
		happiness?: number;
		sanity?: number;
	};
	failEffects?: {
		stability?: number;
		happiness?: number;
		sanity?: number;
	};
}
export interface IncidentTemplate {
	id: string;
	category: string;
	weight: number;
	severityRange: string[]; // e.g. ["MEDIUM", "HIGH"]
	tags: string[];
	// Generation parameters:
	rootCauses: string[];
	affectedServices: string[];
	titles: string[];
	descriptions: string[];
	actionTags: string[]; // which actions apply (e.g. ["RESTART","SCALE","HOTFIX"])
}
```

An example JSON template might be:

```jsonc
// src/templates/memory_leak.json
{
	"id": "memory_leak",
	"category": "INFRASTRUCTURE",
	"weight": 5,
	"severityRange": ["LOW", "MEDIUM", "HIGH"],
	"tags": ["MEMORY"],
	"rootCauses": [
		"recursive_job",
		"cache_overflow",
		"unclosed_connections",
	],
	"affectedServices": [
		"Authentication",
		"Payments",
		"Uploads",
	],
	"titles": [
		"Memory leak detected",
		"RAM usage exceeded",
		"Container memory exhaustion",
	],
	"descriptions": [
		"Memory consumption spiked rapidly",
		"One service reached memory limit",
	],
	"actionTags": ["RESTART", "SCALE", "HOTFIX", "IGNORE"],
}
```

Load templates with TS’s JSON import (via `resolveJsonModule: true` in tsconfig)【16†L223-L232】. This lets the compiler type-check the template structure. In the engine, **randomize** elements at runtime: pick a random title/description, choose a `rootCause`, etc. Also select a subset of actions tagged by `actionTags` to present as buttons. The engine should support **multiple valid outcomes**: each action has a success chance and different effects, so one action might be “better” than another but not the only correct choice.

# Discord Integration Layer

Implement a separate **Discord interface module** that translates bot events into engine calls and formats engine state into messages. Use your existing command/event handler structure (command kit) for this. For example, handle a slash command `/dev incident` by calling `GameEngine.createSession()`, then post an embed with a “Join Incident” button.

- **Slash commands:** Define a `/dev incident` command to start. On use, spawn a new game thread (or channel) and a `GameSession`. Use `Interaction.reply()` or `followUp()` with Discord `components` (buttons/selects) to show options.
- **Button interactions:** When a user clicks an action button, route that through your Discord handler to the game session (e.g. `gameSession.vote(userId, actionId)`). Use `custom_id` strings on components to encode action identifiers. Discord components (buttons, selects) are fully supported by Discord.js【11†L175-L184】.
- **Ephemeral messages:** Send private (ephemeral) messages to individual players for role assignment or clues. For example, send each player an ephemeral message stating their role. The `interaction.followUp({ content, ephemeral: true })` API is designed for this.

- **Message formatting:** Build messages using `EmbedBuilder` and `MessageActionRow`/`ButtonBuilder`. For consistency, create a utility to style all embeds/buttons (use similar colors, truncation logic, etc.)【25†L579-L584】. Example:

  ```ts
  const embed = new EmbedBuilder()
  	.setTitle("🚨 INCIDENT DETECTED")
  	.setDescription(
  		"Memory leak detected in Payments service",
  	)
  	.setColor("#ff4444")
  	.setTimestamp();
  const buttons =
  	new ActionRowBuilder<ButtonBuilder>().addComponents(
  		new ButtonBuilder()
  			.setCustomId("restart_service")
  			.setLabel("Restart Service")
  			.setStyle(ButtonStyle.Primary),
  		// ...other buttons
  	);
  await channel.send({
  	embeds: [embed],
  	components: [buttons],
  });
  ```

Because future features may include images or rich media, encapsulate Discord message creation so that views can be changed easily.

# Runtime Systems

The engine runs _in real time_ on a loop of incidents. Key systems:

- **Director:** Monitors global game time and stats. It schedules the next incident based on a timer (e.g. every 8–15 seconds) and difficulty. Use something like `setInterval()` or a game loop tick. Adjust pacing dynamically: as difficulty rises, reduce timer delays or spawn simultaneous incidents. Example: if `stability < 30%`, increase incident frequency or trigger chain reactions. The director picks a random template (weighted by `template.weight`) and uses it to generate an `Incident` instance (populating cause, service, etc.).

- **Voting:** When an incident appears, send the question with buttons. Track votes in `gameSession`. Each player’s click adds to a tally. After the countdown, determine the winning action by **highest vote count**. Optionally weight votes by role (e.g. DevOps vote = 1.5×). Ties or no-votes can default to a neutral outcome (e.g. “Ignore” triggers partial failure).

- **Simulation:** Apply the chosen action to the incident. Compute a random success check (`Math.random()` vs `action.successRate`). On success, apply `effects` (e.g. `stability += 10`). On failure, apply `failEffects` (e.g. `stability -= 15`) and possibly trigger a related incident (chain). Update the `GameSession` stats. For example, if the action is “Increase Server RAM” and it fails, do `stability -= 12` and then schedule a “Cloud billing spike” event after a delay.

- **Chain reactions & conditions:** Some choices spawn new incidents. For instance, if _Ignore_ was chosen, push an event like “Queue Overflow”. Define these in the template or engine rules: e.g. `if (action.id === 'ignore') { spawnIncident('queue_overflow'); }`. Similarly, schedule delayed effects (e.g. revenue loss) using `setTimeout` to modify stats a few seconds later.

- **Automated Commentary:** Inject flavor text into the channel based on game state or actions. Implement a small rules-based system: if `stability` or `sanity` drops below thresholds, send a warning message (e.g. “⚠️ Multiple systems are unstable”). If players choose certain options, add humor (“⚠️ Infrastructure team is questioning recent decisions.”). Keep a library of messages; trigger them on events. This is purely a UX enhancement, but the engine can call `discordChannel.send()` at key moments for immersion.

- **Game end:** Continue until a win/lose condition (time limit or stats reaching 0). Then send a final embed with results (survived or not). Clean up the `GameSession` and components (disable buttons).

All logic (director, voting, effects) lives in the engine code, not in the Discord handlers. The Discord layer simply displays questions and feeds back answers.

# Project Structure & Best Practices

Organize the code **by feature/domain**, not by technical role【23†L59-L66】【30†L124-L133】. For example:

```
src/
├── game/
│   ├── GameSession.ts      # main session class
│   ├── Incident.ts         # incident generation and logic
│   ├── Director.ts         # scheduling/incidents
│   └── Player.ts
├── templates/             # static JSON/YAML incident templates
├── discord/
│   ├── commands/          # slash command definitions (e.g. /dev incident)
│   ├── interactions/      # button/select handlers
│   └── views/             # message-building functions
├── types/                 # shared TS types (roles, game state, etc.)
├── utils/                 # random/weight helpers, config loader, caching
└── index.ts               # bot startup (register commands, set up events)
```

- **Game vs UI separation:** `game/` holds **engine logic and data structures**; `discord/` holds interaction handlers and message templates. This ensures domain models don’t mix with Discord.js objects【30†L143-L152】.
- **Template loading:** Under `templates/`, incident files can be JSON (using `import foo from './template.json'`)【16†L223-L232】 or YAML (parsed at runtime). Validate loaded data with TypeScript interfaces.
- **Caching:** Use in-memory maps for sessions and template lookup. Optionally preload all templates at startup into a constant. For any repeated expensive calculation, use memoization or a small cache library.
- **Environment/config:** Manage config (e.g. time delays, stats thresholds) via environment variables or a config file. Use a typed config module to validate inputs at startup (avoid magic numbers in code).
- **Testing:** Write unit tests for engine classes (incident resolution, stat updates, voting logic) using Jest or similar. Mock the Discord layer so tests don’t need a real bot. Integration tests can simulate button interactions by calling the engine methods directly.
- **TypeScript discipline:** Treat types as contracts. Use explicit return types on all public methods【30†L124-L133】. Avoid `any`—if parsing external data, use `unknown` and then validate before use【30†L206-L214】. Utilize enums or string literal unions for known categories (e.g. `type Role = "DevOps"|"Backend"|...;`).

For **deployment**, run on Node.js v18+ (Discord.js v14 requires it). Manage the bot as a service (e.g. with PM2 or Docker). Use environment variables for tokens and secret keys. Since game state is ephemeral, no database is needed initially, but keep the code open to adding a persistence layer if needed (e.g. saving high scores to a JSON file or database later【25†L506-L514】).

In summary, the design is **highly modular and scalable**: a strict TypeScript core engine (engine+templates) + a thin Discord interface layer. This allows future expansion (new incident types, UI changes, multimedia components) without rearchitecting. All core data (templates, types, classes) are statically defined, ensuring no run-time surprises【30†L124-L133】【23†L59-L66】.

**Sources:** We follow strong-typing and DDD principles【30†L124-L133】【30†L143-L152】, feature-oriented project structure【23†L59-L66】, and use Discord.js components and embeds as building blocks【25†L579-L584】【16†L223-L232】. These combined ensure a robust, maintainable bot architecture.
