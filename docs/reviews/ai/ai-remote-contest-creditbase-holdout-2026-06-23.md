# AI Remote-Contest vs. Creditbase Holdout 2026-06-23

## Ergebnis

Das Holdout-Muster `gain_credit|runner.build_credit_base -> start_run|remote_contest` wurde geprüft, konnte mit den verfügbaren lokalen Daten aber nicht als aktueller KI-Fehler bestätigt werden.

Die versionierten Handoff-Artefakte enthalten nur Aggregate und redigierte Beispiele. Lokal vorhanden ist zusätzlich der aktuelle Holdout-Runner-Bericht unter `data/local/ai-replay/2026-06-23/`, aber auch dieser Bericht enthält keine vollständigen Einzelfälle für das Remote-Contest-/Creditbase-Muster. Aus Datenschutz- und Reproduzierbarkeitsgründen wurde kein FullState- oder Hidden-Info-Pfad als KI-Wissensquelle genutzt.

## Repro-Grenze

- Handoff: `docs/reviews/ai/ai-replay-decision-holdout-handoff-2026-06-23.md` nennt 11 historische Holdout-Fälle für `gain_credit|runner.build_credit_base -> start_run|remote_contest`.
- Safe Summary: `docs/reviews/ai/ai-replay-decision-safe-summary-2026-06-23.json` enthält nur Aggregate, keine Einzelfallpayloads.
- Lokaler aktueller Bericht: `data/local/ai-replay/2026-06-23/2026-06-23-current-ai-holdout-report.json` ist read-only genutzt worden und enthält ebenfalls nur redigierte Beispiele.

## Regression

`packages/ai/src/index.test.ts` ergänzt eine synthetische, holdout-förmige Regression: Runner hat einen bezahlbaren `start_run` auf eine Remote mit verdeckter Agenda und alternativ nur `gain_credit`. Die aktuelle Runner-KI wählt den Remote-Contest-Run mit `runner.plan.contest_remote`, nicht `gain_credit`.

Damit ist das Muster für den aktuellen Stand nicht als Fehler reproduziert. Die Regression bleibt als Schutz gegen erneute Creditbase-Überpriorisierung bestehen.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "creditbase gain" --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`

Der vollständige AI-Testlauf bestand mit 141 Testdateien und 1585 Tests.

## Vertragsgrenzen

Keine Engine-Änderung, keine Ranking-Neukalibrierung, keine neue LegalAction-Erzeugung, keine Änderung an `applyAction`, Replay, StateHash oder Randomness und keine Hidden-Info-Ausweitung.
