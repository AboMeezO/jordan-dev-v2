# Slash Commands

## Integration

Slash commands use CommandKit (`github:AboMeezO/DevRoots-Commandkit`). Configuration is in `src/app.ts`:

```ts
new CommandKit({
    client: this.client,
    commandsPath: path.resolve("src/Commands"),
    eventsPath: path.resolve("src/Events"),
    validationsPath: path.resolve("src/Validations"),
    devGuildIds: [process.env.DEV_GUILD_ID!],
    bulkRegister: true,
});
```

## File Locations

- Command files: `src/Commands/` (e.g., `dev.ts`, `remind.ts`, `reminders.ts`)
- Event files: `src/Events/` (e.g., `clientReady/log.ts`, `messageCreate/chatCommands.ts`)
- Validation files: `src/Validations/`

## Note

Chat command events (`messageCreate/chatCommands.ts`) live in the Events directory and are managed by CommandKit, but they dispatch to the custom chat command system rather than being slash commands.
