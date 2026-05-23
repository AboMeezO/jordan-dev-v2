import type {
  Action,
  ActionId,
  ActionRiskLevel,
  GameSession,
  Incident,
  IncidentSeverity,
  IncidentTemplate,
  Player,
  RoleId,
  SessionId,
  UnixMillis,
} from "../../domain/index.js";
import type { EventBus, GameEvent } from "../../events/index.js";
import type {
  Clock,
  CloseVoteInput,
  EngineCommandResult,
  GameplayManager,
  GameplayMutation,
  GenerateIncidentInput,
  IdGenerator,
  RandomSource,
  Scheduler,
  StateManager,
  SubmitVoteInput,
} from "../../ports/index.js";

const DEFAULT_VOTE_WINDOW_MS = 30_000;
const CHAIN_REACTION_DELAY_MS = 5_000;
const MAX_CHAIN_DEPTH = 3;

const RISK_RANK: Readonly<Record<ActionRiskLevel, number>> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const SEVERITY_RANK: Readonly<Record<IncidentSeverity, number>> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const SEVERITY_PENALTY: Readonly<Record<IncidentSeverity, number>> = {
  low: 0,
  medium: 0.08,
  high: 0.16,
  critical: 0.24,
};

export interface GameplayManagerDependencies {
  readonly actions: readonly Action[];
  readonly clock: Clock;
  readonly eventBus: EventBus;
  readonly idGenerator: IdGenerator;
  readonly randomSource: RandomSource;
  readonly scheduler: Scheduler;
  readonly stateManager: StateManager;
  readonly templates: readonly IncidentTemplate[];
}

export class ProductionIncidentGameplayManager implements GameplayManager {
  private readonly chainDepthBySessionId = new Map<SessionId, number>();
  private readonly escalationLevelBySessionId = new Map<SessionId, number>();

  public constructor(private readonly dependencies: GameplayManagerDependencies) {
    this.dependencies.eventBus.subscribe("session.started", (event) => {
      this.scheduleIncidentTick(event.sessionId, 2_000);
    });
    this.dependencies.eventBus.subscribe("session.ended", (event) => {
      this.dependencies.scheduler.cancelBySession(event.sessionId);
      this.chainDepthBySessionId.delete(event.sessionId);
      this.escalationLevelBySessionId.delete(event.sessionId);
    });
  }

  public async closeVote(
    input: CloseVoteInput,
  ): Promise<EngineCommandResult<GameplayMutation>> {
    const session = this.dependencies.stateManager.getSnapshot(input.sessionId);

    if (session === undefined) {
      return this.failure("session-not-found", "Session does not exist.", input.sessionId);
    }

    if (!isActiveSession(session)) {
      return this.failure(
        "invalid-session-state",
        "Votes can only close for active sessions.",
        input.sessionId,
      );
    }

    const incident = session.state.activeIncidents.get(input.incidentId);
    const voteWindow = session.state.voteWindows.get(input.incidentId);

    if (incident === undefined || voteWindow === undefined) {
      return this.failure(
        "invalid-session-state",
        "Incident or vote window does not exist.",
        input.sessionId,
      );
    }

    if (voteWindow.status === "closed") {
      return this.failure(
        "invalid-session-state",
        "Vote window is already closed.",
        input.sessionId,
      );
    }

    await this.dependencies.stateManager.closeVoteWindow(input.sessionId, input.incidentId);
    const selectedAction = this.selectWinningAction(incident, [...voteWindow.votesByPlayerId.values()]);
    const voteClosed = this.createVoteClosedEvent(input.sessionId, input.incidentId, selectedAction?.id);

    if (selectedAction === undefined) {
      await this.dependencies.eventBus.publish(voteClosed);
      return {
        ok: true,
        result: {
          events: [voteClosed],
          value: {
            events: [voteClosed],
            session: this.requireSession(input.sessionId),
          },
        },
      };
    }

    const resolved = await this.resolveIncident(input.sessionId, incident, selectedAction);
    const events = [voteClosed, ...resolved.events];
    await this.dependencies.eventBus.publishAll(events);

    return {
      ok: true,
      result: {
        events,
        value: {
          events,
          session: resolved.session,
        },
      },
    };
  }

