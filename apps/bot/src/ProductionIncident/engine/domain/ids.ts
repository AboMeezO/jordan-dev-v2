declare const brand: unique symbol;

export type Brand<TValue, TBrand extends string> = TValue & {
  readonly [brand]: TBrand;
};

export type ActionId = Brand<string, "ActionId">;
export type EventId = Brand<string, "EventId">;
export type IncidentId = Brand<string, "IncidentId">;
export type IncidentTemplateId = Brand<string, "IncidentTemplateId">;
export type PlayerId = Brand<string, "PlayerId">;
export type RoleId = Brand<string, "RoleId">;
export type SessionId = Brand<string, "SessionId">;
export type TimerId = Brand<string, "TimerId">;
export type UnixMillis = Brand<number, "UnixMillis">;

