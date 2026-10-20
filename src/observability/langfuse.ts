import type { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { CallbackHandler } from '@langfuse/langchain';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { NodeSDK } from '@opentelemetry/sdk-node';

import type { LangfuseConfig } from '../config.js';

export interface Tracing {
	enabled: boolean;
	/** LangChain callbacks to pass in the `callbacks` field of `invoke()` config. */
	callbacks: BaseCallbackHandler[];
	/** Flushes pending spans and stops the SDK. Safe to call when tracing is disabled. */
	shutdown: () => Promise<void>;
}

/** Starts OpenTelemetry with the Langfuse exporter. A `null` config disables tracing. */
export function startTracing(config: LangfuseConfig | null): Tracing {
	if (config === null) {
		return { enabled: false, callbacks: [], shutdown: () => Promise.resolve() };
	}

	// Pass every value explicitly so the SDK never falls back to other env vars or defaults.
	const sdk = new NodeSDK({
		spanProcessors: [
			new LangfuseSpanProcessor({
				publicKey: config.publicKey,
				secretKey: config.secretKey,
				baseUrl: config.baseUrl,
			}),
		],
	});
	sdk.start();

	return {
		enabled: true,
		callbacks: [new CallbackHandler()],
		shutdown: () => sdk.shutdown(),
	};
}
