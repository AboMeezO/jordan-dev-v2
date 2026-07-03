import {
	createOpencode as createOpencodeProvider,
	opencode as defaultOpencodeInstance,
} from "ai-sdk-provider-opencode-sdk";

export { OpencodeModels } from "ai-sdk-provider-opencode-sdk";
export type {
	OpencodeSettings,
	OpencodeProvider,
} from "ai-sdk-provider-opencode-sdk";

type OpencodeConfig = {
	autoStartServer?: boolean;
	serverTimeout?: number;
	defaultAgent?: string;
};

let instance: ReturnType<typeof createOpencodeProvider> | null = null;

export function getOpencode(config?: OpencodeConfig) {
	if (!instance) {
		instance = createOpencodeProvider({
			autoStartServer: config?.autoStartServer ?? true,
			serverTimeout: config?.serverTimeout ?? 10_000,
			...(config?.defaultAgent && { defaultSettings: { agent: config.defaultAgent } }),
		});
	}
	return instance;
}

export function getDefaultOpencode() {
	return defaultOpencodeInstance;
}

export async function disposeOpencode() {
	if (instance) {
		await instance.dispose().catch(() => {});
		instance = null;
	}
}
