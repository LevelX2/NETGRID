# META 1 DeckDoctrine + Multi-Turn TacticalGoal Engine v0

Stand: 2026-06-04
Status: complete

## Ziel

META 1 legt den semantischen KI-Kern an, ohne Action-Auswahl zu aktivieren:

- `DeckStrategicProfile`
- `StrategyHypothesis`
- `SupportPackage`
- `DeckDoctrine`
- `DoctrinePivotRule`
- `TacticalGoalState`

## Ergebnis

Der neue Code liegt in `packages/ai/src/semantic-ai-core-meta.ts`. Die Tests liegen in `packages/ai/src/semantic-ai-core-meta.test.ts`.

Die wichtigsten Regeln sind abgebildet:

- `NeutralDoctrine` bleibt neutral, wenn keine echten StrategySupportPairs oder Anchor-Evidence vorhanden sind.
- SupportPackages werden sichtbar, aber nicht automatisch zur Primary Strategy erhoben.
- Boardstate-Pivot-Regeln können Doctrine-Präferenzen überstimmen.
- Tactical Goals sind mehrzügige `TacticalGoalState`-Instanzen mit Lifecycle, Priority, Urgency, TTL, Progress, Blockers, Success- und Failure-Kriterien.

## Quality Gates

| Gate | Ergebnis |
| --- | --- |
| DeckStrategicProfile-Schema existiert | pass |
| DeckDoctrine-Schema existiert | pass |
| TacticalGoalState-Schema existiert | pass |
| NeutralDoctrine-Regel implementiert/reportet | pass |
| Boardstate-Pivot-Regeln existieren | pass |
| Mehrzügige Goals haben lifecycle/status/progress/blocker | pass |
| Keine produktive Action-Auswahl | pass |
| Keine Planner-Gewichte | pass |
| Keine Runtime-Consumer | pass |
| Keine Hidden-Info-Projektion | pass |

## Metriken

| Metric | Wert |
| --- | ---: |
| Runner Goal Families | 13 |
| Korp Goal Families | 11 |
| Boardstate Pivot Rules | 8 |
| Boardstate Override Examples | 4 |
| Illegal semantic decisions | 0 |
| Hidden-info violations | 0 |
| Runtime consumers | 0 |
| Action selections | 0 |
| Planner-weight changes | 0 |

## Verifikation

```text
node scripts/check-meta1-deck-doctrine-tactical-goal-engine-v0.mjs
corepack pnpm --filter @netgrid/ai test -- semantic-ai-core-meta.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Nächster Schritt

META 2 kann auf META 1 aufbauen und aus Doctrine, GoalStates und `ActionSemanticCandidate`-ähnlichen Fixtures einen erklärbaren, weiterhin nicht-produktiven Semantic Decision Core ableiten.
