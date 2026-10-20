import { AIMessage, type BaseMessage, fakeModel, ToolMessage } from 'langchain';
import { describe, expect, it } from 'vitest';

import { createHelloAgent, getServiceStatus, serviceStatusSchema } from '../../src/agent/hello-agent.js';

const isToolMessage = (m: BaseMessage): m is ToolMessage => ToolMessage.isInstance(m);
const parseStatus = (m: BaseMessage | undefined) => serviceStatusSchema.parse(JSON.parse(m?.text ?? ''));

describe('hello agent', () => {
	it('calls get_service_status and answers from its result', async () => {
		const model = fakeModel()
			.respondWithTools([{ name: 'get_service_status', args: { service: 'billing' }, id: 'call-1' }])
			.respond((messages) => {
				const { status } = parseStatus(messages.find(isToolMessage));
				return new AIMessage(`Billing is currently ${status}.`);
			});
		const agent = createHelloAgent(model);

		const result = await agent.invoke({ messages: [{ role: 'user', content: 'Is billing working right now?' }] });

		const toolMessages = result.messages.filter(isToolMessage);
		expect(toolMessages).toHaveLength(1);
		expect(toolMessages[0]?.name).toBe('get_service_status');
		const status = parseStatus(toolMessages[0]);
		expect(status.service).toBe('billing');

		// The tool result was fed back to the model on its second call.
		expect(model.callCount).toBe(2);
		expect(model.calls[1]?.messages.some(isToolMessage)).toBe(true);

		expect(result.messages.at(-1)?.text).toBe(`Billing is currently ${status.status}.`);
	});
});

describe('get_service_status tool', () => {
	it('returns mock data that matches the output schema', async () => {
		const raw: unknown = await getServiceStatus.invoke({ service: 'api' });

		expect(typeof raw).toBe('string');
		const status = serviceStatusSchema.parse(JSON.parse(raw as string));
		expect(status).toMatchObject({ service: 'api', status: 'operational' });
	});

	it('rejects unknown services', async () => {
		await expect(getServiceStatus.invoke({ service: 'mainframe' } as never)).rejects.toThrow();
	});
});
