import { permissions } from "@jordan-devs/shared";
import { describe, expect, it } from "vitest";

import type { PermissionRequirement } from "../../common/types/permission-requirement.js";
import { PERMISSIONS_METADATA_KEY } from "../../common/types/permission-requirement.js";
import { DashboardController } from "./dashboard.controller.js";

describe("DashboardController", () => {
	it("requires dashboard read permission for overview", () => {
		const descriptor = Object.getOwnPropertyDescriptor(
			DashboardController.prototype,
			"getOverview",
		);
		const metadata = Reflect.getMetadata(
			PERMISSIONS_METADATA_KEY,
			descriptor?.value as object,
		) as unknown;

		expect(metadata).toEqual({
			mode: "all",
			permissions: [permissions.dashboardRead],
		} satisfies PermissionRequirement);
	});
});