  public async generateIncident(
    input: GenerateIncidentInput,
  ): Promise<EngineCommandResult<Incident>> {
    const session = this.dependencies.stateManager.getSnapshot(input.sessionId);

    if (session === undefined) {
      return this.failure("session-not-found", "Session does not exist.", input.sessionId);
    }

    if (!isActiveSession(session)) {
      return this.failure(
        "invalid-session-state",
        "Incidents can only be generated for active sessions.",
        input.sessionId,
      );
    }

    const template = this.selectTemplate(session);
    const createdAt = this.dependencies.clock.now();
    const escalationLevel = this.escalationLevelBySessionId.get(input.sessionId) ?? 0;
    const severity = this.selectSeverity(template, session, escalationLevel);
    const actionOptions = this.selectActions(template, severity);
    const votingClosesAt = (createdAt + DEFAULT_VOTE_WINDOW_MS) as UnixMillis;
    const incident: Incident = {
      actionOptions,
      affectedServices: [this.pick(template.affectedServices)],
      category: template.category,
      createdAt,
      description: this.pick(template.descriptions),
      id: this.dependencies.idGenerator.createIncidentId(),
      rootCause: this.pick(template.rootCauses),
      severity,
      status: "voting",
      templateId: template.id,
      title: this.pick(template.titles),
      votingClosesAt,
    };

    await this.dependencies.stateManager.addIncident(input.sessionId, incident);

    const event: GameEvent = {
      eventId: this.dependencies.idGenerator.createEventId(),
      incidentId: incident.id,
      occurredAt: createdAt,
      sessionId: input.sessionId,
      severity: incident.severity,
      type: "incident.generated",
    };
    const voteOpened: GameEvent = {
      actionIds: incident.actionOptions.map((action) => action.id),
      closesAt: votingClosesAt,
      eventId: this.dependencies.idGenerator.createEventId(),
      incidentId: incident.id,
      occurredAt: createdAt,
      sessionId: input.sessionId,
      type: "vote.opened",
    };

    this.dependencies.scheduler.scheduleOnce(
      DEFAULT_VOTE_WINDOW_MS,
      () => {
        void this.closeVote({
          incidentId: incident.id,
          sessionId: input.sessionId,
        });
      },
      input.sessionId,
    );

    await this.dependencies.eventBus.publishAll([event, voteOpened]);

    return {
      ok: true,
      result: {
        events: [event, voteOpened],
        value: incident,
      },
    };
  }

  public async submitVote(
    input: SubmitVoteInput,
  ): Promise<EngineCommandResult<GameSession>> {
    const session = this.dependencies.stateManager.getSnapshot(input.sessionId);

    if (session === undefined) {
      return this.failure("session-not-found", "Session does not exist.", input.sessionId);
    }

    if (!isActiveSession(session)) {
      return this.failure(
        "invalid-session-state",
        "Votes can only be submitted in active sessions.",
        input.sessionId,
      );
    }

    const incident = session.state.activeIncidents.get(input.incidentId);
    const voteWindow = session.state.voteWindows.get(input.incidentId);
    const player = session.state.players.get(input.playerId);

    if (incident === undefined || voteWindow === undefined) {
      return this.failure(
        "invalid-session-state",
        "Incident or vote window does not exist.",
        input.sessionId,
      );
    }

    if (voteWindow.status !== "open") {
      return this.failure(
        "invalid-session-state",
        "Vote window is closed.",
        input.sessionId,
      );
    }

    if (player === undefined) {
      return this.failure(
        "invalid-session-state",
        "Player is not in this session.",
        input.sessionId,
      );
    }

    const action = incident.actionOptions.find((option) => option.id === input.actionId);

    if (action === undefined) {
      return this.failure(
        "invalid-session-state",
        "Action is not available for this incident.",
        input.sessionId,
      );
    }

    const weight = this.voteWeightFor(player);
    const registeredAt = this.dependencies.clock.now();
    const stateResult = await this.dependencies.stateManager.upsertVote(input.sessionId, {
      actionId: action.id,
      incidentId: incident.id,
      playerId: player.id,
      registeredAt,
      weight,
    });
    const event: GameEvent = {
      actionId: action.id,
      eventId: this.dependencies.idGenerator.createEventId(),
      incidentId: incident.id,
      occurredAt: registeredAt,
      playerId: player.id,
      sessionId: input.sessionId,
      type: "vote.registered",
      weight,
    };

    await this.dependencies.eventBus.publish(event);

    return {
      ok: true,
      result: {
        events: [event],
        value: stateResult.value,
      },
    };
  }

