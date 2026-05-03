# CODEX_STATUS

## Current phase

Repository setup and Codex guidance.

## Status

Setup environment created. No Engine, UI, Server, AI, scenario, or test implementation has been written.

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
- `Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf`

## Missing source files

- `Erstes Testdeck.txt`

The consolidated MVP 0.1 concept contains demo-deck material, but the separately named source file is still missing. Treat this as a blocker or explicit assumption before the MVP 0.1 requirements-freeze phase.

## Blockers for implementation

- MVP 0.1 executable requirements have not been derived yet.
- Required data artifacts and scenario fixtures are not created yet.
- Tests are not specified or implemented yet.
- Dependencies are declared for setup, but `pnpm install` was not run in this phase.
- Local tool check during setup found Node `v24.15.0`; the project target is Node 22.
- `pnpm` was not available on PATH during setup. `corepack` was available.

## Local tool notes

- Node target files exist: `.nvmrc` and `.node-version` both specify `22`.
- Root `package.json` declares `pnpm@10.33.2` via `packageManager`.
- Before dependency installation, activate Node 22 and make pnpm available through Corepack or another deliberate local toolchain setup.

## Next recommended prompt

```text
Create or continue a persistent goal named "MVP 0.1 executable requirements".

Read AGENTS.md and /docs/codex/CODEX_RUNBOOK_NETRUNNER_MVP_0_1_0_2.md first.

Primary sources:
- /docs/source/Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md
- /docs/source/Erstes Testdeck.txt, if available; otherwise document the missing source and use the consolidated 0.1 deck sections only with explicit assumption
- /docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf

Secondary source:
- /docs/source/Netrunner_MVP_0.2_Plan.md only for future-compatibility awareness. Do not expand MVP 0.1 scope.

Task:
Turn the MVP 0.1 sources into executable requirements, data artifacts, scenario fixtures, and a test matrix. Do not implement code.
```
