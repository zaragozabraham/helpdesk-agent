import { z } from 'zod';

type Env = Record<string, string | undefined>;

/** Treats empty strings (e.g. `KEY=` in a .env file) as unset. */
const optionalString = z.preprocess((v) => (v === '' ? undefined : v), z.string().optional());

const serverEnvSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
	HOST: z.string().min(1).default('127.0.0.1'),
});

const llmEnvSchema = z.object({
	LLM_PROVIDER: z.enum(['ollama']).default('ollama'),
	LLM_MODEL: z.string({ error: 'LLM_MODEL is required' }).min(1, 'LLM_MODEL is required'),
	OLLAMA_BASE_URL: z.url().default('http://127.0.0.1:11434'),
});

const langfuseEnvSchema = z
	.object({
		LANGFUSE_PUBLIC_KEY: optionalString,
		LANGFUSE_SECRET_KEY: optionalString,
		LANGFUSE_BASE_URL: z.preprocess((v) => (v === '' ? undefined : v), z.url().optional()),
	})
	.superRefine((env, ctx) => {
		const hasPublic = env.LANGFUSE_PUBLIC_KEY !== undefined;
		const hasSecret = env.LANGFUSE_SECRET_KEY !== undefined;
		if (hasPublic !== hasSecret) {
			ctx.addIssue({
				code: 'custom',
				path: [hasPublic ? 'LANGFUSE_SECRET_KEY' : 'LANGFUSE_PUBLIC_KEY'],
				message: 'LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY must be set together',
			});
		}
		// No default: an unset URL would make the SDK fall back to Langfuse Cloud.
		if ((hasPublic || hasSecret) && env.LANGFUSE_BASE_URL === undefined) {
			ctx.addIssue({
				code: 'custom',
				path: ['LANGFUSE_BASE_URL'],
				message: 'LANGFUSE_BASE_URL is required when Langfuse keys are set',
			});
		}
	});

export interface ServerConfig {
	port: number;
	host: string;
}

export interface LlmConfig {
	provider: z.infer<typeof llmEnvSchema>['LLM_PROVIDER'];
	model: string;
	ollamaBaseUrl: string;
}

export interface LangfuseConfig {
	publicKey: string;
	secretKey: string;
	baseUrl: string;
}

/**
 * Parses `env` with `schema`. Errors name the offending variable but never echo its value:
 * `reportInput` stays off and every custom message names variables only.
 */
function parseEnv<T extends z.ZodType>(schema: T, env: Env): z.output<T> {
	const result = schema.safeParse(env, { reportInput: false });
	if (!result.success) {
		throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
	}
	return result.data;
}

export function loadServerConfig(env: Env = process.env): ServerConfig {
	const data = parseEnv(serverEnvSchema, env);
	return { port: data.PORT, host: data.HOST };
}

export function loadLlmConfig(env: Env = process.env): LlmConfig {
	const data = parseEnv(llmEnvSchema, env);
	return { provider: data.LLM_PROVIDER, model: data.LLM_MODEL, ollamaBaseUrl: data.OLLAMA_BASE_URL };
}

/** Returns `null` when no Langfuse keys are set, which disables tracing. */
export function loadLangfuseConfig(env: Env = process.env): LangfuseConfig | null {
	const data = parseEnv(langfuseEnvSchema, env);
	if (data.LANGFUSE_PUBLIC_KEY === undefined || data.LANGFUSE_SECRET_KEY === undefined || data.LANGFUSE_BASE_URL === undefined) {
		return null;
	}
	return { publicKey: data.LANGFUSE_PUBLIC_KEY, secretKey: data.LANGFUSE_SECRET_KEY, baseUrl: data.LANGFUSE_BASE_URL };
}
