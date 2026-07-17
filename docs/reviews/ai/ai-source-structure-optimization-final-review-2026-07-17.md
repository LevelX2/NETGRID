# AI Source Structure Optimization – Final Review 2026-07-17

## Status

`final_green_ready`

Der Paketprozess AISSO-0 bis AISSO-8 ist auf dem mit lokalem `main`
abgeglichenen Arbeitsbranch vollständig umgesetzt und verifiziert. Es gab
keine Änderung an Engine-Regeln, LegalAction-Erzeugung, Scoringgewichten,
Hidden-Info-Grenzen, Replay, StateHash oder Randomness.

## Ergebnis

Die priorisierten Mischblöcke sind jetzt schmale Orchestratoren oder
Consumer-Fassaden mit fachlich benannten Untermodulen:

| Bereich                   | Ausgang | Endstand | Fachlicher Owner                                    |
| ------------------------- | ------: | -------: | --------------------------------------------------- |
| Semantic Choice Ranking   |   1.759 |      542 | `runtime/choice-ranking/`                           |
| Corp Score                |   3.817 |      807 | `runtime/corp-scoreline/`                           |
| Corp Board Triage         |   3.689 |      792 | `runtime/corp-scoreline/`                           |
| Corp Scoring Window       |   1.719 |      248 | `runtime/corp-scoreline/`                           |
| Visible Run Analysis      |   2.464 |      628 | `run-analysis/`                                     |
| Runner Hand Development   |   2.755 |      935 | `runner/hand-development/`                          |
| Action Semantic Candidate |     726 |      284 | `action-semantic-candidate-types.ts` und `actions/` |

Die leicht höheren Endgrößen von Choice Ranking und Hand Development gegenüber
den jeweiligen Paketständen enthalten die anschließend integrierten
Main-Fixes. Deren Fachlogik wurde in die neuen Owner-Module portiert; die
Fassaden bleiben unter ihren aktualisierten exakten Ratchets.

Weitere erreichte Grenzen:

- `@netgrid/ai` ist live-only; Simulation, Selfplay und Benchmarks liegen unter
  `@netgrid/ai/simulation`.
- Aktuelle Simulationsverträge sind neutral benannt. Historische
  V1.4.3-Fixtures liegen ausschließlich unter `simulation/regression/v143/`.
- Access-Outcome-Memory besitzt keinen parallelen deprecated Adapter mehr.
- Plan-, RunTarget-, HandDevelopment-, Simulation- und Action-Semantik-
  Contractzyklen sind vollständig entfernt.
- Der produktive Importgraph besitzt null Laufzeitzyklen und null Typzyklen.
- Das aktive Source-Structure-Gate schützt Zyklen, Current-/Regression-
  Simulationsgrenzen, priorisierte Dateigrößen, Testgrößen und den Runtime-Root.

## Messstand

- 666 produktive TypeScript-Dateien mit 152.880 Zeilen.
- 371 Test- und Test-Support-Dateien mit 110.415 Zeilen.
- 289 produktive Dateien direkt unter `packages/ai/src/runtime/`.
- Kein allgemeines Produktionsmodul liegt ungeratchet über 2.500 Zeilen.
- `git diff` gegen die Prozessbasis enthält vor allem verhaltensneutrale
  Verschiebungen; bestehende öffentliche Fassaden bleiben erhalten, soweit sie
  aktuelle Consumer schützen.

## Final Gate

Auf dem nach `ed2436929` mit lokalem `main` abgeglichenen Stand sind grün:

```text
corepack pnpm check:package-boundaries
corepack pnpm check:ai
corepack pnpm check:ai:full
corepack pnpm check:ai-source-structure
corepack pnpm check:ai-source-structure:selftest
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/server typecheck
corepack pnpm --filter @netgrid/ai test:shard:1  # 122 Dateien, 769 Tests
corepack pnpm --filter @netgrid/ai test:shard:2  # 122 Dateien, 968 Tests
corepack pnpm --filter @netgrid/ai test:shard:3  # 122 Dateien, 782 Tests
git diff --check
```

Gesamt: 366 Testdateien und 2.519/2.519 Tests grün. Der Full-Derived-Facts-
Report wurde nach der Main-Integration um genau den vom Gate geforderten
generierten Rollenwert aktualisiert.

## Verbleibende Empfehlungen

Es gibt keinen Abschlussblocker. Für spätere, eigenständige Strukturpakete
sind diese Kandidaten sinnvoll:

1. `belief-state.ts` ist nach den neuesten Main-Erweiterungen mit 2.547 Zeilen
   der einzige Produktionspfad oberhalb des generischen 2.500-Zeilen-Ziels.
   Sinnvoll wäre eine Trennung von Eventreduktion, sichtbarer Remote-Memory und
   Runner-Opponent-Model, nicht ein pauschaler Dateischnitt.
2. Die Simulationsmodule `benchmark-reports.ts` (2.366),
   `selfplay-trace-mining.ts` (2.111) und `match-progression-summary.ts`
   (2.000) sollten erst bei der nächsten fachlichen Änderung nach Report-,
   Detector- beziehungsweise Metrikfamilien geschnitten werden.
3. Die größten verbleibenden Tests sind `tactical-plans.test.ts` (4.307),
   `semantic-ai-runtime-cutover.test.ts` (4.260), die Corp-Score-Suiten
   (3.796/3.313) und `runner-run-target-evaluation.test.ts` (3.149). Ihre
   Ratchets verhindern Wachstum; ein Split lohnt sich zusammen mit der
   nächsten Änderung in der jeweiligen Domäne.
4. Der Runtime-Root bleibt mit 289 Produktionsdateien flach. Neue Familien
   sollten konsequent in bestehenden oder neuen fachlichen Unterordnern
   landen; ein riskanter Massenumzug bestehender Kleinstmodule ist weiterhin
   nicht empfohlen.

Damit ist die Struktur für den aktuellen Version-0-Stand sauber geschützt und
deutlich navigierbarer. Die Restpunkte sind messbare Folgeoptimierungen, keine
verdeckten Vertrags- oder Sicherheitsdefizite.
