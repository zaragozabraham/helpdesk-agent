import { z } from 'zod';

const envSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
	HOST: z.string().min(1).default('127.0.0.1'),
});

export interface Config {
	port: number;
	host: string;
}

/**
 * Parses server configuration from environment variables.
 * Errors name the offending variable but never echo its value.
 */
export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
	const result = envSchema.safeParse(env);
	if (!result.success) {
		throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
	}
	return { port: result.data.PORT, host: result.data.HOST };
}
