# AI Known ICE Trace Review Fix Final Report 2026-06-23

## Status

`abgeschlossen`

## Ergebnis

Die Review-Nacharbeit zum Known-ICE-Run-Risk-Fix ist umgesetzt. Die Runner-KI behandelt sichtbare Trace-Gefahren bekannter/gerezzter ICE jetzt nicht mehr als einfachen `baseTraceStrength - baseLink`-Fall, sondern bewertet:

- aktivierte Base-Link-Karten mit echten Kosten und öffentlichen Nebenwirkungen;
- sichtbare Corp-Bid-Kapazität als Garantie-Spanne;
- mehrere Trace-Subroutinen eines ICE mit gemeinsam verbrauchtem Budget;
- DTO-Sanitization von `baseTraceStrength` und `traceSuccessEffect`;
- Top-Level-Entscheidungen für High-Payoff-Remote-Agenda und generische Trace-Erfolgseffekte.

Der ursprüngliche konkrete Fehlerfall bleibt behoben: ein unbekannter R&D-Run durch sichtbaren `Hunter` bei zu wenig Credits verliert gegen Setup-/Credit-Alternativen. Eine sichtbare Remote-Agenda kann dasselbe Risiko weiterhin bewusst akzeptieren.

## Umsetzung

- `@netgrid/engine` exportiert eine read-only CardImplementation-Quote für Trace-Base-Link-Karten. Die AI nutzt damit echte Aktivierungskosten und erkennt `Submarine Uplink` als nicht access-sichere Vermeidung wegen erzwungenem Jack-out.
- `VisibleIceRunHazard` trägt zusätzliche Diagnosefelder: `baseTraceCovered`, `visibleCorpBidCapacity`, `visibleCorpMaxTraceCovered`, `visibleCorpMaxTraceAvoidanceCost`, `traceBidCost`, Base-Link-Quelle, Base-Link-Kosten und Base-Link-Side-Effect.
- `evaluateRunnerRunTargets()` übergibt sichtbare Corp-Credits an die bekannte Pfadanalyse. Garantierte Trace-Vermeidung zählt erst, wenn `baseTraceStrength + visibleCorpBidCapacity` gedeckt ist oder die Subroutine gebrochen werden kann.
- Trace-Hazards innerhalb desselben ICE werden sequenziell bewertet. Credits und Break-Affordability werden nach jeder gewählten Vermeidung fortgeschrieben.
- `known-ice-run-risk.test.ts` enthält jetzt einen echten Engine-`getPlayerView()` -> DTO -> Runner-AI-Test für rezzed `Hunter` sowie eine Top-Level-Matrix für `add_counter`, `net_damage`, `end_run_and_run_lock`, `end_run_trash_program_and_run_lock` und `trash_runner_resource_and_add_tag`.

## Verifikation

Grün:

- `corepack pnpm exec vitest run src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot`
- `corepack pnpm exec vitest run src/known-ice-run-risk.test.ts src/visible-run-analysis.test.ts src/runner-run-target-evaluation.test.ts src/runner-run-target-guidance.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot`
- `corepack pnpm exec vitest run src/visible-run-analysis.test.ts src/runner-run-target-evaluation.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot`
- `corepack pnpm exec tsc -p tsconfig.json --noEmit` in `packages/ai`
- `corepack pnpm exec tsc -p tsconfig.json --noEmit` in `packages/engine`

Baseline eingeordnet:

- `corepack pnpm --filter @netgrid/ai test` bleibt baseline-rot: 138 Testdateien liefen, 137 bestanden; 1566/1570 Tests bestanden. Die vier roten Tests sind die bekannten Shell-Traders-Fixture-Tests in `packages/ai/src/index.test.ts`:
  - `plans installed The Shell Traders as build-rig progress before basic economy`
  - `uses The Shell Traders remove-counter actions to finish delayed installs`
  - `finishes Shell Traders backlog before preparing more cards`
  - `installs urgent Shell Traders targets directly when affordable`

## Vertragslage

Keine neue LegalAction-Erzeugung, keine Änderung an `applyAction`, Replay, StateHash oder Randomness. Die AI nutzt weiterhin nur side-safe PlayerView-/DTO-/LegalAction-Daten und sichtbare CardDefinition-/CardImplementation-Fakten.
