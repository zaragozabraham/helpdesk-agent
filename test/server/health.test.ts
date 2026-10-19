import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp, healthResponseSchema } from '../../src/server/app.js';

describe('GET /health', () => {
	let app: FastifyInstance;

	beforeEach(async () => {
		app = buildApp();
		await app.ready();
	});

	afterEach(async () => {
		await app.close();
	});

	it('returns 200 with a JSON body matching the health contract', async () => {
		const res = await app.inject({ method: 'GET', url: '/health' });

		expect(res.statusCode).toBe(200);
		expect(res.headers['content-type']).toMatch(/^application\/json/);
		expect(healthResponseSchema.parse(res.json())).toEqual({ status: 'ok' });
	});

	it('returns 404 for unknown routes', async () => {
		const res = await app.inject({ method: 'GET', url: '/does-not-exist' });

		expect(res.statusCode).toBe(404);
	});
});
