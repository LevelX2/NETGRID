# AI035 ActionSemanticCandidate Schema

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: TypeScript-Schema im AI-Paket, keine Runtime-Verbrauchsstelle

## Kurzfazit

AI035 legt mit `packages/ai/src/action-semantic-candidate.ts` die stabile read-only Form für spätere Action-Projektionen an. Das Schema enthält Action-, Source-, Ability-, Semantik-, Cost-, Timing-, Target-, Board-, Confidence-, Gate- und Evidence-Felder sowie die geforderten Felder `primaryProjectionStatus` und `projectionIssues`.

Es gibt keine produktive KI-Wirkung: Die neue Datei wird nicht von `packages/ai/src/index.ts`, `runner-plans.ts`, `corp-plans.ts`, DTO-Code, Engine-Code oder Shared-Code importiert.

## Schema-Kern

`ActionSemanticCandidate` enthält:

- `actionId`, `actionType`, `actorSide`, optional `actorId` und `observerSide`
- `visibilityScope`
- `legalActionRef` mit `originalPayloadKeys` und optionalem `payloadHash`
- `sourceKind`, optional `sourceCardId`, optional `abilityId`, `abilityBindingMethod`
- `semanticActionType`
- `cardContextSignals`, `actionTacticSignals`, `strategySupport`
- `conditions`, `risks`, `constraints`
- `costProfile`, `timingProfile`, optional `targetContext`
- `boardContext`
- `confidence`
- `primaryProjectionStatus`
- `projectionIssues`
- `hardGates`
- `evidence`

## Status- und Issue-Policy

`primaryProjectionStatus` erlaubt:

```text
projected, neutral_projected, partial_projected, blocked, schema_gap, hidden_info_blocked
```

`projectionIssues` erlaubt:

```text
source_unresolved, ability_unresolved, target_context_unavailable,
hidden_info_blocked, cost_unknown, timing_unknown, card_semantics_unavailable
```

`unknown` bleibt in der Bridge-Phase reportbar und blockt nicht automatisch. `block` bleibt echten Hidden-Info-, Runtime-, Legalitäts- oder Sicherheitsproblemen vorbehalten.

## Gates

`ActionGateResult` enthält `gateId`, `status`, `severity`, optionale `reason` und optionale `evidence`.

Die Gate-IDs sind:

```text
engine_legal_action, side_visibility, hidden_info, source_resolution,
ability_resolution, target_context, cost_known, timing_known, runtime_no_effect
```

## Keine Wirkung

AI035 definiert nur Typen und ein Schema-Version-Konstantenfeld. Es gibt:

- keine Legalitätserzeugung
- keine Action-Auswahl
- kein Scoring
- keine Planner- oder Runtime-Anbindung
- keine Hidden-Info-Projektion
- keine Änderung an Engine, Shared, DTO oder UI

Alle No-Effect-Flags bleiben `false`.

## Verifikation

| Befehl | Ergebnis |
| --- | --- |
| `node scripts/check-ai035-action-semantic-candidate-schema.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `corepack pnpm --filter @netgrid/ai test` | passed |
| `node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs` | passed |
| `node scripts/check-ai031-033-tactic-signal-taxonomy-finalization.mjs` | passed |
| `git diff --check` | passed |

## Nächster Step

`AI036 Neutral LegalAction Projection`.
