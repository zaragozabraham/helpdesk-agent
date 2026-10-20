import { loadServerConfig } from '../config.js';
import { buildApp } from './app.js';

const config = loadServerConfig();
const app = buildApp({ logger: true });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.once(signal, () => {
		app.log.info({ signal }, 'shutting down');
		app.close().then(
			() => process.exit(0),
			(err: unknown) => {
				app.log.error(err, 'error during shutdown');
				process.exit(1);
			},
		);
	});
}

await app.listen({ port: config.port, host: config.host });
