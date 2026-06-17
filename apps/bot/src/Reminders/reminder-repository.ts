import type { Snowflake } from "discord.js";

import type {
  DatabaseAdapter,
  DatabaseRow,
  DatabaseTransaction,
} from "#Database";

import type { ReminderDelivery, ReminderRecord, ReminderRequest } from "./reminder-service.js";

export type ReminderStatus =
  | "pending"
  | "delivering"
  | "delivered"
  | "failed"
  | "canceled";

export interface StoredReminderRecord extends ReminderRecord {
  readonly status: ReminderStatus;
  readonly updatedAt: Date;
  readonly deliveredAt?: Date;
  readonly failureReason?: string;
}

export interface ReminderCreateInput extends ReminderRequest {
  readonly id: string;
  readonly createdAt: Date;
}

interface ReminderRow extends DatabaseRow {
  readonly id: string;
  readonly user_id: string;
  readonly channel_id: string;
  readonly message: string;
  readonly remind_at: string;
  readonly delivery: string;
  readonly status: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly delivered_at: string | null;
  readonly failure_reason: string | null;
}

export class ReminderRepository {
  public constructor(private readonly database: DatabaseAdapter) {}

  public async migrate(): Promise<void> {
    await this.database.transaction(async (tx) => {
      await ensureReminderSchema(tx);
    });
  }

  public async create(input: ReminderCreateInput): Promise<StoredReminderRecord> {
    const now = new Date();

    await this.database.transaction(async (tx) => {
      await tx.execute(
        `
          INSERT INTO reminders (
            id,
            user_id,
            channel_id,
            message,
            remind_at,
            delivery,
            status,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
        `,
        [
          input.id,
          input.userId,
          input.channelId,
          input.message,
          input.remindAt,
          input.delivery,
          input.createdAt,
          now,
        ],
      );
    });

    return {
      ...input,
      status: "pending",
      updatedAt: now,
    };
  }

  public async update(
    id: string,
    updates: Partial<Pick<ReminderRequest, "delivery" | "message" | "remindAt">>,
  ): Promise<StoredReminderRecord | undefined> {
    return this.database.transaction(async (tx) => {
      const current = await getReminder(tx, id);

      if (!current || current.status !== "pending") {
        return undefined;
      }

      const next = {
        ...current,
        ...updates,
        updatedAt: new Date(),
      };

      await tx.execute(
        `
          UPDATE reminders
          SET delivery = ?,
              message = ?,
              remind_at = ?,
              updated_at = ?
          WHERE id = ? AND status = 'pending'
        `,
        [next.delivery, next.message, next.remindAt, next.updatedAt, id],
      );

      return next;
    });
  }

  public async cancel(id: string): Promise<boolean> {
    return this.database.transaction(async (tx) => {
      const now = new Date();
      await tx.execute(
        `
          UPDATE reminders
          SET status = 'canceled',
              updated_at = ?
          WHERE id = ? AND status = 'pending'
        `,
        [now, id],
      );

      const reminder = await getReminder(tx, id);
      return reminder?.status === "canceled";
    });
  }

  public async listForUser(userId: Snowflake): Promise<readonly StoredReminderRecord[]> {
    return this.database.transaction(async (tx) => {
      const rows = await tx.query<ReminderRow>(
        `
          SELECT *
          FROM reminders
          WHERE user_id = ? AND status = 'pending'
          ORDER BY remind_at ASC
        `,
        [userId],
      );

      return rows.map(mapReminderRow);
    });
  }

  public async get(id: string): Promise<StoredReminderRecord | undefined> {
    return this.database.transaction(async (tx) => getReminder(tx, id));
  }

  public async listPending(): Promise<readonly StoredReminderRecord[]> {
    return this.database.transaction(async (tx) => {
      const rows = await tx.query<ReminderRow>(
        `
          SELECT *
          FROM reminders
          WHERE status = 'pending'
          ORDER BY remind_at ASC
        `,
      );

      return rows.map(mapReminderRow);
    });
  }

  public async markDelivering(id: string): Promise<StoredReminderRecord | undefined> {
    return this.transition(id, "pending", "delivering");
  }

  public async markDelivered(id: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      const now = new Date();
      await tx.execute(
        `
          UPDATE reminders
          SET status = 'delivered',
              delivered_at = ?,
              updated_at = ?
          WHERE id = ? AND status = 'delivering'
        `,
        [now, now, id],
      );
    });
  }

  public async markFailed(id: string, reason: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.execute(
        `
          UPDATE reminders
          SET status = 'failed',
              failure_reason = ?,
              updated_at = ?
          WHERE id = ? AND status = 'delivering'
        `,
        [reason, new Date(), id],
      );
    });
  }

  private async transition(
    id: string,
    from: ReminderStatus,
    to: ReminderStatus,
  ): Promise<StoredReminderRecord | undefined> {
    return this.database.transaction(async (tx) => {
      await tx.execute(
        `
          UPDATE reminders
          SET status = ?,
              updated_at = ?
          WHERE id = ? AND status = ?
        `,
        [to, new Date(), id, from],
      );

      const reminder = await getReminder(tx, id);
      return reminder?.status === to ? reminder : undefined;
    });
  }
}

async function ensureReminderSchema(tx: DatabaseTransaction): Promise<void> {
  await tx.execute(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message TEXT NOT NULL,
      remind_at TEXT NOT NULL,
      delivery TEXT NOT NULL CHECK (delivery IN ('channel', 'dm')),
      status TEXT NOT NULL CHECK (
        status IN ('pending', 'delivering', 'delivered', 'failed', 'canceled')
      ),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      delivered_at TEXT,
      failure_reason TEXT
    );
  `);

  await tx.execute(`
    CREATE INDEX IF NOT EXISTS idx_reminders_pending_time
    ON reminders(status, remind_at);
  `);

  await tx.execute(`
    CREATE INDEX IF NOT EXISTS idx_reminders_user_pending
    ON reminders(user_id, status, remind_at);
  `);
}

async function getReminder(
  tx: DatabaseTransaction,
  id: string,
): Promise<StoredReminderRecord | undefined> {
  const row = await tx.get<ReminderRow>(
    `
      SELECT *
      FROM reminders
      WHERE id = ?
    `,
    [id],
  );

  return row ? mapReminderRow(row) : undefined;
}

function mapReminderRow(row: ReminderRow): StoredReminderRecord {
  return {
    id: row.id,
    userId: row.user_id,
    channelId: row.channel_id,
    message: row.message,
    remindAt: new Date(row.remind_at),
    delivery: row.delivery as ReminderDelivery,
    status: row.status as ReminderStatus,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    ...(row.delivered_at ? { deliveredAt: new Date(row.delivered_at) } : {}),
    ...(row.failure_reason ? { failureReason: row.failure_reason } : {}),
  };
}
