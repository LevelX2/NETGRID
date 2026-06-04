# AI040 Action Cost and Timing Profiles

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: read-only Normalisierung von Kosten und Timing

## Kurzfazit

AI040 füllt `ActionCostProfile` und `ActionTimingProfile` aus vorhandenen LegalAction-Daten. Kosten kommen aus `LegalAction.costs` und bekannten primitiven Payload-Kostenfeldern. Timing kommt aus `LegalAction.timingPoint` und breiten ActionType-Fenstern wie Rez-, Score-, Access- oder Response-Window.

Es gibt keine Kostenbewertung, keine Action-Priorisierung, kein Ranking, keine Planner-Gewichtung und keine Runtime-Wirkung.

## CostProfile

Gefüllt werden, soweit side-safe vorhanden:

- `clickCost`
- `creditCost`
- `trashCost`
- `agendaPointCost`
- `xValue`
- `paidBy`
- `beneficiary`
- `costKnownStatus`
- `variableCost`
- `additionalCosts`

Self-damage, self-tag, discard und forfeit bleiben schema-seitig vorhanden, werden aber nicht geraten.

## TimingProfile

Gefüllt werden:

- `phase`
- `turnSide`
- `window`
- `runPhase`
- `encounterPhase`
- `accessPhase`
- `scoreWindow`
- `rezWindow`
- `responseWindow`

Der Builder rekonstruiert keine detaillierte Boardstate- oder Run-Historie.

## Keine Wirkung

AI040 erzeugt keine Legalität, wählt keine Aktion, scored keine Aktion, bewertet keine Kosten und verändert keine Runtime-Entscheidung.

Alle No-Effect-Flags bleiben `false`.

## Verifikation

| Befehl | Ergebnis |
| --- | --- |
| `node scripts/check-ai040-action-cost-timing-profiles.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `corepack pnpm --filter @netgrid/ai test` | passed |
| `node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs` | passed |
| `node scripts/check-ai031-033-tactic-signal-taxonomy-finalization.mjs` | passed |
| `git diff --check` | passed |

## Nächster Step

`AI041 Action-to-Card-Semantic Join`.
