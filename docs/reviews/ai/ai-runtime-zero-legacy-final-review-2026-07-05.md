# AI Runtime Zero Legacy Final Review 2026-07-05

## Ergebnis

Der produktive AI-Runtime-Baum ist legacy-frei. `packages/ai/src/runtime/**` enthält keine Legacy-Imports, keine Legacy-Provider, keinen produktiven Legacy-Kill-Switch und keine Baseline-Adapter mehr. Die Runtime-Simulationskomposition mit historischem Baseline-Vergleich liegt jetzt unter `packages/ai/src/simulation/ai-runtime-simulation-composition.ts`.

## Schnitt

- `chooseAiAction`, `chooseCorpAction` und `chooseRunnerAction` routen direkt in die Semantic Runtime.
- Practical Micro annotiert nur noch gegen die Runtime-Referenzentscheidung und bekommt keinen Legacy-Provider mehr.
- `index.ts` exportiert keine Legacy-Plan-Fassade und keine Baseline-Action-Selectoren mehr.
- Historische Plan-/Baseline-Regressionen importieren ihre Helfer explizit aus `legacy/legacy-public-contract` oder dem AI-Runtime-Simulationspfad.
- `module-boundaries.test.ts` erzwingt Runtime Zero Legacy und begrenzt Legacy-Symbole auf `legacy/**`, `simulation/**`, `evaluation/**` und Tests.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/practical-micro-runtime.test.ts src/runtime/practical-micro-candidates-context.test.ts src/deck-doctrine-runtime-context.test.ts src/public-export-contract.test.ts src/runtime/semantic-runtime-corp-passive-scoreline.test.ts src/runtime/semantic-runtime-corp-score-safety.test.ts src/runtime/corp-scoreline/semantic-runtime-corp-scoreline-assessment.test.ts src/semantic-ai-runtime-cutover.test.ts --reporter dot`
- Runtime-/Public-`rg`-Gate ohne Legacy-Treffer.
- Public-Facade-`rg`-Gate ohne Legacy-/Baseline-Export-Treffer.
- `git diff --check`

## Nicht geändert

Keine Engine-Regeln, keine LegalAction-Erzeugung, keine `applyAction`-Revalidierung, keine Replay-/StateHash-/Randomness-Logik und keine PlayerView-/Hidden-Info-Verträge wurden geändert.

## Resthinweis

`packages/ai/src/index.test.ts` enthält weiterhin viele historische Assertions auf alte Legacy-ReasonCodes und Legacy-Planentscheidungen. Diese Datei ist kein Zero-Legacy-Abschlussgate; die Legacy-Abhängigkeiten darin sind nun explizit importiert und damit sichtbar historisch isoliert.
