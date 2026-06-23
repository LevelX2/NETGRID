---
activityId: act-2026-06-23-ai-remote-contest-creditbase-holdout
status: done
kind: fix
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-23
startedAt: 2026-06-23
completedAt: 2026-06-23
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/ai/src/index.test.ts
  - docs/reviews/ai/ai-remote-contest-creditbase-holdout-2026-06-23.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "creditbase gain" --maxWorkers=1 --testTimeout=30000
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai test
---

# AI Remote-Contest vs. Creditbase Holdout prüfen

## Ziel

Das Holdout-Muster `gain_credit|runner.build_credit_base -> start_run|remote_contest` soll als eigener KI-Fehlercluster geprüft und, falls bestätigt, mit einem separaten Minimalfix behoben werden.

## Kontext und Quellen

- `docs/reviews/ai/ai-replay-decision-holdout-handoff-2026-06-23.md`
- `docs/reviews/ai/ai-replay-decision-safe-summary-2026-06-23.json`
- Vollständige lokale Exports nur bei Bedarf neu unter `data/local/ai-replay/<run-id>` erzeugen.
- Holdout-Befund: 11 Fälle mit `gain_credit|runner.build_credit_base -> start_run|remote_contest`.

## Scope

- Nur das Muster `gain_credit|runner.build_credit_base -> start_run|remote_contest` prüfen.
- Mindestens einen Same-State-Repro aus lokal gespeicherten Daten oder eine kleine synthetische Repro-Fixture erstellen.
- Prüfen, ob die aktuelle KI tatsächlich eine Creditbase-Aktion einem klar besseren Remote-Contest-Run vorzieht.
- Bei bestätigtem Fehler genau einen minimalen KI-Fix schneiden.

## Nicht im Scope

- Keine zweite Änderung am bereits gefixten Coverage-Mapping-Run-Gap.
- Keine allgemeine Remote-Contest-Neukalibrierung.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder Randomness-Änderung.
- Keine Nutzung von FullState-/Hidden-Info als KI-Wissensquelle.

## Akzeptanzkriterien

- [ ] Discovery/Holdout-Grenze und lokale Datenquelle sind im Ergebnis dokumentiert.
- [ ] Ein Repro belegt entweder den aktuellen Fehler oder begründet, warum das Muster historisch oder nicht bestätigbar ist.
- [ ] Falls ein Fix erfolgt, gibt es einen fokussierten Regressionstest und mindestens eine Gegenkontrolle.
- [ ] Hidden-Info-, LegalAction- und Replay-Verträge bleiben unverändert.

## Umsetzungshinweise

- Primär `card-enablement-ai-knowledge-agent`, weil KI-Verhalten und Mechanikfolgen betroffen sind.
- Nicht aus Matchausgang oder Shadow-Abweichung allein schließen.
- Bei Repro aus SQLite nur `getPlayerView` und `getLegalActions` als KI-Input verwenden.

## Ergebnisnotiz

Abgeschlossen. Das Holdout-Muster `gain_credit|runner.build_credit_base -> start_run|remote_contest` wurde geprüft, konnte mit den verfügbaren Safe-Artefakten aber nicht als aktueller Fehler bestätigt werden. Die versionierten Handoff-/Summary-Dateien und der lokale aktuelle Holdout-Bericht enthalten keine vollständigen Remote-Contest-Einzelfälle, nur Aggregate und redigierte Beispiele.

Als aktuelle Regression wurde eine synthetische, side-safe Fixture in `packages/ai/src/index.test.ts` ergänzt: Bei bezahlbarem Remote-Contest und alternativem `gain_credit` wählt die Runner-KI den Remote-Run mit `runner.plan.contest_remote`. Deshalb erfolgte kein Ranking- oder Remote-Contest-Codefix.

Checks grün: fokussierte Regression, `@netgrid/ai typecheck` und vollständiger `@netgrid/ai test` mit 141 Testdateien und 1585 Tests. Hidden-Info-, LegalAction-, Replay-, StateHash-, Randomness- und `applyAction`-Verträge bleiben unverändert. Bericht: `docs/reviews/ai/ai-remote-contest-creditbase-holdout-2026-06-23.md`.
