import {
  ACTION_CATALOG,
  INCIDENT_TEMPLATES,
  validateCatalogs,
} from "../data/index.js";
import type { EventBus } from "../events/event-bus.js";
import type {
  Clock,
  GameplayManager,
  IdGenerator,
  RandomSource,
  Scheduler,
  SessionManager,
  StateManager,
} from "../ports/index.js";
import { RuleBasedCommentarySystem } from "./commentary/index.js";
import { ProductionIncidentGameplayManager } from "./gameplay/index.js";
import { InMemoryStateManager, SessionLifecycleManager } from "./session/index.js";

export interface EngineKernelDependencies {
  readonly clock: Clock;
  readonly eventBus: EventBus;
  readonly gameplayManager?: GameplayManager;
  readonly idGenerator: IdGenerator;
  readonly randomSource: RandomSource;
  readonly scheduler: Scheduler;
  readonly sessionManager: SessionManager;
  readonly stateManager: StateManager;
}

export class EngineKernel {
  public constructor(
    private readonly dependencies: EngineKernelDependencies,
  ) {}

  public get clock(): Clock {
    return this.dependencies.clock;
  }

  public get eventBus(): EventBus {
    return this.dependencies.eventBus;
  }

  public get gameplayManager(): GameplayManager {
    if (this.dependencies.gameplayManager === undefined) {
      throw new Error("Gameplay manager is not configured.");
    }

    return this.dependencies.gameplayManager;
  }

  public get idGenerator(): IdGenerator {
    return this.dependencies.idGenerator;
  }

  public get randomSource(): RandomSource {
    return this.dependencies.randomSource;
  }

  public get scheduler(): Scheduler {
    return this.dependencies.scheduler;
  }

  public get sessionManager(): SessionManager {
    return this.dependencies.sessionManager;
  }

  public get stateManager(): StateManager {
    return this.dependencies.stateManager;
  }

  public static createLifecycleKernel(
    dependencies: Omit<
      EngineKernelDependencies,
      "sessionManager" | "stateManager"
    >,
  ): EngineKernel {
    validateCatalogs(INCIDENT_TEMPLATES, ACTION_CATALOG);

    const stateManager = new InMemoryStateManager();
    const sharedDependencies = {
      ...dependencies,
      stateManager,
    };
    const sessionManager = new SessionLifecycleManager(sharedDependencies);
    new RuleBasedCommentarySystem(sharedDependencies);
    const gameplayManager = new ProductionIncidentGameplayManager({
      ...sharedDependencies,
      actions: ACTION_CATALOG,
      templates: INCIDENT_TEMPLATES,
    });

    return new EngineKernel({
      ...dependencies,
      gameplayManager,
      sessionManager,
      stateManager,
    });
  }
}
