import type { IncidentId, SessionId } from "../../engine/index.js";

export interface DiscordSessionBinding {
  readonly channelId: string;
  readonly guildId: string;
  readonly hostUserId: string;
  readonly lobbyMessageId?: string;
  readonly outputChannelId: string;
  readonly sessionId: SessionId;
  readonly threadId?: string;
}

export class DiscordSessionRegistry {
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
}
