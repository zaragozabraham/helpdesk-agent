import { describe, expect, it } from 'vitest';

import { startTracing } from '../../src/observability/langfuse.js';

describe('startTracing', () => {
	it('is a no-op when Langfuse is not configured', async () => {
		const tracing = startTracing(null);

		expect(tracing.enabled).toBe(false);
		expect(tracing.callbacks).toEqual([]);
		await expect(tracing.shutdown()).resolves.toBeUndefined();
	});
});
