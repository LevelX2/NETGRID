---
activityId: act-2026-06-23-ai-coverage-direct-action-score-gate
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
  - packages/ai/src/runtime/semantic-choice-ranking.ts
  - packages/ai/src/runtime/semantic-choice-ranking.test.ts
  - docs/reviews/ai/ai-coverage-direct-action-score-gate-2026-06-23.md
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-choice-ranking.test.ts src/semantic-ai-runtime-cutover.test.ts --maxWorkers=1 --testTimeout=30000
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/ai test
---

# AI-Coverage: direkte Coverage-Aktionen an positiven Nutzen binden

## Ziel

Das verbleibende Ranking-Risiko aus dem Coverage-Mapping-Fix soll gezielt geprüft werden: Direkte Coverage-Aktionen wie `trigger_ability`, `install_card` oder `play_event` blockieren aktuell auch bei großem Score-Abstand einen Run. Dieser Schutz soll mindestens an positive Bewertung, Bezahlbarkeit und tatsächliche Coverage-Verbesserung gebunden werden, falls die Analyse das Risiko bestätigt.

## Kontext und Quellen

- `docs/reviews/ai/ai-replay-decision-fix-2026-06-23.md`
- `packages/ai/src/runtime/semantic-choice-ranking.ts`
- `packages/ai/src/runtime/semantic-choice-ranking.test.ts`

## Scope

- Prüfen, ob direkte Coverage-Aktionen mit nichtpositivem oder fachlich nutzlosem Score aktuell bessere Runs blockieren können.
- Falls bestätigt, die Sperre eng an positive Bewertung und sichtbare Coverage-Verbesserung binden.
- Regressionen für direkte sinnvolle Coverage-Antworten und klar bessere Runs ergänzen.

## Nicht im Scope

- Keine pauschale Abschaffung des Schutzes für direkte Coverage-Aktionen.
- Keine Änderung an Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder Randomness-Verträgen.
- Keine Nutzung lokaler Replay-IDs oder Match-Sonderfälle.

## Akzeptanzkriterien

- [ ] Ein fokussierter Test belegt den Risikofall oder dokumentiert, warum er aktuell nicht eintreten kann.
- [ ] Sinnvolle direkte Coverage-Antworten bleiben gegen knapp bessere Runs geschützt.
- [ ] Nichtpositive oder nutzlose Coverage-Antworten blockieren keinen klar positiven Run.
- [ ] `corepack pnpm --filter @netgrid/ai typecheck` und relevante Runtime-Tests sind grün.

## Umsetzungshinweise

- Primär `card-enablement-ai-knowledge-agent`, weil KI-Verhalten und Karten-/Coverage-Semantik betroffen sind.
- Kleine Änderung in `semantic-choice-ranking.ts` bevorzugen; keine breite Score-Neukalibrierung.

## Ergebnisnotiz

Abgeschlossen. Der Risikofall wurde bestätigt: Direkt gemappte Coverage-Aktionen im `runner.obtain_breaker_coverage`-Plan konnten auch mit nichtpositivem Semantic-Score einen klar positiven Run blockieren, solange sie keine generischen `gain_credit`-/`draw_card`-Fallbacks waren.

`packages/ai/src/runtime/semantic-choice-ranking.ts` bindet den Schutz für direkte Coverage-Antworten jetzt an `mappedChoice.score > 0`. Damit bleiben sinnvoll bewertete direkte Coverage-Antworten geschützt, während nichtpositive oder nutzlose direkte Coverage-Antworten keinen klar positiven Run mehr blockieren. `packages/ai/src/runtime/semantic-choice-ranking.test.ts` deckt beide Fälle ab.

Checks grün: fokussierte Runtime-Ranking-/Cutover-Tests, `@netgrid/ai typecheck` und vollständiger `@netgrid/ai test` mit 141 Testdateien und 1584 Tests. Hidden-Info-, LegalAction-, Replay-, StateHash-, Randomness- und `applyAction`-Verträge bleiben unverändert. Bericht: `docs/reviews/ai/ai-coverage-direct-action-score-gate-2026-06-23.md`.
