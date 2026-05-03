# CODEX_STATUS

## Current phase

Repository setup and Codex guidance.

## Status

Setup environment created. No Engine, UI, Server, AI, scenario, or test implementation has been written.

The local Codex `goals` feature is enabled for persistent `/goal` workflows. Use it for the next multi-phase Netrunner work, especially MVP 0.1 requirements, review, implementation, and hardening.

## Files and areas created

- Root project guidance: `AGENTS.md`, `AGENTS.local.md`, `README.md`
- Local project knowledge base: `KI-Wissen-Netrunner/`
- Monorepo metadata: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `vitest.config.ts`
- Environment template: `.env.example`
- Ignore rules: `.gitignore`
- Codex workflow area: `docs/codex/`
- Expected source area: `docs/source/`
- Derived-artifact area: `docs/derived/`
- Versioned data artifact areas: `data/rules`, `data/cards`, `data/decks`, `data/manifests`, `data/deviations`, `data/scenarios`
- Package shells: `packages/shared`, `packages/engine`, `packages/ai`
- App shells: `apps/web`, `apps/server`
- Test/spec shells: `tests/specs`, `tests/e2e`, `tests/fixtures`
- Script shell: `scripts`

## Source files present in `docs/source`

- `Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`
- `Netrunner_MVP_0.2_Plan.md`
- `Erstes Testdeck.txt`
- `Erstes Testdeck.md`
- `Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf`

## Missing source files

None known for the setup phase.

## Data artifacts present

- `data/decks/demo-decks.json`

`demo-decks.json` was positioned from the supplied first-demo-decks package. It has not yet been reviewed, normalized, or frozen as an executable MVP 0.1 derived artifact.

## Blockers for implementation

- MVP 0.1 executable requirements have not been derived yet.
- Required data artifacts and scenario fixtures are not fully derived or reviewed yet.
- Tests are not specified or implemented yet.
- Dependencies are declared for setup, but `pnpm install` was not run in this phase.
- Local tool check during setup found Node `v24.15.0`; this matches the project target Node 24 LTS.
- `pnpm` was not available directly on PATH during setup. `corepack pnpm --version` works with `pnpm@10.33.2`.

## Local tool notes

- Node target files exist: `.nvmrc` and `.node-version` both specify `24`.
- Root `package.json` declares `pnpm@10.33.2` via `packageManager`.
- Before dependency installation, use Node 24 LTS. If `pnpm` is not directly on PATH, use `corepack pnpm ...`.
- Persistent `/goal` workflows are suitable for Netrunner because the project is explicitly split into gated phases.

## Branch for next thread

- Current intended working branch: `codex/mvp-0-1-requirements`
- Purpose: start MVP 0.1 executable requirements only.
- Do not implement Engine, UI, Server, AI, or tests before the requirements review gate.

## Next recommended prompt

```text
Create or continue a persistent goal named "MVP 0.1 executable requirements".

Read AGENTS.md and /docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md first.

Primary sources:
- /docs/source/Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md
- /docs/source/Erstes Testdeck.txt
- /docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf

Secondary source:
- /docs/source/Netrunner_MVP_0.2_Plan.md only for future-compatibility awareness. Do not expand MVP 0.1 scope.

Task:
Turn the MVP 0.1 sources into executable requirements, data artifacts, scenario fixtures, and a test matrix. Do not implement code.
```
