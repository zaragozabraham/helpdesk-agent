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

### Changed

- `engines.node` raised to `>=22.13`, required by ESLint 10 and Vitest 5.
- `pnpm-workspace.yaml`: esbuild build script explicitly denied; the prebuilt platform binary is used.

### Security

- Coding agent sandbox now also denies shell reads of `infra/langfuse/.env`.
- Threat model extended to the local services (Langfuse, Ollama).
