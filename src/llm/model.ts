import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOllama } from '@langchain/ollama';

import type { LlmConfig } from '../config.js';

// Keyed by every provider in the config enum: adding one fails to compile until it has a factory.
const factories: Record<LlmConfig['provider'], (config: LlmConfig) => BaseChatModel> = {
	ollama: (config) =>
		new ChatOllama({
			model: config.model,
			baseUrl: config.ollamaBaseUrl,
			think: false,
		}),
};

/**
 * Builds the chat model for the configured provider.
 * Agent code depends only on `BaseChatModel`, so adding a provider only touches this file.
 */
export function createChatModel(config: LlmConfig): BaseChatModel {
	return factories[config.provider](config);
}
