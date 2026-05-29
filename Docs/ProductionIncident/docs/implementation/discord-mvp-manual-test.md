# Discord MVP Manual Test

1. Start the bot with `npm run dev`.
2. In the configured development guild, run `/dev incident`.
3. Confirm the bot posts a Production Incident lobby with Join, Start, and Cancel buttons.
4. Click `Join Incident` from at least one account.
5. Confirm the lobby player count updates and the user receives an ephemeral acknowledgement.
6. As a non-host, click `Start Incident` and confirm the bot rejects it ephemerally.
7. As the host, click `Start Incident`.
8. Confirm a thread is created when Discord permissions allow it; otherwise confirm messages continue in the original channel.
9. Confirm an incident message is posted with action buttons.
10. Click an action button from a joined player and confirm the ephemeral vote acknowledgement.
11. Wait for the vote window to close or run long enough for the scheduled close.
12. Confirm result, commentary, and status messages render.
13. Click the old action button after closure and confirm the bot rejects the late vote ephemerally.
14. Start a second lobby and click `Cancel` as host to verify lobby cancellation and disabled controls.

