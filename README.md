# Helpdesk Agent

A technical-support agent for a fictional SaaS, built release by release with **LangChain v1 / LangGraph v1** and **TypeScript**.

This is a learning project focused on building agents the way production software should be built: every release goes through the same cycle — spec, design (ADR), threat model, implementation, tests and evals, release, observation and retro.

> **Status:** R0 — project foundations (tooling, CI, security guardrails, local observability).

## Tech stack

| Area | Choice |
| :--- | :--- |
| Runtime | Node.js 22, TypeScript (strict), ESM |
| Package manager | pnpm (version pinned in `package.json`) |
| Agents | LangChain v1 (`createAgent`), LangGraph v1 (`StateGraph`) |
| Validation | Zod |
| HTTP | Fastify |
| Tests | Vitest |
| Observability | Langfuse (self-hosted, see [`infra/langfuse`](infra/langfuse)) |
| CI | GitHub Actions: secret scanning, dependency audit, lint, typecheck, tests |

## Prerequisites

- [Node.js](https://nodejs.org/) 22.13 or later
- [pnpm](https://pnpm.io/) — enabled with `corepack enable pnpm`
- [Docker](https://www.docker.com/) with Docker Compose v2
- [gitleaks](https://github.com/gitleaks/gitleaks) — used by the pre-commit hook (`brew install gitleaks`)

## Getting started

### 1. Install

```bash
git clone <repo-url> helpdesk-agent && cd helpdesk-agent
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm lefthook install        # installs the gitleaks pre-commit hook
cp .env.example .env
```

### 2. Start Langfuse (observability)

Choose one option.

**Option A — self-hosted (recommended for local development).** The stack in [`infra/langfuse`](infra/langfuse) is the official Langfuse v4 Docker Compose setup, hardened for local use: every port is bound to `127.0.0.1`, the UI runs on port `3100`, and all secrets come from a git-ignored `.env`.

```bash
cd infra/langfuse
cp .env.example .env
```

Fill in every `XXXXX` value in `infra/langfuse/.env` with a random secret. Use hex output to avoid special characters in connection URLs; `ENCRYPTION_KEY` **must** be 64 hex characters:

```bash
openssl rand -hex 32
```

Then start the stack and wait until `langfuse-web` logs `Ready` (2–3 minutes):

```bash
docker compose up -d
docker compose logs -f langfuse-web
```

Open <http://localhost:3100>, sign up, create a project and generate API keys. Then close sign-up for everyone else: set `AUTH_DISABLE_SIGNUP=true` in `infra/langfuse/.env` and run `docker compose up -d` again.

**Option B — Langfuse Cloud.** Create a free project at [langfuse.com](https://langfuse.com) and use its API keys and base URL instead.

Either way, put the keys in the root `.env`:

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=http://localhost:3100   # or your Langfuse Cloud URL
```

### 3. Run

```bash
pnpm dev
curl 127.0.0.1:3000/health   # {"status":"ok"}
```

## Scripts

| Command | What it does |
| :--- | :--- |
| `pnpm dev` | Starts the server in watch mode |
| `pnpm lint` | ESLint with `typescript-eslint` strict type-checked rules |
| `pnpm typecheck` | TypeScript type check (no emit) |
| `pnpm test` | Vitest |

## Project structure

```text
src/
  config.ts          Environment config, validated with Zod
  server/            Fastify app (app.ts) and entry point (index.ts)
test/                Vitest tests, mirroring src/
docs/                Specs, ADRs and threat model
infra/langfuse/      Self-hosted Langfuse stack (separate Docker Compose)
```

## Security and quality

- **Secret scanning:** gitleaks runs on every commit (pre-commit hook) and on every push and pull request (CI).
- **Dependencies:** the lockfile is frozen in CI, `pnpm audit` runs on every PR, Dependabot keeps dependencies and GitHub Actions up to date, and dependency build scripts are blocked unless explicitly allowed (`pnpm-workspace.yaml`).
- **Branch protection:** `main` only accepts pull requests that pass every CI check; force-pushes and deletions are blocked.
- **AI coding agent guardrails:** the coding agent works from [`AGENTS.md`](AGENTS.md) and is restricted by [`.claude/settings.json`](.claude/settings.json): it cannot read secrets, bypass git hooks, force-push, install dependencies or run commands outside its sandbox.
- **Threat model:** risks, mitigations and accepted residual risk are tracked in [`docs/threat-model.md`](docs/threat-model.md) and updated every release.

## Development workflow

- Work on a feature branch and open a pull request; `main` is protected.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/).
- Each release follows a written spec (`docs/specs/`), records decisions as ADRs (`docs/adr/`) and updates the threat model.
- Changes are listed in [`CHANGELOG.md`](CHANGELOG.md).

## Roadmap

| Release | Focus |
| :---: | :--- |
| R0 | Foundations: tooling, CI, security guardrails, local observability |
| R1 | Typed workflow: ticket triage with structured output and evals |
| R2 | Agent with tools and MCP |
| R3 | Durable graph with human-in-the-loop approvals and memory |
| R4 | Agentic RAG with prompt-injection defenses and red teaming |
| R5 | Multi-agent experiment, decided by evals |
| R6 | Production and operations |

## License

[MIT](LICENSE)
