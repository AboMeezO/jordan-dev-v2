import type {
  Action,
  ActionId,
  GameSession,
  Incident,
  IncidentSeverity,
  IncidentTemplate,
  SessionId,
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
  UseInstantActionInput,
} from "../../ports/index.js";
import {
  ActionGenerationSystem,
  ChainReactionSystem,
  EscalationDirector,
  IncidentEngine,
  VotingSystem,
} from "./systems/index.js";

const DEFAULT_VOTE_WINDOW_MS = 30_000;
const MAX_INCIDENTS_PER_SESSION = 10;
const MAX_SESSION_DURATION_MS = 10 * 60 * 1_000;

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
  private readonly actionGenerationSystem: ActionGenerationSystem;
  private readonly chainReactionSystem: ChainReactionSystem;
  private readonly escalationDirector: EscalationDirector;
  private readonly incidentEngine: IncidentEngine;
  private readonly voteTimerByIncidentId = new Map<Incident["id"], ReturnType<Scheduler["scheduleOnce"]>>();
  private readonly votingSystem: VotingSystem;

  public constructor(private readonly dependencies: GameplayManagerDependencies) {
    this.actionGenerationSystem = new ActionGenerationSystem(dependencies.actions);
    this.escalationDirector = new EscalationDirector(
      dependencies.clock,
      dependencies.idGenerator,
    );
    this.incidentEngine = new IncidentEngine(
      dependencies.templates,
      dependencies.randomSource,
      dependencies.idGenerator,
    );
    this.votingSystem = new VotingSystem(dependencies.randomSource);
    this.chainReactionSystem = new ChainReactionSystem(
      dependencies.clock,
      dependencies.idGenerator,
      dependencies.randomSource,
      dependencies.scheduler,
      async (sessionId) => {
        await this.generateIncident({ sessionId });
      },
      (sessionId) => this.isSessionActive(sessionId),
    );

    this.dependencies.eventBus.subscribe("session.started", (event) => {
      this.dependencies.scheduler.scheduleOnce(
        MAX_SESSION_DURATION_MS,
        () => this.endActiveSession(event.sessionId, "timed-out").then(() => undefined),
        event.sessionId,
      );
      this.scheduleIncidentTick(event.sessionId, 2_000);
    });
    this.dependencies.eventBus.subscribe("session.ended", (event) => {
      this.dependencies.scheduler.cancelBySession(event.sessionId);
      this.clearVoteTimersForSession(event.sessionId);
      this.chainReactionSystem.clear(event.sessionId);
      this.escalationDirector.clear(event.sessionId);
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

    this.cancelVoteTimer(input.incidentId);
    await this.dependencies.stateManager.closeVoteWindow(input.sessionId, input.incidentId);
    const selectedAction = this.votingSystem.selectWinningAction(
      incident,
      [...voteWindow.votesByPlayerId.values()],
    );
    const voteClosed = this.createVoteClosedEvent(input.sessionId, input.incidentId, selectedAction?.id);

    if (selectedAction === undefined) {
      const expiredIncident: Incident = {
        ...incident,
        status: "expired",
      };
      const expired = await this.dependencies.stateManager.replaceIncident(
        input.sessionId,
        expiredIncident,
      );
      await this.dependencies.eventBus.publish(voteClosed);
      await this.endSessionIfNeeded(input.sessionId, expired.value);
      return {
        ok: true,
        result: {
          events: [voteClosed],
          value: {
            events: [voteClosed],
            session: expired.value,
          },
        },
      };
    }

    const resolved = await this.resolveIncident(input.sessionId, incident, selectedAction);
    const events = [voteClosed, ...resolved.events];
    await this.dependencies.eventBus.publishAll(events);
    await this.endSessionIfNeeded(input.sessionId, resolved.session);

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

    if (session.state.activeIncidents.size > 0) {
      return this.failure(
        "invalid-session-state",
        "An incident is already active for this session.",
        input.sessionId,
      );
    }

    if (session.state.incidentHistory.size >= MAX_INCIDENTS_PER_SESSION) {
      await this.endActiveSession(input.sessionId, "survived");
      return this.failure(
        "invalid-session-state",
        "Session already reached the incident limit.",
        input.sessionId,
      );
    }

    const createdAt = this.dependencies.clock.now();
    const template = this.incidentEngine.selectTemplate(session);
    const escalationLevel = this.escalationDirector.getLevel(input.sessionId);
    const severity = this.incidentEngine.selectSeverity(
      template,
      session,
      escalationLevel,
    );
    const actionOptions = this.actionGenerationSystem.selectActions(template, severity);
    const instantActionOptions = this.actionGenerationSystem.selectInstantActions(template);
    const incident = this.incidentEngine.createIncident(
      template,
      createdAt,
      severity,
      actionOptions,
      instantActionOptions,
      DEFAULT_VOTE_WINDOW_MS,
    );
    const votingClosesAt = incident.votingClosesAt;

    if (votingClosesAt === undefined) {
      throw new Error("Generated incident is missing a voting close timestamp.");
    }

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

    const voteTimer = this.dependencies.scheduler.scheduleOnce(
      DEFAULT_VOTE_WINDOW_MS,
      () => {
        return this.closeVote({
          incidentId: incident.id,
          sessionId: input.sessionId,
        }).then(() => undefined);
      },
      input.sessionId,
    );
    this.voteTimerByIncidentId.set(incident.id, voteTimer);

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

    const weight = this.votingSystem.voteWeightFor(player);
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

  public useInstantAction(
    input: UseInstantActionInput,
  ): Promise<EngineCommandResult<{ readonly message: string }>> {
    const session = this.dependencies.stateManager.getSnapshot(input.sessionId);

    if (session === undefined) {
      return Promise.resolve(this.failure("session-not-found", "Session does not exist.", input.sessionId));
    }

    if (!isActiveSession(session)) {
      return Promise.resolve(this.failure(
        "invalid-session-state",
        "Instant actions can only be used in active sessions.",
        input.sessionId,
      ));
    }

    const incident = session.state.activeIncidents.get(input.incidentId);
    const player = session.state.players.get(input.playerId);

    if (incident === undefined) {
      return Promise.resolve(this.failure(
        "invalid-session-state",
        "Incident does not exist.",
        input.sessionId,
      ));
    }

    if (player === undefined) {
      return Promise.resolve(this.failure(
        "invalid-session-state",
        "Player is not in this session.",
        input.sessionId,
      ));
    }

    const action = incident.instantActionOptions.find((option) => option.id === input.actionId);

    if (action === undefined) {
      return Promise.resolve(this.failure(
        "invalid-session-state",
        "Instant action is not available for this incident.",
        input.sessionId,
      ));
    }

    return Promise.resolve({
      ok: true,
      result: {
        events: [],
        value: {
          message: this.instantActionMessage(action, incident),
        },
      },
    });
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
      events.push(...this.escalationDirector.escalateIfNeeded(sessionId, updatedSession.value));
      const chainEvent = this.chainReactionSystem.maybeSchedule(
        sessionId,
        incident.id,
        updatedSession.value,
      );

      if (chainEvent !== undefined) {
        events.push(chainEvent);
      }
    }

    return {
      events,
      session: updatedSession.value,
    };
  }

  private instantActionMessage(action: Action, incident: Incident): string {
    if (action.tags.includes("metrics")) {
      return `Metrics point at ${incident.affectedServices.join(", ")}. The likely pressure source is ${incident.rootCause}.`;
    }

    if (action.tags.includes("trace")) {
      return `Trace sampled ${incident.affectedServices.join(", ")} and found ${incident.rootCause} on the failing path.`;
    }

    return `Logs mention ${incident.rootCause} near ${incident.affectedServices.join(", ")}.`;
  }

  private scheduleIncidentTick(sessionId: SessionId, delayMs: number): void {
    if (!this.isSessionActive(sessionId)) {
      return;
    }

    this.dependencies.scheduler.scheduleOnce(
      delayMs,
      () => {
        if (!this.isSessionActive(sessionId)) {
          return undefined;
        }

        return this.generateIncident({ sessionId })
          .catch(() => undefined)
          .finally(() => {
            if (this.isSessionActive(sessionId)) {
              this.scheduleIncidentTick(
                sessionId,
                this.escalationDirector.nextIncidentDelayMs(sessionId),
              );
            }
          })
          .then(() => undefined);
      },
      sessionId,
    );
  }

  private async endSessionIfNeeded(sessionId: SessionId, session: GameSession): Promise<void> {
    if (!isActiveSession(session)) {
      return;
    }

    if (
      session.stats.serverStability <= 0 ||
      session.stats.developerSanity <= 0 ||
      session.stats.userHappiness <= 0
    ) {
      await this.endActiveSession(sessionId, "failed");
      return;
    }

    if (session.state.incidentHistory.size >= MAX_INCIDENTS_PER_SESSION) {
      await this.endActiveSession(sessionId, "survived");
    }
  }

  private async endActiveSession(
    sessionId: SessionId,
    reason: "failed" | "survived" | "timed-out",
  ): Promise<void> {
    const session = this.dependencies.stateManager.getSnapshot(sessionId);

    if (session === undefined || session.state.status === "ended") {
      return;
    }

    this.dependencies.scheduler.cancelBySession(sessionId);
    this.clearVoteTimersForSession(sessionId);

    const endedAt = this.dependencies.clock.now();
    await this.dependencies.stateManager.endSession(sessionId, reason, endedAt);
    await this.dependencies.eventBus.publish({
      endedAt,
      eventId: this.dependencies.idGenerator.createEventId(),
      occurredAt: endedAt,
      reason,
      sessionId,
      type: "session.ended",
    });
  }

  private successChance(action: Action, incident: Incident): number {
    const chance = action.successRate - SEVERITY_PENALTY[incident.severity];
    return Math.min(0.95, Math.max(0.05, chance));
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

  private cancelVoteTimer(incidentId: Incident["id"]): void {
    const timer = this.voteTimerByIncidentId.get(incidentId);

    if (timer === undefined) {
      return;
    }

    this.dependencies.scheduler.cancel(timer.id);
    this.voteTimerByIncidentId.delete(incidentId);
  }

  private clearVoteTimersForSession(sessionId: SessionId): void {
    for (const [incidentId, timer] of this.voteTimerByIncidentId) {
      if (timer.sessionId === sessionId) {
        this.voteTimerByIncidentId.delete(incidentId);
      }
    }
  }

  private isSessionActive(sessionId: SessionId): boolean {
    const session = this.dependencies.stateManager.getSnapshot(sessionId);
    return session !== undefined && isActiveSession(session);
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
