import type { IncidentId, PlayerId, SessionId, UnixMillis } from "../../domain/ids.js";
import type { Incident } from "../../domain/incident.js";
import type {
  Action,
  ActionEffect,
  GameSession,
  Player,
  SessionEndReason,
  StatDelta,
  Vote,
  VoteWindow,
} from "../../domain/index.js";
import type {
  StateManager,
  StateMutationResult,
} from "../../ports/state-manager.js";

const DEFAULT_GLOBAL_STATS = {
  developerSanity: 100,
  infrastructureCost: 0,
  serverStability: 100,
  userHappiness: 100,
} as const;

export class InMemoryStateManager implements StateManager {
  private readonly sessions = new Map<SessionId, GameSession>();

  public addIncident(
    sessionId: SessionId,
    incident: Incident,
  ): Promise<StateMutationResult<GameSession>> {
    const session = this.requireSession(sessionId);

    if (
      session.state.status !== "running" &&
      session.state.status !== "paused" &&
      session.state.status !== "recovering"
    ) {
      throw new Error("Cannot add an incident outside an active session state.");
    }

    const activeIncidents = new Map(session.state.activeIncidents);
    const voteWindows = new Map(session.state.voteWindows);
    activeIncidents.set(incident.id, incident);

    if (incident.votingClosesAt !== undefined) {
      voteWindows.set(incident.id, {
        closesAt: incident.votingClosesAt,
        incidentId: incident.id,
        openedAt: incident.createdAt,
        status: "open",
        votesByPlayerId: new Map(),
      });
    }

    const updated: GameSession = {
      ...session,
      state: {
        ...session.state,
        activeIncidents,
        voteWindows,
      },
    };

    this.sessions.set(sessionId, updated);
    return Promise.resolve(this.withoutEvents(updated));
  }

  public applyStatDelta(
    sessionId: SessionId,
    delta: StatDelta,
  ): Promise<StateMutationResult<GameSession>> {
    const session = this.requireSession(sessionId);

    if (session.state.status === "ended") {
      throw new Error("Cannot update stats after a session has ended.");
    }

    const updated: GameSession = {
      ...session,
      stats: {
        developerSanity: this.clampStat(
          session.stats.developerSanity + (delta.developerSanity ?? 0),
        ),
        infrastructureCost: Math.max(
          0,
          session.stats.infrastructureCost + (delta.infrastructureCost ?? 0),
        ),
        serverStability: this.clampStat(
          session.stats.serverStability + (delta.serverStability ?? 0),
        ),
        userHappiness: this.clampStat(
          session.stats.userHappiness + (delta.userHappiness ?? 0),
        ),
      },
    };

    this.sessions.set(sessionId, updated);
    return Promise.resolve(this.withoutEvents(updated));
  }

  public createSession(
    sessionId: SessionId,
    players: readonly Player[],
    createdAt: UnixMillis,
  ): Promise<StateMutationResult<GameSession>> {
    if (this.sessions.has(sessionId)) {
      throw new Error("Session already exists.");
    }

    const playersById = new Map<PlayerId, Player>();

    for (const player of players) {
      playersById.set(player.id, player);
    }

    const session: GameSession = {
      id: sessionId,
      state: {
        createdAt,
        players: playersById,
        status: "waiting",
      },
      stats: DEFAULT_GLOBAL_STATS,
    };

    this.sessions.set(sessionId, session);
    return Promise.resolve(this.withoutEvents(session));
  }

  public closeVoteWindow(
    sessionId: SessionId,
    incidentId: IncidentId,
  ): Promise<StateMutationResult<GameSession>> {
    const session = this.requireActiveSession(sessionId);
    const voteWindow = session.state.voteWindows.get(incidentId);

    if (voteWindow === undefined) {
      throw new Error("Vote window not found.");
    }

    const voteWindows = new Map(session.state.voteWindows);
    voteWindows.delete(incidentId);

    const updated: GameSession = {
      ...session,
      state: {
        ...session.state,
        voteWindows,
      },
    };

    this.sessions.set(sessionId, updated);
    return Promise.resolve(this.withoutEvents(updated));
  }

  public endSession(
    sessionId: SessionId,
    reason: SessionEndReason,
    endedAt: UnixMillis,
  ): Promise<StateMutationResult<GameSession>> {
    const session = this.requireSession(sessionId);

    if (session.state.status === "ended") {
      return Promise.resolve(this.withoutEvents(session));
    }

    const endedSession: GameSession = {
      ...session,
      state: {
        endedAt,
        endReason: reason,
        players: new Map(session.state.players),
        status: "ended",
      },
    };

    this.sessions.set(sessionId, endedSession);
    return Promise.resolve(this.withoutEvents(endedSession));
  }

