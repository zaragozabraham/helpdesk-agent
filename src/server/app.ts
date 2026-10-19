import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { z } from 'zod';

export const healthResponseSchema = z.object({ status: z.literal('ok') });
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** Builds the Fastify app without listening, so tests can use `app.inject()`. */
export function buildApp(options: FastifyServerOptions = {}): FastifyInstance {
	const app = Fastify(options);

	// Liveness only: exposes no version, uptime or dependency details.
	app.get('/health', (): HealthResponse => ({ status: 'ok' }));

	return app;
}