  private async resolveIncident(
    sessionId: SessionId,
    incident: Incident,
    action: Action,
  ): Promise<GameplayMutation> {
    const before = this.requireSession(sessionId);
    const chance = this.successChance(action, incident);
    const succeeded = this.dependencies.randomSource.nextFloat() <= chance;
    const delta = succeeded ? action.success.immediate : action.failure.immediate;
    const afterStats = await this.dependencies.stateManager.applyStatDelta(sessionId, delta);
    const updatedIncident: Incident = {
      ...incident,
      selectedActionId: action.id,
      status: succeeded ? "resolved" : "failed",
    };
    const updatedSession = await this.dependencies.stateManager.replaceIncident(
      sessionId,
      updatedIncident,
    );
    const occurredAt = this.dependencies.clock.now();
    const statsEvent: GameEvent = {
      after: afterStats.value.stats,
      before: before.stats,
      delta,
      eventId: this.dependencies.idGenerator.createEventId(),
      occurredAt,
      sessionId,
      type: "statistics.updated",
    };
    const resolvedEvent: GameEvent = {
      actionId: action.id,
      appliedDelta: delta,
      eventId: this.dependencies.idGenerator.createEventId(),
      incidentId: incident.id,
      occurredAt,
      sessionId,
      succeeded,
      type: "incident.resolved",
    };
    const events: GameEvent[] = [statsEvent, resolvedEvent];

    if (!succeeded) {
      events.push({
        actionId: action.id,
        eventId: this.dependencies.idGenerator.createEventId(),
        incidentId: incident.id,
        occurredAt,
        sessionId,
        type: "incident.failed",
      });
      events.push(...this.escalateIfNeeded(sessionId, updatedSession.value));
      this.scheduleChainReaction(sessionId, incident.id, updatedSession.value, events);
    }

    return {
      events,
      session: updatedSession.value,
    };
  }

  private escalateIfNeeded(sessionId: SessionId, session: GameSession): readonly GameEvent[] {
    const currentLevel = this.escalationLevelBySessionId.get(sessionId) ?? 0;
    const pressure =
      (100 - session.stats.serverStability) +
      (100 - session.stats.userHappiness) +
      Math.max(0, 50 - session.stats.developerSanity) +
      session.stats.infrastructureCost / 2;
    const nextLevel = Math.min(5, Math.floor(pressure / 45));

    if (nextLevel <= currentLevel) {
      return [];
    }

    this.escalationLevelBySessionId.set(sessionId, nextLevel);
    return [
      {
        currentLevel: nextLevel,
        eventId: this.dependencies.idGenerator.createEventId(),
        occurredAt: this.dependencies.clock.now(),
        previousLevel: currentLevel,
        reason: "stat-threshold",
        sessionId,
        type: "escalation.updated",
      },
    ];
  }

  private scheduleChainReaction(
    sessionId: SessionId,
    sourceIncidentId: Incident["id"],
    session: GameSession,
    events: GameEvent[],
  ): void {
    const currentDepth = this.chainDepthBySessionId.get(sessionId) ?? 0;

    if (currentDepth >= MAX_CHAIN_DEPTH) {
      return;
    }

    const instability = (100 - session.stats.serverStability) / 100;
    const shouldChain = this.dependencies.randomSource.nextFloat() < 0.25 + instability * 0.5;

    if (!shouldChain) {
      return;
    }

    const nextDepth = currentDepth + 1;
    this.chainDepthBySessionId.set(sessionId, nextDepth);
    this.dependencies.scheduler.scheduleOnce(
      CHAIN_REACTION_DELAY_MS,
      () => {
        void this.generateIncident({ sessionId });
      },
      sessionId,
    );
    events.push({
      delayMs: CHAIN_REACTION_DELAY_MS,
      depth: nextDepth,
      eventId: this.dependencies.idGenerator.createEventId(),
      occurredAt: this.dependencies.clock.now(),
      sessionId,
      sourceIncidentId,
      type: "chainReaction.scheduled",
    });
  }

  private scheduleIncidentTick(sessionId: SessionId, delayMs: number): void {
    this.dependencies.scheduler.scheduleOnce(
      delayMs,
      () => {
        void this.generateIncident({ sessionId });
        const level = this.escalationLevelBySessionId.get(sessionId) ?? 0;
        this.scheduleIncidentTick(sessionId, Math.max(8_000, 25_000 - level * 3_000));
      },
      sessionId,
    );
  }

  private selectTemplate(session: GameSession): IncidentTemplate {
    const activeTemplateIds = isActiveSession(session)
      ? new Set([...session.state.activeIncidents.values()].map((incident) => incident.templateId))
      : new Set<IncidentTemplate["id"]>();
    const eligible = this.dependencies.templates.filter(
      (template) => !activeTemplateIds.has(template.id),
    );
    const candidates = eligible.length > 0 ? eligible : this.dependencies.templates;
    const totalWeight = candidates.reduce((sum, template) => sum + template.weight, 0);
    let roll = this.dependencies.randomSource.nextFloat() * totalWeight;

    for (const template of candidates) {
      roll -= template.weight;

      if (roll <= 0) {
        return template;
      }
    }

    const fallback = candidates.at(-1);

    if (fallback === undefined) {
      throw new Error("Incident template catalog cannot be empty.");
    }

    return fallback;
  }

