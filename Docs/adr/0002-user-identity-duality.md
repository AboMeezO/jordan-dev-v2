# User Identity Duality (Discord + Clerk)

The platform is self-hosted with no public Clerk callbacks, so Discord identity is the only available authentication in production. Rather than building a Discord-only user model and remodeling later, we made both `clerkUserId` and `discordUserId` nullable unique fields on the User model with a constraint that at least one must be set. In the Discord-only phase, users are created on first bot interaction keyed to `discordUserId`. When Clerk hosting arrives, existing records get linked to a `clerkUserId` retroactively — no structural migration needed.

**Status:** `accepted`

**Considered Options:**
- **Clerk-only** — requires public hosting and Clerk callbacks. Cannot work today.
- **Discord-only now, remodel at Clerk migration** — would require a data migration and service rewrite later. More disruption than the nullable approach.
- **Dual identity (chosen)** — one extra nullable column now, zero disruption later.
