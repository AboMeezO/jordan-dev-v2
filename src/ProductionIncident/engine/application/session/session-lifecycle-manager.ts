import type { PlayerId, RoleId, SessionId } from "../../domain/ids.js";
import type { GameSession } from "../../domain/index.js";
import type { EventBus } from "../../events/event-bus.js";
import type { GameEvent } from "../../events/game-event.js";
import type { Clock } from "../../ports/clock.js";
import type { IdGenerator } from "../../ports/id-generator.js";
import type { Scheduler } from "../../ports/scheduler.js";
import type {
  CreateSessionInput,
  EndSessionInput,
  EngineCommandResult,
  JoinSessionInput,
  SessionLifecycleError,
  SessionManager,
  StartSessionInput,
} from "../../ports/session-manager.js";
import type { StateManager } from "../../ports/state-manager.js";

const DEFAULT_FIRST_TICK_DELAY_MS = 1_000;
const DEFAULT_MINIMUM_PLAYERS = 1;
const ROLE_SEQUENCE = [
  "role-devops",
  "role-backend-engineer",
  "role-qa",
  "role-security-engineer",
  "role-intern",
] as const;

export interface SessionLifecycleManagerDependencies {
  readonly clock: Clock;
  readonly eventBus: EventBus;
  readonly idGenerator: IdGenerator;
  readonly scheduler: Scheduler;
  readonly stateManager: StateManager;
}

export class SessionLifecycleManager implements SessionManager {
  public constructor(
    private readonly dependencies: SessionLifecycleManagerDependencies,
  ) {}

  public async cancelSession(
    sessionId: SessionId,
  ): Promise<EngineCommandResult<GameSession>> {
    return this.endSession({
      reason: "cancelled",
      sessionId,
    });
  }

  public async createSession(
    input: CreateSessionInput,
  ): Promise<EngineCommandResult<GameSession>> {
    const sessionId = this.dependencies.idGenerator.createSessionId();
    const createdAt = this.dependencies.clock.now();
    const stateResult = await this.dependencies.stateManager.createSession(
      sessionId,
      input.initialPlayers ?? [],
      createdAt,
    );
    const event: GameEvent = {
      eventId: this.dependencies.idGenerator.createEventId(),
      initialStats: stateResult.value.stats,
      occurredAt: createdAt,
      sessionId,
      type: "session.created",
    };

    return this.publishSuccess(stateResult.value, [event]);
  }

  public async endSession(
    input: EndSessionInput,
  ): Promise<EngineCommandResult<GameSession>> {
    const existing = this.dependencies.stateManager.getSnapshot(input.sessionId);

    if (existing === undefined) {
      return this.failure("session-not-found", "Session does not exist.", input.sessionId);
    }

    if (existing.state.status === "ended") {
      return this.failure(
        "invalid-session-state",
        "Ended sessions cannot transition again.",
        input.sessionId,
      );
    }

    this.dependencies.scheduler.cancelBySession(input.sessionId);

    const endedAt = this.dependencies.clock.now();
    const stateResult = await this.dependencies.stateManager.endSession(
      input.sessionId,
      input.reason,
      endedAt,
    );
    const event: GameEvent = {
      endedAt,
      eventId: this.dependencies.idGenerator.createEventId(),
      occurredAt: endedAt,
      reason: input.reason,
      sessionId: input.sessionId,
      type: "session.ended",
    };

    return this.publishSuccess(stateResult.value, [event]);
  }

  public getSession(sessionId: SessionId): GameSession | undefined {
    return this.dependencies.stateManager.getSnapshot(sessionId);
  }

  public async joinSession(
    input: JoinSessionInput,
  ): Promise<EngineCommandResult<GameSession>> {
    const existing = this.dependencies.stateManager.getSnapshot(input.sessionId);

    if (existing === undefined) {
      return this.failure("session-not-found", "Session does not exist.", input.sessionId);
    }

    if (existing.state.status !== "waiting") {
      return this.failure(
        "invalid-session-state",
        "Players can only join sessions before they start.",
        input.sessionId,
      );
    }

    if (existing.state.players.has(input.player.id)) {
      return this.failure(
        "duplicate-player",
        "Player has already joined this session.",
        input.sessionId,
      );
    }

    const stateResult = await this.dependencies.stateManager.joinSession(
      input.sessionId,
      input.player,
    );
    const occurredAt = this.dependencies.clock.now();
    const event: GameEvent = {
      eventId: this.dependencies.idGenerator.createEventId(),
      occurredAt,
      playerId: input.player.id,
      sessionId: input.sessionId,
      type: "player.joined",
    };

    return this.publishSuccess(stateResult.value, [event]);
  }

