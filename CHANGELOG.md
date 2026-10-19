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

### Changed

- `engines.node` raised to `>=22.13`, required by ESLint 10 and Vitest 5.
- `pnpm-workspace.yaml`: esbuild build script explicitly denied; the prebuilt platform binary is used.
