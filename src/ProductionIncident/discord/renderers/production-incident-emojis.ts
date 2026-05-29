export type ProductionIncidentEmojiKey =
  | "backend"
  | "cost"
  | "database"
  | "deploy"
  | "end"
  | "failure"
  | "frontend"
  | "incident"
  | "logs"
  | "sanity"
  | "security"
  | "stability"
  | "status"
  | "success"
  | "timer"
  | "users"
  | "vote"
  | "warning";

export interface AvailableDiscordEmoji {
  readonly id: string;
  readonly name: string | null;
}

const FALLBACKS: Readonly<Record<ProductionIncidentEmojiKey, string>> = {
  backend: "[BE]",
  cost: "[COST]",
  database: "[DB]",
  deploy: "[DEPLOY]",
  end: "[END]",
  failure: "[FAIL]",
  frontend: "[FE]",
  incident: "[INC]",
  logs: "[LOGS]",
  sanity: "[SANITY]",
  security: "[SEC]",
  stability: "[STAB]",
  status: "[STATUS]",
  success: "[OK]",
  timer: "[TIME]",
  users: "[USERS]",
  vote: "[VOTE]",
  warning: "[WARN]",
};

const EMOJI_NAMES: Readonly<Record<ProductionIncidentEmojiKey, string>> = {
  backend: "pi_backend",
  cost: "pi_cost",
  database: "pi_database",
  deploy: "pi_deploy",
  end: "pi_end",
  failure: "pi_failure",
  frontend: "pi_frontend",
  incident: "pi_incident",
  logs: "pi_logs",
  sanity: "pi_sanity",
  security: "pi_security",
  stability: "pi_stability",
  status: "pi_status",
  success: "pi_success",
  timer: "pi_timer",
  users: "pi_users",
  vote: "pi_vote",
  warning: "pi_warning",
};

export class ProductionIncidentEmojiRegistry {
  private readonly customByKey = new Map<ProductionIncidentEmojiKey, string>();

  public emoji(key: string | undefined): string {
    if (key === undefined || !isEmojiKey(key)) {
      return "";
    }

    return this.customByKey.get(key) ?? FALLBACKS[key];
  }

  public sync(available: readonly AvailableDiscordEmoji[]): void {
    this.customByKey.clear();

    for (const key of Object.keys(EMOJI_NAMES) as ProductionIncidentEmojiKey[]) {
      const name = EMOJI_NAMES[key];
      const match = available.find((emoji) => emoji.name === name);

      if (match !== undefined) {
        this.customByKey.set(key, `<:${name}:${match.id}>`);
      }
    }
  }

  public summary(): {
    readonly found: readonly ProductionIncidentEmojiKey[];
    readonly missing: readonly ProductionIncidentEmojiKey[];
  } {
    const keys = Object.keys(EMOJI_NAMES) as ProductionIncidentEmojiKey[];

    return {
      found: keys.filter((key) => this.customByKey.has(key)),
      missing: keys.filter((key) => !this.customByKey.has(key)),
    };
  }
}

function isEmojiKey(value: string): value is ProductionIncidentEmojiKey {
  return Object.hasOwn(FALLBACKS, value);
}
