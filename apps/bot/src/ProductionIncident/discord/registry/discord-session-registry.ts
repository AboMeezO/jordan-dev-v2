import type { ActionId, IncidentId, SessionId, UnixMillis } from "../../engine/index.js";
import type { DiscordActionRouteKey } from "../interactions/discord-custom-id-codec.js";

export interface DiscordSessionBinding {
  readonly channelId: string;
  readonly guildId: string;
  readonly hostUserId: string;
  readonly lobbyMessageId?: string;
  readonly outputChannelId: string;
  readonly sessionId: SessionId;
  readonly threadId?: string;
}

export interface DiscordActionRoute {
  readonly actionId: ActionId;
  readonly createdAt: UnixMillis;
  readonly expiresAt?: UnixMillis;
  readonly incidentId: IncidentId;
  readonly key: DiscordActionRouteKey;
  readonly sessionId: SessionId;
}

export interface RegisterDiscordActionRouteInput {
  readonly actionId: ActionId;
  readonly createdAt: UnixMillis;
  readonly expiresAt?: UnixMillis;
  readonly incidentId: IncidentId;
  readonly sessionId: SessionId;
}

export class DiscordSessionRegistry {
  private actionRouteSequence = 0;
  private readonly actionRoutes = new Map<DiscordActionRouteKey, DiscordActionRoute>();
  private readonly byChannelId = new Map<string, SessionId>();
  private readonly bySessionId = new Map<SessionId, DiscordSessionBinding>();
  private readonly incidentMessageIds = new Map<SessionId, Map<IncidentId, string>>();

  public bindSession(binding: DiscordSessionBinding): void {
    this.bySessionId.set(binding.sessionId, binding);
    this.byChannelId.set(binding.channelId, binding.sessionId);
    this.byChannelId.set(binding.outputChannelId, binding.sessionId);

    if (binding.threadId !== undefined) {
      this.byChannelId.set(binding.threadId, binding.sessionId);
    }
  }

  public cleanup(sessionId: SessionId): void {
    const binding = this.bySessionId.get(sessionId);

    if (binding !== undefined) {
      this.byChannelId.delete(binding.channelId);
      this.byChannelId.delete(binding.outputChannelId);

      if (binding.threadId !== undefined) {
        this.byChannelId.delete(binding.threadId);
      }
    }

    this.bySessionId.delete(sessionId);
    this.incidentMessageIds.delete(sessionId);
    this.cleanupSessionActionRoutes(sessionId);
  }

  public getByChannel(channelId: string): DiscordSessionBinding | undefined {
    const sessionId = this.byChannelId.get(channelId);
    return sessionId === undefined ? undefined : this.bySessionId.get(sessionId);
  }

  public getBySession(sessionId: SessionId): DiscordSessionBinding | undefined {
    return this.bySessionId.get(sessionId);
  }

  public getIncidentMessageId(
    sessionId: SessionId,
    incidentId: IncidentId,
  ): string | undefined {
    return this.incidentMessageIds.get(sessionId)?.get(incidentId);
  }

  public getIncidentMessageEntries(
    sessionId: SessionId,
  ): readonly { readonly incidentId: IncidentId; readonly messageId: string }[] {
    const messages = this.incidentMessageIds.get(sessionId);

    if (messages === undefined) {
      return [];
    }

    return [...messages.entries()].map(([incidentId, messageId]) => ({
      incidentId,
      messageId,
    }));
  }

  public setIncidentMessageId(
    sessionId: SessionId,
    incidentId: IncidentId,
    messageId: string,
  ): void {
    const messages =
      this.incidentMessageIds.get(sessionId) ?? new Map<IncidentId, string>();
    messages.set(incidentId, messageId);
    this.incidentMessageIds.set(sessionId, messages);
  }

  public cleanupIncidentActionRoutes(
    sessionId: SessionId,
    incidentId: IncidentId,
  ): void {
    for (const [key, route] of this.actionRoutes.entries()) {
      if (route.sessionId === sessionId && route.incidentId === incidentId) {
        this.actionRoutes.delete(key);
      }
    }
  }

  public cleanupSessionActionRoutes(sessionId: SessionId): void {
    for (const [key, route] of this.actionRoutes.entries()) {
      if (route.sessionId === sessionId) {
        this.actionRoutes.delete(key);
      }
    }
  }

  public getActionRoute(
    key: DiscordActionRouteKey,
    now?: UnixMillis,
  ): DiscordActionRoute | undefined {
    const route = this.actionRoutes.get(key);

    if (route === undefined) {
      return undefined;
    }

    if (now !== undefined && route.expiresAt !== undefined && now > route.expiresAt) {
      this.actionRoutes.delete(key);
      return undefined;
    }

    return route;
  }

  public getActionRouteByAction(
    sessionId: SessionId,
    incidentId: IncidentId,
    actionId: ActionId,
  ): DiscordActionRoute | undefined {
    for (const route of this.actionRoutes.values()) {
      if (
        route.sessionId === sessionId &&
        route.incidentId === incidentId &&
        route.actionId === actionId
      ) {
        return route;
      }
    }

    return undefined;
  }

  public registerActionRoute(
    input: RegisterDiscordActionRouteInput,
  ): DiscordActionRoute {
    const key = this.nextActionRouteKey();
    const route: DiscordActionRoute = input.expiresAt === undefined
      ? {
          actionId: input.actionId,
          createdAt: input.createdAt,
          incidentId: input.incidentId,
          key,
          sessionId: input.sessionId,
        }
      : {
          actionId: input.actionId,
          createdAt: input.createdAt,
          expiresAt: input.expiresAt,
          incidentId: input.incidentId,
          key,
          sessionId: input.sessionId,
        };

    this.actionRoutes.set(key, route);
    return route;
  }

  public updateSession(
    sessionId: SessionId,
    update: Partial<Omit<DiscordSessionBinding, "sessionId">>,
  ): void {
    const binding = this.bySessionId.get(sessionId);

    if (binding === undefined) {
      return;
    }

    this.bindSession({
      ...binding,
      ...update,
      sessionId,
    });
  }

  private nextActionRouteKey(): DiscordActionRouteKey {
    this.actionRouteSequence += 1;
    return `a${this.actionRouteSequence.toString(36)}` as DiscordActionRouteKey;
  }
}
