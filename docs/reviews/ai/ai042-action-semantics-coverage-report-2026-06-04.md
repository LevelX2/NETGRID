# AI042 Action Semantics Coverage Report

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: Coverage- und Gate-Report über die dokumentierten Bridge-Fixtures

## Kurzfazit

AI042 konsolidiert die Coverage aus AI036 bis AI041. Für den dokumentierten 32-`LegalAction`-Korpus gilt:

```text
totalLegalActions: 32
neutralProjected: 32
neutralProjectionCoveragePercent: 100
```

Diese 100%-Aussage gilt nur für den dokumentierten Korpus und die technische Eigenschaft, dass der Builder jede übergebene LegalAction neutral repräsentiert. Sie ist keine Aussage über alle theoretischen Spielzustände.

## Gate-Ergebnis

| Gate | Ergebnis |
| --- | --- |
| Neutral Projection | 32/32 |
| Hidden-Info-Leaks | 0 |
| Runtime-Verhaltensänderungen | 0 |
| Action-Selection-Änderungen | 0 |
| Nicht-Engine-Legalitätsannahmen | 0 |
| Planner-Consumer | 0 |
| Scoring-Consumer | 0 |

Der AI039-Fall mit `hidden_info_blocked` ist kein Leak: Die Ziel-ID wird gerade nicht projiziert.

## Coverage-Metriken

- `sourceResolved`: 32
- `abilityResolved`: 3 in den AI038/AI041-Subfixtures
- `targetContextProjected`: 2 in der AI039-Subfixture
- `costProfileProjected`: 32
- `timingProfileProjected`: 32
- `cardSemanticJoined`: 3 in der AI041-Subfixture
- `unknownActions`: 0

## Top-Gaps

- `target_context_unavailable`: konkrete Zieloptionen fehlen, wenn die Engine sie nicht side-safe übergibt.
- `ability_unresolved`: Card-/Breaker-Actions ohne `abilityRef`, `payload.abilityId` oder side-safe Single-Ability-Binding bleiben unresolved.
- `card_semantics_unavailable`: CardSemanticProfiles werden nur explizit übergeben, nicht automatisch importiert.

## Keine Wirkung

AI042 ergänzt nur Report und Check. Es gibt keine Legalitätserzeugung, keine Action-Auswahl, kein Scoring, keine Planner- oder Runtime-Anbindung und keine Hidden-Info-Projektion.

Alle No-Effect-Flags bleiben `false`.

## Verifikation

| Befehl | Ergebnis |
| --- | --- |
| `node scripts/check-ai042-action-semantics-coverage-report.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai test` | passed |
| `node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs` | passed |
| `node scripts/check-ai031-033-tactic-signal-taxonomy-finalization.mjs` | passed |
| `git diff --check` | passed |

## Nächster Step

`AI043 Diagnostic Doctrine/Goal Bridge Handoff`.
