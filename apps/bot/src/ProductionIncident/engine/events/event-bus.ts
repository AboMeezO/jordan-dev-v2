import type {
	GameEvent,
	GameEventOfType,
	GameEventType,
} from "./game-event.js";

export type EventHandler<TEvent extends GameEvent> = (
	event: TEvent,
) => void | Promise<void>;

export type Unsubscribe = () => void;

export interface EventHandlerError {
	readonly error: unknown;
	readonly event: GameEvent;
}

export interface EventBus {
	getHandlerErrors(): readonly EventHandlerError[];
	publish(event: GameEvent): Promise<void>;
	publishAll(events: readonly GameEvent[]): Promise<void>;
	subscribe<TType extends GameEventType>(
		type: TType,
		handler: EventHandler<GameEventOfType<TType>>,
	): Unsubscribe;
	subscribeAll(
		handler: EventHandler<GameEvent>,
	): Unsubscribe;
}
