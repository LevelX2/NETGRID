---
activityId: act-2026-06-23-ai-coverage-direct-action-score-gate
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

Noch offen.
