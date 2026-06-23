---
activityId: act-2026-06-23-ai-remote-contest-creditbase-holdout
status: inbox
kind: fix
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-23
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# AI Remote-Contest vs. Creditbase Holdout prüfen

## Ziel

Das Holdout-Muster `gain_credit|runner.build_credit_base -> start_run|remote_contest` soll als eigener KI-Fehlercluster geprüft und, falls bestätigt, mit einem separaten Minimalfix behoben werden.

## Kontext und Quellen

- `docs/reviews/ai/ai-replay-decision-holdout-handoff-2026-06-23.md`
- `docs/reviews/ai/ai-replay-decision-cases-2026-06-23.json`
- `docs/reviews/ai/ai-replay-decision-candidate-clusters-2026-06-23.json`
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

Noch offen.

