/**
 * Smoke test for the LLM and observability setup.
 * Needs Ollama (and optionally Langfuse) running locally: `pnpm hello`.
 */
import { createHelloAgent } from '../src/agent/hello-agent.js';
import { loadLangfuseConfig, loadLlmConfig } from '../src/config.js';
import { createChatModel } from '../src/llm/model.js';
import { startTracing } from '../src/observability/langfuse.js';

const QUESTION = 'Is the billing service working right now?';

const llm = loadLlmConfig();
const tracing = startTracing(loadLangfuseConfig());
const agent = createHelloAgent(createChatModel(llm));

console.log(`Model: ${llm.provider}/${llm.model} · tracing: ${tracing.enabled ? 'on' : 'off'}`);
console.log(`Q: ${QUESTION}`);

try {
	const result = await agent.invoke(
		{ messages: [{ role: 'user', content: QUESTION }] },
		{ callbacks: tracing.callbacks, runName: 'hello-agent' },
	);
	console.log(`A: ${result.messages.at(-1)?.text ?? ''}`);
} catch (err: unknown) {
	console.error('Agent run failed:', err instanceof Error ? err.message : err);
	process.exitCode = 1;
} finally {
	await tracing.shutdown();
}
