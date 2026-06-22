import { permissions } from "@jordan-devs/shared";
import { Controller, Get } from "@nestjs/common";

import { RequirePermissions } from "../../common/decorators/require-permissions.decorator.js";
import { AuthorizationService } from "./authorization.service.js";

@Controller("admin/permissions")
export class PermissionsController {
	constructor(private readonly authorization: AuthorizationService) {}

	@Get()
	@RequirePermissions(permissions.permissionsRead)
	list() {
		return this.authorization.listPermissions();
	}
}
