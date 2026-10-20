import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { createAgent, tool } from 'langchain';
import { z } from 'zod';

const serviceNameSchema = z.enum(['api', 'dashboard', 'billing']);

export const serviceStatusSchema = z.object({
	service: serviceNameSchema,
	status: z.enum(['operational', 'degraded', 'outage']),
	latencyMs: z.number().int().nonnegative(),
	updatedAt: z.iso.datetime(),
});
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;

// Fixed mock data for R0; replaced by a real status source in a later release.
const MOCK_STATUS: Record<z.infer<typeof serviceNameSchema>, Omit<ServiceStatus, 'service'>> = {
	api: { status: 'operational', latencyMs: 120, updatedAt: '2026-10-19T09:00:00Z' },
	dashboard: { status: 'operational', latencyMs: 340, updatedAt: '2026-10-19T09:00:00Z' },
	billing: { status: 'degraded', latencyMs: 2400, updatedAt: '2026-10-19T09:00:00Z' },
};

export const getServiceStatus = tool(
	({ service }) => {
		const status = serviceStatusSchema.parse({ service, ...MOCK_STATUS[service] });
		return JSON.stringify(status);
	},
	{
		name: 'get_service_status',
		description: 'Get the current status of a SaaS service (api, dashboard or billing).',
		schema: z.object({ service: serviceNameSchema.describe('The service to check') }),
	},
);

const SYSTEM_PROMPT = `You are a technical-support assistant for a SaaS product.
Use the get_service_status tool to answer questions about service health.
Answer briefly, based only on the tool result.`;

export function createHelloAgent(model: BaseChatModel) {
	return createAgent({ model, tools: [getServiceStatus], systemPrompt: SYSTEM_PROMPT });
}
