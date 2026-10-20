import { describe, expect, it } from 'vitest';

import { loadLangfuseConfig, loadLlmConfig, loadServerConfig } from '../src/config.js';

describe('loadServerConfig', () => {
	it('applies defaults when variables are unset', () => {
		expect(loadServerConfig({})).toEqual({ port: 3000, host: '127.0.0.1' });
	});

	it('reads PORT and HOST from the environment', () => {
		expect(loadServerConfig({ PORT: '8080', HOST: '0.0.0.0' })).toEqual({ port: 8080, host: '0.0.0.0' });
	});

	it.each(['abc', '0', '70000', '3000.5'])('rejects invalid PORT %j', (port) => {
		expect(() => loadServerConfig({ PORT: port })).toThrow(/PORT/);
	});
});

describe('loadLlmConfig', () => {
	it('applies provider and base URL defaults', () => {
		expect(loadLlmConfig({ LLM_MODEL: 'gemma4:12b' })).toEqual({
			provider: 'ollama',
			model: 'gemma4:12b',
			ollamaBaseUrl: 'http://127.0.0.1:11434',
		});
	});

	it('reads all LLM variables', () => {
		expect(
			loadLlmConfig({ LLM_PROVIDER: 'ollama', LLM_MODEL: 'llama3.2', OLLAMA_BASE_URL: 'http://ollama:11434' }),
		).toEqual({ provider: 'ollama', model: 'llama3.2', ollamaBaseUrl: 'http://ollama:11434' });
	});

	it('requires LLM_MODEL', () => {
		expect(() => loadLlmConfig({})).toThrow(/LLM_MODEL/);
		expect(() => loadLlmConfig({ LLM_MODEL: '' })).toThrow(/LLM_MODEL/);
	});

	it('rejects unsupported providers without echoing the value', () => {
		const run = () => loadLlmConfig({ LLM_PROVIDER: 'not-a-provider-xyz', LLM_MODEL: 'm' });
		expect(run).toThrow(/LLM_PROVIDER/);
		expect(run).not.toThrow(/not-a-provider-xyz/);
	});

	it('rejects an invalid OLLAMA_BASE_URL', () => {
		expect(() => loadLlmConfig({ LLM_MODEL: 'm', OLLAMA_BASE_URL: 'not a url' })).toThrow(/OLLAMA_BASE_URL/);
	});
});

describe('loadLangfuseConfig', () => {
	const keys = {
		LANGFUSE_PUBLIC_KEY: 'pk-lf-test',
		LANGFUSE_SECRET_KEY: 'sk-lf-super-secret-value',
		LANGFUSE_BASE_URL: 'http://localhost:3100',
	};

	it('returns null (tracing disabled) when no Langfuse variables are set', () => {
		expect(loadLangfuseConfig({})).toBeNull();
	});

	it('returns the config when keys and base URL are set', () => {
		expect(loadLangfuseConfig(keys)).toEqual({
			publicKey: 'pk-lf-test',
			secretKey: 'sk-lf-super-secret-value',
			baseUrl: 'http://localhost:3100',
		});
	});

	it.each(['LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY'] as const)('rejects a config missing only %s', (missing) => {
		const env: Record<string, string | undefined> = { ...keys, [missing]: undefined };
		expect(() => loadLangfuseConfig(env)).toThrow(/LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY/);
	});

	it('requires LANGFUSE_BASE_URL when keys are set (no cloud default)', () => {
		expect(() => loadLangfuseConfig({ ...keys, LANGFUSE_BASE_URL: undefined })).toThrow(/LANGFUSE_BASE_URL/);
	});

	it('never echoes secret values in errors', () => {
		const run = () => loadLangfuseConfig({ ...keys, LANGFUSE_BASE_URL: 'not a url' });
		expect(run).toThrow(/LANGFUSE_BASE_URL/);
		expect(run).not.toThrow(/sk-lf-super-secret-value|pk-lf-test|not a url/);
	});
});
