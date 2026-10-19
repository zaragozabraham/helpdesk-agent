# Threat Model — Helpdesk Agent

**Last updated:** 2026-10-19 · **Release: R0**

> R0 has no product agent yet. This version covers the development environment: the repository, CI and the coding agent used to build the product.

## Assets

| Asset                          | Type       | Sensitivity |
| :----------------------------- | :--------- | :---------- |
| LLM provider API keys          | credential | High        |
| Langfuse keys                  | credential | Medium      |
| GitHub credentials & CI tokens | credential | High        |
| Source code & git history      | data       | Medium      |

## Untrusted input sources

- Third-party npm packages (and their install scripts)
- Third-party GitHub Actions and Dependabot update PRs
- MCP servers connected to the coding agent
- Web pages and docs the coding agent fetches
- HTTP requests to the Fastify server (R0: only `GET /health`)

## Capabilities per tool / agent

| Tool / Agent               | Private data | Untrusted content | External communication |    Side effects    | Decision                                                                                         |
| :------------------------- | :----------: | :---------------: | :--------------------: | :----------------: | :----------------------------------------------------------------------------------------------- |
| Claude Code (coding agent) |   ✅ code    |    ✅ web/docs    |  ⚠️ git push, network  | ✅ edits, commands | Secret files denied (tool + sandbox); push requires approval; sandbox network allowlist; no hook bypass |

> A row with ✅ in the first three columns is a **lethal trifecta**: redesign it or require human approval.

## OWASP mapping

| Risk (LLM01–10 / ASI01–10)          | Applies | Mitigation                                                                                                   | Test that verifies it                              |
| :---------------------------------- | :-----: | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------- |
| LLM01:2025 Prompt Injection         |   ⚠️    | Coding agent reads external docs: network and WebFetch allowlists, human approval for push and dependencies | Partial: no automated test yet                     |
| LLM02:2025 Sensitive Info Disclosure |   ✅    | `.env*` ignored by git, denied to the coding agent, secret scanning before commit and in CI                  | R0 gate: secret-read and fake-token commit tests   |
| LLM03:2025 Supply Chain             |   ✅    | `pnpm audit` in CI, Dependabot, dependency build scripts blocked by default, `pnpm add`/`dlx` need approval, MCP servers reviewed before use | CI `dependencies` job                              |
| LLM06:2025 Excessive Agency         |   ✅    | Coding agent: ask for commit/push/add, deny force-push, `rm -rf` and `--no-verify`; sandboxed shell          | R0 gate: push prompts, force-push denied, sandbox probe |

## Implemented mitigations

| Mitigation                                  | Where it lives                                    | Test                                         |
| :------------------------------------------ | :------------------------------------------------ | :------------------------------------------- |
| Secret scanning (pre-commit + CI)           | `lefthook.yml`, `.github/workflows/ci.yaml`       | Fake GitHub token commit blocked             |
| Secrets excluded from git                   | `.gitignore`                                      | `git check-ignore -v .env .env.local`        |
| Coding agent can't read secrets             | `.claude/settings.json` (Read deny + sandbox `denyRead`) | R0 gate: read `.env` via tool and `cat` |
| Coding agent can't bypass hooks or force-push | `.claude/settings.json` (deny rules)            | R0 gate: force-push denied                   |
| Sandboxed shell with network allowlist      | `.claude/settings.json` (`sandbox`)               | R0 gate: `touch ~/sandbox-probe` fails       |
| Dependency audit                            | `.github/workflows/ci.yaml`                       | `pnpm audit` in CI                           |
| Coding agent can't run unsandboxed or change dependencies; installs are human-run | `.claude/settings.json` (`allowUnsandboxedCommands: false`, deny rules), `AGENTS.md` | Ask the agent to `pnpm add` a package → denied |
| Dependency build scripts blocked by default | `pnpm-workspace.yaml` (`lefthook`, `esbuild` explicitly denied) | `pnpm install --frozen-lockfile` fails on any undecided build script |
| Server env validated; errors never echo values | `src/config.ts` (Zod)                          | `test/config.test.ts`                        |
| Server binds to loopback by default; `/health` exposes no version or internals | `src/config.ts`, `src/server/app.ts` | `test/server/health.test.ts`, `test/config.test.ts` |

## Accepted residual risk

- Bash deny rules can be bypassed by alternate invocations (e.g. `/usr/bin/curl`, `sh -c`). The sandbox network allowlist is the real control; deny rules are a first barrier.
- The coding agent sends source code to the LLM provider as part of normal operation. Accepted: the repository contains no customer data or secrets.
- A human can skip the pre-commit hook locally with `--no-verify`. The CI `secrets` job is the backstop.
- Approved dependencies can still be compromised in a later release. Mitigated by the lockfile, `pnpm audit` and reviewing Dependabot PRs, not eliminated.
- Dependency installs run in the user's terminal, outside the sandbox (pnpm 12 needs a system-level lock the macOS sandbox blocks), so the sandbox network allowlist does not apply to them. Accepted: a human reviews each package, build scripts stay blocked by `pnpm-workspace.yaml`, and CI re-runs `pnpm install --frozen-lockfile` and `pnpm audit`.
