import { runSessionLifecycleSandbox } from "./engine/testing/session-lifecycle-sandbox.js";

const events = await runSessionLifecycleSandbox();

console.log(
	JSON.stringify(
		events.map((event) => ({
			sessionId: event.sessionId,
			type: event.type,
		})),
		null,
		2,
	),
);
