import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from "@nestjs/platform-fastify";

import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
	const app =
		await NestFactory.create<NestFastifyApplication>(
			AppModule,
			new FastifyAdapter({ logger: true }),
		);

	app.enableCors({
		credentials: true,
		origin: process.env.FRONTEND_ORIGIN?.split(",") ?? true,
	});

	await app.listen(
		process.env.PORT === undefined
			? 3001
			: Number(process.env.PORT),
		"0.0.0.0",
	);
}

await bootstrap();
