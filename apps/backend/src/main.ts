import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from "@nestjs/platform-fastify";

import { AppModule } from "./app.module.js";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter.js";
import { BackendConfigService } from "./config/app.config.js";

async function bootstrap(): Promise<void> {
	const app =
		await NestFactory.create<NestFastifyApplication>(
			AppModule,
			new FastifyAdapter({ logger: true }),
		);

	const config = app.get(BackendConfigService);
	app.useGlobalFilters(new ApiExceptionFilter(config));

	app.enableCors({
		credentials: true,
		origin: config.frontendOrigins ?? true,
	});

	await app.listen(config.port, "0.0.0.0");
}

await bootstrap();
