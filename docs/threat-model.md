# Threat Model — Helpdesk Agent

**Last updated:** 2026-10-19 · **Release: R0**

> R0 has no product agent yet. This version covers the development environment: the repository, CI, the coding agent used to build the product, and the local services it runs on (Langfuse and Ollama).

## Assets

| Asset                                               | Type       | Sensitivity                                                 |
| :-------------------------------------------------- | :--------- | :---------------------------------------------------------- |
| LLM provider API keys                               | credential | High (none yet: local Ollama needs no key)                  |
| Langfuse project API keys                           | credential | Medium                                                      |
| Langfuse stack secrets (`infra/langfuse/.env`)      | credential | High                                                        |
| GitHub credentials & CI tokens                      | credential | High                                                        |
| Source code & git history                           | data       | Medium                                                      |
| Trace data in Langfuse (prompts, outputs, metadata) | data       | Low in R0; High from R1, when traces contain ticket content |

## Untrusted input sources

- Third-party npm packages (and their install scripts)
- Third-party GitHub Actions and Dependabot update PRs
- MCP servers connected to the coding agent
- Web pages and docs the coding agent fetches
- HTTP requests to the Fastify server (R0: only `GET /health`)
- Model weights pulled from the Ollama registry
- Third-party container images for the Langfuse stack
- LLM output and tool results in the hello agent (`src/agent/hello-agent.ts`)

## Capabilities per tool / agent

| Tool / Agent                       | Private data | Untrusted content | External communication |    Side effects    | Decision                                                                                                |
| :--------------------------------- | :----------: | :---------------: | :--------------------: | :----------------: | :------------------------------------------------------------------------------------------------------ |
| Claude Code (coding agent)         |   ✅ code    |    ✅ web/docs    |  ⚠️ git push, network  | ✅ edits, commands | Secret files denied (tool + sandbox); push requires approval; sandbox network allowlist; no hook bypass |
| Hello agent (`get_service_status`) |      ❌      | ⚠️ user question  |  ❌ local Ollama only  | ❌ read-only mock  | Accepted for R0: fixed mock data, no private data, no write tools                                       |

> A row with ✅ in the first three columns is a **lethal trifecta**: redesign it or require human approval.

## OWASP mapping

| Risk (LLM01–10 / ASI01–10)           | Applies | Mitigation                                                                                                                                                                                                                | Test that verifies it                                                              |
| :----------------------------------- | :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------- |
| LLM01:2025 Prompt Injection          |   ⚠️    | Coding agent reads external docs: network and WebFetch allowlists, human approval for push and dependencies                                                                                                               | Partial: no automated test yet                                                     |
| LLM02:2025 Sensitive Info Disclosure |   ✅    | `.env*` ignored by git, denied to the coding agent, secret scanning before commit and in CI; local LLM keeps prompts on the machine; Langfuse reachable only from localhost                                               | R0 gate: secret-read and fake-token commit tests; `cat infra/langfuse/.env` denied |
| LLM03:2025 Supply Chain              |   ✅    | `pnpm audit` in CI, Dependabot, dependency build scripts blocked by default, installs are human-run, MCP servers reviewed before use; container images pinned to a major version; Ollama models pinned to an explicit tag | CI `dependencies` job                                                              |
| LLM06:2025 Excessive Agency          |   ✅    | Coding agent: ask for commit/push/add, deny force-push, `rm -rf` and `--no-verify`; sandboxed shell                                                                                                                       | R0 gate: push prompts, force-push denied, sandbox probe                            |

## Implemented mitigations