  public getSnapshot(sessionId: SessionId): GameSession | undefined {
    const session = this.sessions.get(sessionId);

    if (session === undefined) {
      return undefined;
    }

    return this.cloneSession(session);
  }

  public joinSession(
    sessionId: SessionId,
    player: Player,
  ): Promise<StateMutationResult<GameSession>> {
    const session = this.requireSession(sessionId);

    if (session.state.status !== "waiting") {
      throw new Error("Players can only join waiting sessions.");
    }

    const players = new Map(session.state.players);
    players.set(player.id, player);

    const updated: GameSession = {
      ...session,
      state: {
        ...session.state,
        players,
      },
    };

    this.sessions.set(sessionId, updated);
    return Promise.resolve(this.withoutEvents(updated));
  }

  public removeIncident(
    sessionId: SessionId,
    incidentId: IncidentId,
  ): Promise<StateMutationResult<GameSession>> {
    const session = this.requireSession(sessionId);

    if (
      session.state.status !== "running" &&
      session.state.status !== "paused" &&
      session.state.status !== "recovering"
    ) {
      throw new Error("Cannot remove an incident outside an active session state.");
    }

    const activeIncidents = new Map(session.state.activeIncidents);
    const incident = activeIncidents.get(incidentId);
    const incidentHistory = new Map(session.state.incidentHistory);

    if (incident !== undefined) {
      incidentHistory.set(incidentId, incident);
    }

    activeIncidents.delete(incidentId);

    const voteWindows = new Map(session.state.voteWindows);
    voteWindows.delete(incidentId);

    const updated: GameSession = {
      ...session,
      state: {
        ...session.state,
        activeIncidents,
        incidentHistory,
        voteWindows,
      },
    };

    this.sessions.set(sessionId, updated);
    return Promise.resolve(this.withoutEvents(updated));
  }

  public removePlayer(
    sessionId: SessionId,
    playerId: PlayerId,
  ): Promise<StateMutationResult<GameSession>> {
    const session = this.requireSession(sessionId);

    if (session.state.status === "ended") {
      throw new Error("Cannot remove players from ended sessions.");
    }

    const players = new Map(session.state.players);
    players.delete(playerId);

    const updated: GameSession = {
      ...session,
      state: {
        ...session.state,
        players,
      },
    };

    this.sessions.set(sessionId, updated);
    return Promise.resolve(this.withoutEvents(updated));
  }

  public replaceIncident(
    sessionId: SessionId,
    incident: Incident,
  ): Promise<StateMutationResult<GameSession>> {
    const session = this.requireActiveSession(sessionId);

    if (!session.state.activeIncidents.has(incident.id)) {
      throw new Error("Incident not found.");
    }

    const activeIncidents = new Map(session.state.activeIncidents);
    const incidentHistory = new Map(session.state.incidentHistory);
    const voteWindows = new Map(session.state.voteWindows);

    if (isTerminalIncidentStatus(incident.status)) {
      activeIncidents.delete(incident.id);
      incidentHistory.set(incident.id, incident);
      voteWindows.delete(incident.id);
    } else {
      activeIncidents.set(incident.id, incident);
    }

    const updated: GameSession = {
      ...session,
      state: {
        ...session.state,
        activeIncidents,
        incidentHistory,
        voteWindows,
      },
    };

    this.sessions.set(sessionId, updated);
    return Promise.resolve(this.withoutEvents(updated));
  }

  public upsertVote(
    sessionId: SessionId,
    vote: Vote,
  ): Promise<StateMutationResult<GameSession>> {
    const session = this.requireActiveSession(sessionId);
    const voteWindow = session.state.voteWindows.get(vote.incidentId);

    if (voteWindow === undefined) {
      throw new Error("Vote window not found.");
    }

    if (voteWindow.status !== "open") {
      throw new Error("Vote window is closed.");
    }

    const votesByPlayerId = new Map(voteWindow.votesByPlayerId);
    votesByPlayerId.set(vote.playerId, vote);

    const voteWindows = new Map(session.state.voteWindows);
    voteWindows.set(vote.incidentId, {
      ...voteWindow,
      votesByPlayerId,
    });

    const updated: GameSession = {
      ...session,
      state: {
        ...session.state,
        voteWindows,
      },
    };

    this.sessions.set(sessionId, updated);
    return Promise.resolve(this.withoutEvents(updated));
  }