  private selectSeverity(
    template: IncidentTemplate,
    session: GameSession,
    escalationLevel: number,
  ): IncidentSeverity {
    const pressure =
      escalationLevel +
      (session.stats.serverStability < 50 ? 1 : 0) +
      (session.stats.userHappiness < 50 ? 1 : 0);
    const sorted = [...template.severityRange].sort(
      (left, right) => SEVERITY_RANK[left] - SEVERITY_RANK[right],
    );
    const index = Math.min(sorted.length - 1, Math.floor(pressure / 2));
    const severity = sorted[index];

    if (severity === undefined) {
      throw new Error("Incident template must include at least one severity.");
    }

    return severity;
  }

  private selectActions(template: IncidentTemplate, severity: IncidentSeverity): readonly Action[] {
    const matching = this.dependencies.actions.filter((action) =>
      action.tags.some((tag) => template.actionTags.includes(tag)),
    );
    const sorted = matching.sort((left, right) => {
      const riskDelta = RISK_RANK[left.risk] - RISK_RANK[right.risk];
      return riskDelta === 0 ? left.label.localeCompare(right.label) : riskDelta;
    });
    const count = severity === "critical" ? 4 : 3;

    return sorted.slice(0, count);
  }

  private selectWinningAction(
    incident: Incident,
    votes: readonly { readonly actionId: ActionId; readonly weight: number }[],
  ): Action | undefined {
    if (votes.length === 0) {
      return incident.actionOptions.find((action) => action.tags.includes("ignore"));
    }

    const scoreByActionId = new Map<ActionId, number>();

    for (const vote of votes) {
      scoreByActionId.set(
        vote.actionId,
        (scoreByActionId.get(vote.actionId) ?? 0) + vote.weight,
      );
    }

    const highestScore = Math.max(...scoreByActionId.values());
    const tied = incident.actionOptions.filter(
      (action) => scoreByActionId.get(action.id) === highestScore,
    );
    const lowestRisk = Math.min(...tied.map((action) => RISK_RANK[action.risk]));
    const safestTied = tied.filter((action) => RISK_RANK[action.risk] === lowestRisk);

    return safestTied[
      this.dependencies.randomSource.nextInteger(0, safestTied.length - 1)
    ];
  }

  private successChance(action: Action, incident: Incident): number {
    const chance = action.successRate - SEVERITY_PENALTY[incident.severity];
    return Math.min(0.95, Math.max(0.05, chance));
  }

  private voteWeightFor(player: Player): number {
    const roleWeights: Readonly<Record<string, number>> = {
      "role-backend-engineer": 1.2,
      "role-devops": 1.35,
      "role-intern": 0.8,
      "role-qa": 1.1,
      "role-security-engineer": 1.3,
    };
    const roleId: RoleId | undefined = player.roleId;

    return roleId === undefined ? 1 : (roleWeights[roleId] ?? 1);
  }

  private pick<TValue>(values: readonly TValue[]): TValue {
    const value = values[this.dependencies.randomSource.nextInteger(0, values.length - 1)];

    if (value === undefined) {
      throw new Error("Cannot pick from an empty catalog.");
    }

    return value;
  }

  private createVoteClosedEvent(
    sessionId: SessionId,
    incidentId: Incident["id"],
    selectedActionId: ActionId | undefined,
  ): GameEvent {
    const base = {
      eventId: this.dependencies.idGenerator.createEventId(),
      incidentId,
      occurredAt: this.dependencies.clock.now(),
      sessionId,
      type: "vote.closed" as const,
    };

    return selectedActionId === undefined ? base : { ...base, selectedActionId };
  }

  private requireSession(sessionId: SessionId): GameSession {
    const session = this.dependencies.stateManager.getSnapshot(sessionId);

    if (session === undefined) {
      throw new Error("Session disappeared during gameplay command.");
    }

    return session;
  }

  private failure<TValue>(
    code: "duplicate-player" | "invalid-session-state" | "minimum-players-not-met" | "session-not-found",
    message: string,
    sessionId?: SessionId,
  ): EngineCommandResult<TValue> {
    return {
      error:
        sessionId === undefined
          ? { code, message }
          : { code, message, sessionId },
      ok: false,
    };
  }
}

function isActiveSession(
  session: GameSession,
): session is GameSession & {
  readonly state: Extract<
    GameSession["state"],
    { readonly status: "paused" | "recovering" | "running" }
  >;
} {
  return (
    session.state.status === "running" ||
    session.state.status === "paused" ||
    session.state.status === "recovering"
  );
}
