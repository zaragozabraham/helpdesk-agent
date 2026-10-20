# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- TypeScript skeleton: strict `tsconfig.json` (Node 22, ESM, `NodeNext`).
- ESLint flat config with `typescript-eslint` `strictTypeChecked` rules.
- Vitest test runner (`test/**/*.test.ts`).
- Zod-validated environment config (`PORT`, `HOST`) in `src/config.ts`.
- Minimal Fastify server in `src/server/` with `GET /health`, plus tests.
- Scripts: `dev`, `lint`, `typecheck`, `test`.
- Self-hosted Langfuse stack in `infra/langfuse/` (official v4 compose, hardened: all ports bound to `127.0.0.1`, UI on port 3100, secrets in a git-ignored `.env`, sign-up closable via `AUTH_DISABLE_SIGNUP`).
- `README.md` with setup instructions, and MIT `LICENSE`.
- Hello agent (`src/agent/hello-agent.ts`): `createAgent` with a mock `get_service_status` tool (Zod-validated input and output), run with `pnpm hello`.
- Chat model factory (`src/llm/model.ts`): `ChatOllama` from config, thinking mode off.
- Langfuse tracing (`src/observability/langfuse.ts`): OpenTelemetry `NodeSDK` + `LangfuseSpanProcessor` and the LangChain `CallbackHandler`; enabled only when the Langfuse keys are set, flushed on shutdown.
- Config: `LLM_PROVIDER`, `LLM_MODEL`, `OLLAMA_BASE_URL` and optional `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`, validated with Zod.
- Tests for the agent (fake model, no network), model factory, tracing and config.

### Changed

- `engines.node` raised to `>=22.13`, required by ESLint 10 and Vitest 5.
- `src/config.ts` split into `loadServerConfig()`, `loadLlmConfig()` and `loadLangfuseConfig()`, so the server does not need LLM variables.
- `pnpm-workspace.yaml`: esbuild build script explicitly denied; the prebuilt platform binary is used.
- Node version pinned in `.nvmrc` and read by CI (`node-version-file`), so local and CI run the same version.
- Default local model is `qwen3.5:4b` (ADR-001).
- Development tracing uses Langfuse Cloud (free tier); the self-hosted stack stays as a supported option (ADR-001 update).

### Security

- Coding agent sandbox now also denies shell reads of `infra/langfuse/.env`.
- Threat model extended to the local services (Langfuse, Ollama).
