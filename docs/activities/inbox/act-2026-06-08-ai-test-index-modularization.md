---
activityId: act-2026-06-08-ai-test-index-modularization
status: inbox
kind: cleanup
area: ai
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-06-08
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-06-08-ai-struct-runtime-entrypoints
  - act-2026-06-08-ai-struct-legacy-baseline-isolation
  - act-2026-06-08-ai-struct-simulation-benchmark-split
resultArtifacts: []
checks: []
---

# AI-TEST-1: index.test.ts entlang neuer Modulgrenzen verkleinern

## Ziel

`packages/ai/src/index.test.ts` soll nicht weiter als Sammelbecken wachsen und schrittweise entlang der neuen Runtime-, Legacy-, Simulation- und Regressionstestgrenzen verkleinert werden. Der bestehende Testmonolith bleibt als Sicherheitsnetz erhalten, wird aber nicht mehr als Default-Ort für neue AI-Regressionen genutzt.

## Kontext und Quellen

- `docs/reviews/ai/ai-player-code-structure-analysis-2026-06-07.md`
- Nutzerbewertung vom 2026-06-08: Keine mechanische Komplettzerlegung; neue Regressionen sollen in Zielmodule, alte Blöcke nur schrittweise migrieren.
- Analysebefund: `packages/ai/src/index.test.ts` hat rund 24.582 Zeilen und 437 Testfälle.
- Vorgesehene Zieltestdateien aus dem Review:
  - `ai-controller-contract.test.ts`
  - `legacy-baseline.test.ts`
  - `semantic-runtime.test.ts`
  - `belief-state-runtime.test.ts`
  - `simulation-harness.test.ts`
  - `runner-regressions.test.ts`
  - `corp-regressions.test.ts`

## Scope

- Nach den ersten Modulverschiebungen prüfen, welche `index.test.ts`-Blöcke ohne Verhaltensänderung in fokussierte Testdateien umziehen können.
- Zuerst maximal ein bis zwei klar abgegrenzte Blöcke verschieben, z. B. Controller-/DTO-/Hidden-Info-Vertrag oder Legacy-Baseline.
- Gemeinsame Fixtures nur extrahieren, wenn sie echte Dopplung reduzieren und nicht selbst zum neuen Sammelbecken werden.
- Neue Tests für künftige AI-Arbeiten nicht mehr in `index.test.ts` ergänzen, wenn ein fachlich passendes Zielmodul existiert.

## Nicht im Scope

- Keine Big-Bang-Zerlegung der gesamten `index.test.ts`.
- Keine Snapshot- oder Erwartungsänderungen ohne fachliche Begründung.
- Keine Produktivlogik ändern, um Testverschiebungen einfacher zu machen.
- Keine Entfernung wertvoller Regressionen nur wegen Dateigröße.
- Keine Engine-, `LegalActions`-, `applyAction`-, Replay-, StateHash- oder Hidden-Info-Vertragsänderung.

## Akzeptanzkriterien

- [ ] Mindestens ein klarer `index.test.ts`-Block ist in eine fachlich passend benannte Testdatei verschoben oder eine kleinere erste Verschiebung ist begründet durchgeführt.
- [ ] Verschobene Tests prüfen dieselben Verträge wie vorher; es gibt keine absichtliche Erwartungsänderung.
- [ ] `index.test.ts` erhält keine neuen fachfremden Regressionen im Rahmen dieses Pakets.
- [ ] Der neue Testzuschnitt dokumentiert, wo künftige Runtime-, Legacy-, Simulation-, Runner- und Corp-Regressionen landen sollen.
- [ ] `corepack pnpm --filter @netgrid/ai test` ist grün oder verbleibende fremde Fails sind konkret benannt und nicht durch dieses Paket verursacht.
- [ ] `corepack pnpm --filter @netgrid/ai typecheck` und `git diff --check` sind grün.

## Umsetzungshinweise

- Dieses Paket ist nachgelagert, weil sinnvolle Zieltestdateien erst nach den ersten Modulgrenzen entstehen.
- Wenn ein Testblock beim Verschieben Logikdrift zeigt, abbrechen, Befund dokumentieren und eine fachliche Folgeactivity anlegen.
- `index.test.ts` darf als Sicherheitsnetz bleiben; Ziel ist kontrolliertes Schrumpfen, nicht vollständige Entfernung.

## Ergebnisnotiz

Noch offen.
