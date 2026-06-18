import type {
	EventBus,
	EventHandler,
	EventHandlerError,
	Unsubscribe,
} from "./event-bus.js";
import type {
	GameEvent,
	GameEventOfType,
	GameEventType,
} from "./game-event.js";

export class InMemoryEventBus implements EventBus {
	private readonly handlerErrors: EventHandlerError[] = [];

	private readonly handlersByType = new Map<
		GameEventType,
		Set<EventHandler<GameEvent>>
	>();

	private readonly globalHandlers = new Set<
		EventHandler<GameEvent>
	>();

	public async publish(event: GameEvent): Promise<void> {
		const typedHandlers =
			this.handlersByType.get(event.type) ?? new Set();
		const handlers = [
			...typedHandlers,
			...this.globalHandlers,
		];

		for (const handler of handlers) {
			try {
				await handler(event);
			} catch (error: unknown) {
				this.handlerErrors.push({ error, event });
			}
		}
	}

	public async publishAll(
		events: readonly GameEvent[],
	): Promise<void> {
		for (const event of events) {
			await this.publish(event);
		}
	}

	public subscribe<TType extends GameEventType>(
		type: TType,
		handler: EventHandler<GameEventOfType<TType>>,
	): Unsubscribe {
		const handlers =
			this.handlersByType.get(type) ?? new Set();
		const widenedHandler: EventHandler<GameEvent> = (
			event,
		) => {
			if (event.type === type) {
				return handler(event as GameEventOfType<TType>);
			}

			return undefined;
		};

		handlers.add(widenedHandler);
		this.handlersByType.set(type, handlers);

		return () => {
			handlers.delete(widenedHandler);
		};
	}

	public subscribeAll(
		handler: EventHandler<GameEvent>,
	): Unsubscribe {
		this.globalHandlers.add(handler);

		return () => {
			this.globalHandlers.delete(handler);
		};
	}

	public getHandlerErrors(): readonly EventHandlerError[] {
		return [...this.handlerErrors];
	}
}
