import { describe, expect, it } from 'vitest';

import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
	it('applies defaults when variables are unset', () => {
		expect(loadConfig({})).toEqual({ port: 3000, host: '127.0.0.1' });
	});

	it('reads PORT and HOST from the environment', () => {
		expect(loadConfig({ PORT: '8080', HOST: '0.0.0.0' })).toEqual({ port: 8080, host: '0.0.0.0' });
	});

	it.each(['abc', '0', '70000', '3000.5'])('rejects invalid PORT %j', (port) => {
		expect(() => loadConfig({ PORT: port })).toThrow(/PORT/);
	});
});
