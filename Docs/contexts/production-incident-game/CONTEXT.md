# Production Incident Game

## Purpose
A multiplayer entertainment game where players role-play as engineers responding to simulated production outages.

## Glossary

### Game Session
A running instance of the game in a Discord channel. Has a lifecycle: `waiting` → `running` → `ended` (with `paused`/`recovering` intermediate states).

### Player
A Discord user participating in a game session. Has a display name, join time, and one Game Role.

### Incident
A simulated production outage presented to players. Has a category (`authentication`, `deployment`, `infrastructure`, `payments`, `performance`, `security`), a severity (`critical`, `high`, `medium`, `low`), and a status lifecycle (`active` → `voting` → `resolved`/`failed`/`expired`).

### Incident Template
A reusable blueprint for generating incidents at runtime. Contains randomized titles, descriptions, root causes, tags, and severity ranges with weighted selection.

### Action
A possible response to an Incident. Has a risk level, success rate, and effect on Global Stats. Can be executed instantly or require a Vote.

### Vote / Vote Window
A timed decision period where Players choose which Action to take for a given Incident. Votes are weighted by the player's Game Role.

### Game Role
A role a Player can hold in the game: `backend-engineer`, `devops`, `intern`, `qa`, `security-engineer`. Each has a vote weight and a set of allowed action tags. Game Roles have no effect outside the game context.

### Global Stats
Four metrics tracked across a Game Session: `developerSanity`, `infrastructureCost`, `serverStability`, `userHappiness`. Actions modify these in positive or negative directions.

### Engine
The pure game-logic core (zero Discord dependencies). Orchestrates sessions, incident generation, action resolution, voting, and commentary.
