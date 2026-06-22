import {
	type Permission,
	type RoleDetail,
} from "@jordan-devs/shared";
import {
	Injectable,
	NotFoundException,
} from "@nestjs/common";

import { RolesRepository } from "./roles.repository.js";

@Injectable()
export class RolesService {
	constructor(private readonly roles: RolesRepository) {}

	list() {
		return this.roles.findAllWithCount();
	}

	async create(data: { name: string; description: string | undefined; permissions: readonly Permission[] }) {
		const roleId = await this.roles.create({
			name: data.name,
			description: data.description,
		});

		if (data.permissions.length > 0) {
			await this.roles.setPermissions(roleId, data.permissions);
		}

		return this.roles.findByIdWithPermissions(roleId);
	}

	async getDetail(id: string): Promise<RoleDetail> {
		const role = await this.roles.findByIdWithPermissions(id);
		if (!role) {
			throw new NotFoundException("Role not found");
		}
		return role as RoleDetail;
	}

	async update(id: string, data: { name: string | undefined; description: string | null | undefined }) {
		const existing = await this.roles.findByIdWithPermissions(id);
		if (!existing) {
			throw new NotFoundException("Role not found");
		}
		await this.roles.update(id, data);
		const updated = await this.roles.findByIdWithPermissions(id);
		return updated as RoleDetail;
	}

	async delete(id: string) {
		const existing = await this.roles.findByIdWithPermissions(id);
		if (!existing) {
			throw new NotFoundException("Role not found");
		}
		await this.roles.delete(id);
	}

	async setPermissions(id: string, permissionIds: readonly string[]) {
		const existing = await this.roles.findByIdWithPermissions(id);
		if (!existing) {
			throw new NotFoundException("Role not found");
		}
		return this.roles.setPermissions(id, permissionIds);
	}
}
