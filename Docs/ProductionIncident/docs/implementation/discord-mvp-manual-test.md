# Discord MVP Manual Test

1. Start the bot with `npm run dev`.
2. In the configured development guild, run `/dev incident`.
3. Confirm the bot posts a clean bilingual lobby with Join, Start, and Cancel buttons.
4. Click `Join` from at least one account.
5. Confirm the lobby player count updates and the user receives an ephemeral acknowledgement.
6. As a non-host, click `Start` and confirm the bot rejects it ephemerally.
7. As the host, click `Start`.
8. Confirm a thread is created when Discord permissions allow it; otherwise confirm messages continue in the original channel.
9. Confirm role summary appears.
10. Confirm the first incident card appears with fallback or custom emoji labels.
11. Confirm `Voting closes` shows a future Discord timestamp.
12. Click `Inspect logs` or another instant utility action and confirm it returns an ephemeral clue without registering a vote.
13. Click vote buttons from joined players and confirm button counts update.
14. Wait for the vote window to close.
15. Confirm result, status, and aggregated system notes render without repeated Commentary headings.
16. Confirm closed/result messages do not show stale `seconds ago` countdown text.
17. Click an old action button after closure and confirm the bot rejects the late vote ephemerally.
18. Click host-only `End Session` and confirm the final report renders and future buttons fail safely.
19. Run a full session and confirm it auto-ends after 10 handled incidents or when critical stats collapse.
20. Start a second lobby and click `Cancel` as host to verify lobby cancellation and disabled controls.
