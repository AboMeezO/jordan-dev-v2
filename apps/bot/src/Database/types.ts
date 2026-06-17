export type DatabaseDriver = "sqlite" | "postgres" | "mysql" | "json" | "memory";

export interface DatabaseConfig {
  readonly driver: DatabaseDriver;
  readonly url: string;
}

export interface DatabaseAdapter {
  readonly driver: DatabaseDriver;
  migrate(): Promise<void>;
  transaction<T>(work: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface DatabaseTransaction {
  execute(sql: string, params?: readonly DatabaseValue[]): Promise<void>;
  query<T extends DatabaseRow>(
    sql: string,
    params?: readonly DatabaseValue[],
  ): Promise<readonly T[]>;
  get<T extends DatabaseRow>(
    sql: string,
    params?: readonly DatabaseValue[],
  ): Promise<T | undefined>;
}

export type DatabaseValue = string | number | bigint | boolean | null | Date;
export type DatabasePrimitive = string | number | bigint | Buffer | null;
export type DatabaseRow = Record<string, DatabasePrimitive>;
