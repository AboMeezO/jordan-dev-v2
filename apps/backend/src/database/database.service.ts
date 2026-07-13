import {
	Injectable,
	OnModuleDestroy,
	OnModuleInit,
} from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

import { BackendConfigService } from "../config/app.config.js";

export type DatabaseTransactionClient =
	Prisma.TransactionClient;

@Injectable()
export class DatabaseService
	extends PrismaClient
	implements OnModuleInit, OnModuleDestroy
{
	public constructor(config: BackendConfigService) {
		super({
			datasources: {
				db: {
					url: config.databaseUrl,
				},
			},
		});
	}

	public async onModuleInit(): Promise<void> {
		await this.$connect();
	}

	public async onModuleDestroy(): Promise<void> {
		await this.$disconnect();
	}

	public async transaction<T>(
		callback: (
			transaction: DatabaseTransactionClient,
		) => Promise<T>,
	): Promise<T> {
		return this.$transaction(callback);
	}

	public async checkConnection(): Promise<void> {
		await this.$queryRaw`SELECT 1`;
	}
}
