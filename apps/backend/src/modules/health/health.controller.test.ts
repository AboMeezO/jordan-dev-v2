import { ServiceUnavailableException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import type { BackendConfigService } from "../../config/app.config.js";
import type { DatabaseService } from "../../database/database.service.js";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
	it("returns liveness", () => {
		const controller = new HealthController(
			mockConfig(),
			mockDatabase(),
		);

		expect(controller.check()).toEqual({ status: "ok" });
	});

	it("returns readiness when config and database are available", async () => {
		const controller = new HealthController(
			mockConfig(),
			mockDatabase(),
		);

		await expect(controller.ready()).resolves.toEqual({
			status: "ready",
			checks: { config: "ok", database: "ok" },
		});
	});

	it("fails readiness when the database check fails", async () => {
		const controller = new HealthController(
			mockConfig(),
			mockDatabase(new Error("down")),
		);

		await expect(controller.ready()).rejects.toBeInstanceOf(
			ServiceUnavailableException,
		);
	});
});

function mockConfig(): BackendConfigService {
	const config: Pick<BackendConfigService, "assertLoaded"> =
		{
			assertLoaded: vi.fn(),
		};

	return config as BackendConfigService;
}

function mockDatabase(error?: Error): DatabaseService {
	const database: Pick<DatabaseService, "checkConnection"> =
		{
			checkConnection: vi.fn(() =>
				error === undefined
					? Promise.resolve()
					: Promise.reject(error),
			),
		};

	return database as DatabaseService;
}
