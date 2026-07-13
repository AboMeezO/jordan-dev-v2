import {
	DynamicModule,
	Global,
	Module,
} from "@nestjs/common";

import { createConfig } from "../create-config.js";
import type { Config } from "../create-config.js";

export interface JDConfigModuleOptions {
	configPath?: string | undefined;
	schemaPath?: string | undefined;
	autoSyncEnabled?: boolean | undefined;
	envFilePath?: string | undefined;
	isGlobal?: boolean | undefined;
	validateOnBoot?: boolean | undefined;
}

export const JD_CONFIG = "JD_CONFIG";

@Global()
@Module({})
export class JDConfigModule {
	static forRoot(
		options: JDConfigModuleOptions,
	): DynamicModule {
		const config = createConfig({
			configPath: options.configPath,
			schemaPath: options.schemaPath,
			autoSyncEnabled: options.autoSyncEnabled,
			envFilePath: options.envFilePath,
			env: process.env,
		});

		if (options.validateOnBoot ?? true) {
			config.validate();
		}

		const providers = [
			{
				provide: JD_CONFIG,
				useValue: config,
			},
			{
				provide: ConfigProvider,
				useFactory: () => new ConfigProvider(config),
			},
		];

		return {
			module: JDConfigModule,
			global: options.isGlobal ?? true,
			providers,
			exports: [JD_CONFIG, ConfigProvider],
		};
	}
}

export class ConfigProvider {
	private readonly config: Config;

	constructor(config: Config) {
		this.config = config;
	}

	get<T = unknown>(path: string): T {
		return this.config.get<T>(path);
	}

	getAll(): Record<string, unknown> {
		return this.config.getAll();
	}
}
