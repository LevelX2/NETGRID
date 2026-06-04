# AI050 Hard-Gate and Rollback Readiness Review

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: Readiness Review, kein Cutover

## Kurzfazit

AI050 bewertet die AI047-AI049-Ergebnisse. Das Ergebnis ist bewusst zweigeteilt:

```text
broaderShadowSimulationReadiness: ready_with_constraints
productiveCutoverReadiness: blocked
recommendedNextStep: broader_shadow_simulation
```

Das heißt: Breitere Shadow-Simulationen sind als nächster Diagnose-Schnitt sinnvoll. Produktiver Cutover ist nicht freigegeben.

## Blockierte Cutover-Gates

| Gate | Grund |
| --- | --- |
| `target_context` | `target_context_unavailable` bleibt Top-Gap |
| `ability_resolution` | `ability_unresolved` bleibt Top-Gap |
| `card_semantics` | `card_semantics_unavailable` bleibt Top-Gap |
| `runtime_feature_flag` | Es gibt bewusst noch keine Runtime-Flags oder Rollback-Selectoren |

## Rollback-Regeln

- Legacy bleibt die einzige ausgeführte Entscheidung während Shadow Mode.
- Hidden-Info-Verstöße blockieren semantische Ausgabe und verlangen Fixture-Review.
- Illegale semantische Referenzen blockieren Cutover und verlangen LegalAction-Trace-Review.
- Unresolved required Gates halten Candidates in `blocked_by_gap` oder `blocked_by_gate`.
- Alle späteren produktiven Flags müssen default-off und ohne Migration reversibel sein.

## Spätere Feature-Flag-Kandidaten

Alle Flag-Kandidaten sind nur dokumentiert und bleiben `off`:

- `semanticAi.shadowReport`
- `semanticAi.shadowRanking`
- `semanticAi.compareLegacy`
- `semanticAi.cutover.basicActions`

## Grenzen

Es gibt keine produktive Action-Auswahl, keine semantische Ausführung, kein Live-Scoring, keine produktive Rangfolge, keine Planner-Gewichte, keine Runtime-Anbindung, keine Engine- oder Legalitätsänderung, keine Hidden-Info-Projektion und keinen Feature-Flag-Cutover.

## Verifikation

| Befehl | Erwartung |
| --- | --- |
| `node scripts/check-ai050-hard-gate-rollback-readiness-review.mjs` | Readiness, Blocker, Rollback und No-Effect-Gates gültig |
| `corepack pnpm --filter @netgrid/ai test -- shadow-scoring-diagnostics.test.ts` | Diagnostiktests grün |
