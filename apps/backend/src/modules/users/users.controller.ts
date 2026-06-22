import {
	permissions,
	updateUserSchema,
	userRoleAssignmentSchema,
} from "@jordan-devs/shared";
import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Put,
	Query,
} from "@nestjs/common";
import { z } from "zod";

import { RequirePermissions } from "../../common/decorators/require-permissions.decorator.js";
import { UserService } from "./user.service.js";

const listQuerySchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
	search: z.string().optional(),
	roleId: z.string().optional(),
});

@Controller("admin/users")
export class UsersController {
	constructor(private readonly users: UserService) {}

	@Get()
	@RequirePermissions(permissions.userRead)
	async list(@Query() rawQuery: Record<string, unknown>) {
		const query = listQuerySchema.parse(rawQuery);
		return this.users.list({
			page: query.page,
			limit: query.limit,
			search: query.search ?? undefined,
			roleId: query.roleId ?? undefined,
		});
	}

	@Get(":id")
	@RequirePermissions(permissions.userRead)
	getDetail(@Param("id") id: string) {
		return this.users.getDetail(id);
	}

	@Patch(":id")
	@RequirePermissions(permissions.userUpdate)
	async update(@Param("id") id: string, @Body() dto: unknown) {
		const data = updateUserSchema.parse(dto);
		return this.users.update(id, {
			displayName: data.displayName ?? undefined,
			email: data.email ?? undefined,
		});
	}

	@Put(":id/roles")
	@RequirePermissions(permissions.userUpdate)
	async assignRoles(@Param("id") id: string, @Body() dto: unknown) {
		const { roleIds } = userRoleAssignmentSchema.parse(dto);
		return this.users.assignRoles(id, roleIds);
	}
}
