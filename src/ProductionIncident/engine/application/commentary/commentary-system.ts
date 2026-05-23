import type { EventBus, GameEvent } from "../../events/index.js";
import type { Clock, IdGenerator } from "../../ports/index.js";

export interface CommentarySystemDependencies {
  readonly clock: Clock;
  readonly eventBus: EventBus;
  readonly idGenerator: IdGenerator;
}

export class RuleBasedCommentarySystem {
  public constructor(private readonly dependencies: CommentarySystemDependencies) {
    this.dependencies.eventBus.subscribeAll((event) => {
      if (event.type === "commentary.cued") {
        return undefined;
      }

      const message = this.messageFor(event);

      if (message === undefined) {
        return undefined;
      }

      return this.dependencies.eventBus.publish({
        eventId: this.dependencies.idGenerator.createEventId(),
        message,
        occurredAt: this.dependencies.clock.now(),
        priority: this.priorityFor(event),
        sessionId: event.sessionId,
        sourceEventType: event.type,
        type: "commentary.cued",
      });
    });
  }

  private messageFor(event: GameEvent): string | undefined {
    switch (event.type) {
      case "incident.generated":
        return `Incident opened at ${event.severity} severity.`;
      case "incident.resolved":
        return event.succeeded
          ? "The response worked and production stabilized."
          : "The response failed and production pressure increased.";
      case "incident.failed":
        return "The failed response may cascade into follow-up work.";
      case "escalation.updated":
        return `Escalation increased to level ${event.currentLevel}.`;
      case "chainReaction.scheduled":
        return "A delayed consequence has been scheduled.";
      case "statistics.updated":
        return "Production metrics shifted after the response.";
      default:
        return undefined;
    }
  }

  private priorityFor(event: GameEvent): "high" | "low" | "normal" {
    switch (event.type) {
      case "incident.failed":
      case "escalation.updated":
        return "high";
      case "statistics.updated":
        return "low";
      default:
        return "normal";
    }
  }
}