  public async removePlayer(
    sessionId: SessionId,
    playerId: PlayerId,
  ): Promise<EngineCommandResult<GameSession>> {
    const existing = this.dependencies.stateManager.getSnapshot(sessionId);

    if (existing === undefined) {
      return this.failure("session-not-found", "Session does not exist.", sessionId);
    }

    if (existing.state.status === "ended") {
      return this.failure(
        "invalid-session-state",
        "Players cannot leave ended sessions.",
        sessionId,
      );
    }

    const stateResult = await this.dependencies.stateManager.removePlayer(
      sessionId,
      playerId,
    );
    const occurredAt = this.dependencies.clock.now();
    const event: GameEvent = {
      eventId: this.dependencies.idGenerator.createEventId(),
      occurredAt,
      playerId,
      sessionId,
      type: "player.left",
    };

    return this.publishSuccess(stateResult.value, [event]);
  }

  public async startSession(
    input: StartSessionInput,
  ): Promise<EngineCommandResult<GameSession>> {
    const existing = this.dependencies.stateManager.getSnapshot(input.sessionId);

    if (existing === undefined) {
      return this.failure("session-not-found", "Session does not exist.", input.sessionId);
    }

    if (existing.state.status !== "waiting" && existing.state.status !== "paused") {
      return this.failure(
        "invalid-session-state",
        "Only waiting or paused sessions can be started.",
        input.sessionId,
      );
    }

    const minimumPlayers = input.minimumPlayers ?? DEFAULT_MINIMUM_PLAYERS;

    if (existing.state.players.size < minimumPlayers) {
      return this.failure(
        "minimum-players-not-met",
        "Session cannot start until the minimum player count is reached.",
        input.sessionId,
      );
    }

    const assignments = this.assignRoles(existing);
    await this.dependencies.stateManager.assignRoles(input.sessionId, assignments);

    const startedAt = this.dependencies.clock.now();
    const stateResult = await this.dependencies.stateManager.startSession(
      input.sessionId,
      startedAt,
    );
    const rolesAssigned: GameEvent = {
      assignments,
      eventId: this.dependencies.idGenerator.createEventId(),
      occurredAt: startedAt,
      sessionId: input.sessionId,
      type: "roles.assigned",
    };
    const event: GameEvent = {
      eventId: this.dependencies.idGenerator.createEventId(),
      occurredAt: startedAt,
      sessionId: input.sessionId,
      startedAt,
      type: "session.started",
    };

    this.dependencies.scheduler.scheduleOnce(
      input.firstTickDelayMs ?? DEFAULT_FIRST_TICK_DELAY_MS,
      () => undefined,
      input.sessionId,
    );

    return this.publishSuccess(stateResult.value, [rolesAssigned, event]);
  }

  private failure(
    code: SessionLifecycleError["code"],
    message: string,
    sessionId?: SessionId,
  ): EngineCommandResult<GameSession> {
    const error: SessionLifecycleError =
      sessionId === undefined
        ? { code, message }
        : { code, message, sessionId };

    return {
      error,
      ok: false,
    };
  }

  private assignRoles(session: GameSession): ReadonlyMap<PlayerId, RoleId> {
    const assignments = new Map<PlayerId, RoleId>();
    const players = [...session.state.players.values()].sort((left, right) =>
      left.joinedAt === right.joinedAt
        ? left.id.localeCompare(right.id)
        : left.joinedAt - right.joinedAt,
    );

    players.forEach((player, index) => {
      assignments.set(
        player.id,
        ROLE_SEQUENCE[index % ROLE_SEQUENCE.length] as RoleId,
      );
    });

    return assignments;
  }

  private async publishSuccess(
    value: GameSession,
    events: readonly GameEvent[],
  ): Promise<EngineCommandResult<GameSession>> {
    await this.dependencies.eventBus.publishAll(events);

    return {
      ok: true,
      result: {
        events,
        value,
      },
    };
  }
}