  public startSession(
    sessionId: SessionId,
    startedAt: UnixMillis,
  ): Promise<StateMutationResult<GameSession>> {
    const session = this.requireSession(sessionId);

    if (session.state.status !== "waiting" && session.state.status !== "paused") {
      throw new Error("Only waiting or paused sessions can be started.");
    }

    const updated: GameSession = {
      ...session,
      state: {
        activeIncidents: new Map(),
        incidentHistory: new Map(),
        players: new Map(session.state.players),
        startedAt,
        status: "running",
        voteWindows: new Map(),
      },
    };

    this.sessions.set(sessionId, updated);
    return Promise.resolve(this.withoutEvents(updated));
  }

  private cloneSession(session: GameSession): GameSession {
    switch (session.state.status) {
      case "ended":
        return {
          ...session,
          state: {
            ...session.state,
            players: new Map(session.state.players),
          },
        };
      case "paused":
      case "recovering":
      case "running":
        return {
          ...session,
          state: {
            ...session.state,
            activeIncidents: cloneIncidentMap(session.state.activeIncidents),
            incidentHistory: cloneIncidentMap(session.state.incidentHistory),
            players: clonePlayerMap(session.state.players),
            voteWindows: cloneVoteWindowMap(session.state.voteWindows),
          },
        };
      case "waiting":
        return {
          ...session,
          state: {
            ...session.state,
            players: clonePlayerMap(session.state.players),
          },
        };
    }
  }

  private clampStat(value: number): number {
    return Math.min(100, Math.max(0, value));
  }

  private requireSession(sessionId: SessionId): GameSession {
    const session = this.sessions.get(sessionId);

    if (session === undefined) {
      throw new Error("Session not found.");
    }

    return session;
  }

  private requireActiveSession(
    sessionId: SessionId,
  ): GameSession & {
    readonly state: Extract<
      GameSession["state"],
      { readonly status: "paused" | "recovering" | "running" }
    >;
  } {
    const session = this.requireSession(sessionId);

    if (
      session.state.status !== "running" &&
      session.state.status !== "paused" &&
      session.state.status !== "recovering"
    ) {
      throw new Error("Session is not active.");
    }

    return session as GameSession & {
      readonly state: Extract<
        GameSession["state"],
        { readonly status: "paused" | "recovering" | "running" }
      >;
    };
  }

  private withoutEvents(session: GameSession): StateMutationResult<GameSession> {
    return {
      events: [],
      value: this.cloneSession(session),
    };
  }
}

function isTerminalIncidentStatus(status: Incident["status"]): boolean {
  return status === "expired" || status === "failed" || status === "resolved";
}

function cloneAction(action: Action): Action {
  const cloned: Action = {
    ...action,
    failure: cloneActionEffect(action.failure),
    success: cloneActionEffect(action.success),
    tags: [...action.tags],
  };

  return action.allowedRoleIds === undefined
    ? cloned
    : {
        ...cloned,
        allowedRoleIds: [...action.allowedRoleIds],
      };
}

function cloneActionEffect(effect: ActionEffect): ActionEffect {
  const cloned: ActionEffect = {
    immediate: { ...effect.immediate },
  };

  return effect.delayedEffects === undefined
    ? cloned
    : {
        ...cloned,
        delayedEffects: effect.delayedEffects.map((delta) => ({ ...delta })),
      };
}

function cloneIncident(incident: Incident): Incident {
  const base = {
    ...incident,
    actionOptions: incident.actionOptions.map(cloneAction),
    affectedServices: [...incident.affectedServices],
  };

  return incident.selectedActionId === undefined
    ? base
    : {
        ...base,
        selectedActionId: incident.selectedActionId,
      };
}

function cloneIncidentMap(
  incidents: ReadonlyMap<IncidentId, Incident>,
): ReadonlyMap<IncidentId, Incident> {
  return new Map([...incidents].map(([id, incident]) => [id, cloneIncident(incident)]));
}

function clonePlayerMap(
  players: ReadonlyMap<PlayerId, Player>,
): ReadonlyMap<PlayerId, Player> {
  return new Map([...players].map(([id, player]) => [id, { ...player }]));
}

function cloneVote(vote: Vote): Vote {
  return { ...vote };
}

function cloneVoteWindowMap(
  voteWindows: ReadonlyMap<IncidentId, VoteWindow>,
): ReadonlyMap<IncidentId, VoteWindow> {
  return new Map(
    [...voteWindows].map(([id, voteWindow]) => [
      id,
      {
        ...voteWindow,
        votesByPlayerId: new Map(
          [...voteWindow.votesByPlayerId].map(([playerId, vote]) => [
            playerId,
            cloneVote(vote),
          ]),
        ),
      },
    ]),
  );
}
