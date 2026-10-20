import { ChatOllama } from '@langchain/ollama';
import { describe, expect, it } from 'vitest';

import { createChatModel } from '../../src/llm/model.js';

describe('createChatModel', () => {
	it('builds a ChatOllama from config with thinking disabled', () => {
		const model = createChatModel({
			provider: 'ollama',
			model: 'gemma4:12b',
			ollamaBaseUrl: 'http://127.0.0.1:11434',
		});

		expect(model).toBeInstanceOf(ChatOllama);
		const ollama = model as ChatOllama;
		expect(ollama.model).toBe('gemma4:12b');
		expect(ollama.baseUrl).toBe('http://127.0.0.1:11434');
		expect(ollama.think).toBe(false);
	});
});
