# ADR-001: Local infrastructure for observability and LLM

**Status:** Accepted
**Date:** 2026-10-19
**Release:** R0

## Context

The project needs tracing from the first agent run, so every later release can be measured. Constraints:

- **No budget for a paid LLM API.** The author's Claude plan (Pro) includes no API credits.
- **Privacy:** from R1, prompts and traces will contain ticket content. It should not leave the machine by default.
- **Reproducibility:** anyone who clones the repository must be able to run the same setup.
- **Limited local resources:** everything runs on one laptop.

## Decision

1. **Observability: self-hosted Langfuse v4** in `infra/langfuse/`, with its own Docker Compose file, separate from the application's.
   It is based on the official compose file and hardened for local use: every port bound to `127.0.0.1`, UI on port 3100 (the app uses 3000), secrets in a git-ignored `.env`, sign-up closed after the first account, and telemetry off.
2. **LLM: local models served by Ollama**, selected through environment variables (`LLM_PROVIDER`, `LLM_MODEL`, `OLLAMA_BASE_URL`).
   - Default development model: `qwen3.5:4b`.
   - `gemma4:12b` stays available for quality comparisons.
   - Thinking mode is off by default.
3. **Provider-agnostic model factory** (`src/llm/model.ts`): agent code depends only on `BaseChatModel`, so a hosted provider can be added later without touching agents.
4. **Tracing goes only to an explicitly configured Langfuse URL.** There is no default URL, so traces can never fall back to Langfuse Cloud.

## Alternatives considered

| Alternative                                 | Pros                                           | Cons                                                                    | Outcome                                                                  |
| :------------------------------------------ | :--------------------------------------------- | :---------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| Langfuse in a folder outside the repository | Shared by several projects                     | Not reproducible from a clone; the hardening work is invisible          | Rejected                                                                 |
| One compose file for the app and Langfuse   | Single command                                 | Running the app or tests would start six extra services                 | Rejected                                                                 |
| Langfuse Cloud                              | No local resources                             | Traces leave the machine                                                | Rejected as default; documented in the README as an option for reviewers |
| Claude API (or another hosted LLM)          | Stronger tool calling and injection robustness | Paid; no credits on the current plan                                    | Rejected for now; the factory keeps the door open                        |
| `gemma4:12b` as default model               | Larger model                                   | Slower and caused heavy memory pressure with the Langfuse stack running | Rejected as default                                                      |

## Consequences

**Positive:**

- Zero LLM cost, and prompts never leave the machine.
- One clone reproduces the whole setup.
- Switching provider or model is a configuration change.

**Negative:**

- Local models are less reliable at tool calling and less robust against prompt injection. **Eval results are not representative of a production model.**
- The local stack is heavy: Langfuse runs six containers next to the model.
- Ollama tags can be republished with different weights, so eval runs must record the exact model ID (see below).
- The MinIO image used by Langfuse has no version pin (Chainguard only publishes `latest`).

## Evidence

Hello-agent smoke test, one run per model, on 2026-10-19 (traced in Langfuse):

| Model        | Total latency | Called `get_service_status` | Notes                                                 |
| :----------- | ------------: | :-------------------------: | :---------------------------------------------------- |
| `gemma4:12b` |       16.06 s |             ✅              | Heavy memory pressure with the Langfuse stack running |
| `qwen3.5:4b` |        6.03 s |             ✅              | —                                                     |

Single runs, possibly including model load time. To be re-measured against the R1 eval dataset.

## Model versions

| Tag          | Ollama ID      |
| :----------- | :------------- |
| `qwen3.5:4b` | `7f3251fa6878` |
| `gemma4:12b` | `c7597fc90b86` |
