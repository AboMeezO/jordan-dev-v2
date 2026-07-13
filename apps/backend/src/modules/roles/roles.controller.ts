import {
	createRoleSchema,
	permissions,
	rolePermissionAssignmentSchema,
	updateRoleSchema,
} from "@jordan-devs/shared";
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Put,
} from "@nestjs/common";

import { RequirePermissions } from "../../common/decorators/require-permissions.decorator.js";
import { RolesService } from "./roles.service.js";

@Controller("admin/roles")
export class RolesController {
	constructor(private readonly roles: RolesService) {}

	@Get()
	@RequirePermissions(permissions.rolesRead)
	list() {
		return this.roles.list();
	}

	@Post()
	@RequirePermissions(permissions.rolesUpdate)
	async create(@Body() dto: unknown) {
		const data = createRoleSchema.parse(dto);
		return this.roles.create({
			name: data.name,
			description: data.description ?? undefined,
			permissions: data.permissions,
		});
	}

	@Get(":id")
	@RequirePermissions(permissions.rolesRead)
	getDetail(@Param("id") id: string) {
		return this.roles.getDetail(id);
	}

	@Patch(":id")
	@RequirePermissions(permissions.rolesUpdate)
	async update(
		@Param("id") id: string,
		@Body() dto: unknown,
	) {
		const data = updateRoleSchema.parse(dto);
		return this.roles.update(id, {
			name: data.name ?? undefined,
			description: data.description ?? undefined,
		});
	}

	@Delete(":id")
	@RequirePermissions(permissions.rolesUpdate)
	async delete(@Param("id") id: string) {
		await this.roles.delete(id);
		return { deleted: true };
	}

	@Put(":id/permissions")
	@RequirePermissions(permissions.rolesUpdate)
	async setPermissions(
		@Param("id") id: string,
		@Body() dto: unknown,
	) {
		const { permissionIds } =
			rolePermissionAssignmentSchema.parse(dto);
		return this.roles.setPermissions(id, permissionIds);
	}
}