| Mitigation                                                                                                                                         | Where it lives                                                                       | Test                                                                 |
| :------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------- |
| Secret scanning (pre-commit + CI)                                                                                                                  | `lefthook.yml`, `.github/workflows/ci.yaml`                                          | Fake GitHub token commit blocked                                     |
| Secrets excluded from git                                                                                                                          | `.gitignore`                                                                         | `git check-ignore -v .env .env.local`                                |
| Coding agent can't read secrets                                                                                                                    | `.claude/settings.json` (Read deny + sandbox `denyRead`)                             | R0 gate: read `.env` via tool and `cat`                              |
| Coding agent can't bypass hooks or force-push                                                                                                      | `.claude/settings.json` (deny rules)                                                 | R0 gate: force-push denied                                           |
| Sandboxed shell with network allowlist                                                                                                             | `.claude/settings.json` (`sandbox`)                                                  | R0 gate: `touch ~/sandbox-probe` fails                               |
| Dependency audit                                                                                                                                   | `.github/workflows/ci.yaml`                                                          | `pnpm audit` in CI                                                   |
| Coding agent can't run unsandboxed or change dependencies; installs are human-run                                                                  | `.claude/settings.json` (`allowUnsandboxedCommands: false`, deny rules), `AGENTS.md` | Ask the agent to `pnpm add` a package → denied                       |
| Dependency build scripts blocked by default                                                                                                        | `pnpm-workspace.yaml` (`lefthook`, `esbuild`, `protobufjs` explicitly denied)        | `pnpm install --frozen-lockfile` fails on any undecided build script |
| Langfuse ports bound to loopback only                                                                                                              | `infra/langfuse/docker-compose.yml`                                                  | `docker compose config \| grep host_ip` shows only `127.0.0.1`       |
| Langfuse sign-up closed after the first account                                                                                                    | `infra/langfuse` (`AUTH_DISABLE_SIGNUP=true`)                                        | `/auth/sign-up` refuses new accounts                                 |
| Langfuse runs with no default secrets; telemetry and onboarding calls off                                                                          | `infra/langfuse/.env` (git-ignored)                                                  | `docker compose config` finds no default secret values               |
| Coding agent can't read Langfuse secrets                                                                                                           | `.claude/settings.json` (Read deny + sandbox `denyRead`)                             | Ask the agent to `cat infra/langfuse/.env` → denied                  |
| Prompts never leave the machine (local LLM)                                                                                                        | Ollama on `127.0.0.1:11434`                                                          | `lsof -iTCP:11434 -sTCP:LISTEN` shows only `127.0.0.1`               |
| Server, LLM and Langfuse env validated; errors never echo values (incl. secret keys)                                                               | `src/config.ts` (Zod)                                                                | `test/config.test.ts`                                                |
| Traces go only to the configured Langfuse URL: no Langfuse Cloud fallback, keys must come as a pair with an explicit URL, tracing off without keys | `src/config.ts`, `src/observability/langfuse.ts`                                     | `test/config.test.ts`, `test/observability/langfuse.test.ts`         |
| Tool input and output validated with Zod                                                                                                           | `src/agent/hello-agent.ts`                                                           | `test/agent/hello-agent.test.ts`                                     |
| Server binds to loopback by default; `/health` exposes no version or internals                                                                     | `src/config.ts`, `src/server/app.ts`                                                 | `test/server/health.test.ts`, `test/config.test.ts`                  |

## Accepted residual risk

- Bash deny rules can be bypassed by alternate invocations (e.g. `/usr/bin/curl`, `sh -c`). The sandbox network allowlist is the real control; deny rules are a first barrier.
- The coding agent sends source code to the LLM provider as part of normal operation. Accepted: the repository contains no customer data or secrets.
- A human can skip the pre-commit hook locally with `--no-verify`. The CI `secrets` job is the backstop.
- Approved dependencies can still be compromised in a later release. Mitigated by the lockfile, `pnpm audit` and reviewing Dependabot PRs, not eliminated.
- The Langfuse MinIO image (`cgr.dev/chainguard/minio`) has no version pin: Chainguard only publishes `latest` for free images.
- Traces are stored unencrypted in local Docker volumes. Accepted while traces contain only synthetic data; revisit in R1, when ticket content reaches traces.
- Local models are less robust against prompt injection and less reliable at tool calling than frontier models. Accepted for development; eval results with a local model are not representative of a production model.
- Traces include full prompts, tool inputs/outputs and model answers, with no PII masking yet (`LangfuseSpanProcessor` `mask` is unused). Accepted while the only agent handles fixed mock data; masking must be in place before user or ticket content reaches traces (R1).
- Dependency installs run in the user's terminal, outside the sandbox (pnpm 12 needs a system-level lock the macOS sandbox blocks), so the sandbox network allowlist does not apply to them. Accepted: a human reviews each package, build scripts stay blocked by `pnpm-workspace.yaml`, and CI re-runs `pnpm install --frozen-lockfile` and `pnpm audit`.

## Release history

| Release | Changes to this threat model                                                                                                                                                                       |
| :-----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   R0    | Initial version: development environment, CI, coding agent, Fastify skeleton, self-hosted Langfuse and local Ollama. Hello agent: tracing config, tool I/O validation, untraced-PII residual risk. |
