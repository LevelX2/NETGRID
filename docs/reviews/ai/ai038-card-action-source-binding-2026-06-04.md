# AI038 Card Action Source Binding

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: side-safe Source-/Ability-Bindung aus vorhandenen LegalAction-Daten

## Kurzfazit

AI038 bindet Card-Actions an `sourceCardId` und, wenn eindeutig vorhanden, an `abilityId`. Die Bindung nutzt nur:

- `abilityRef.sourceCardInstanceId`
- `LegalAction.source`
- `abilityRef.abilityId`
- `payload.abilityId`
- optionale `sideSafeAbilityBindings`, die genau eine Fähigkeit für eine konkrete Action liefern

Es gibt keine Card-Hint-, Kartentext-, Full-State-, Hidden-Zone- oder Gegner-Privatdaten-Inferenz. `cardImplementationAbilityIndex` allein wird nicht als stabile `abilityId` genutzt.

## Binding-Methoden

| Methode | Nutzung |
| --- | --- |
| `explicit_ability_id` | `abilityRef.abilityId` ist vorhanden. |
| `engine_payload` | `payload.abilityId` ist vorhanden. |
| `single_legal_ability_inferred` | Nur bei genau einem explizit übergebenen side-safe Binding für diese Action und Source. |
| `unresolved` | Keine eindeutige Ability-ID verfügbar. |

Multi-Ability-Karten ohne eindeutige ID bleiben `ability_unresolved`.

## Gate-Verhalten

Wenn ein `sourceCardId` aus LegalAction/AbilityRef ableitbar ist, wird `source_resolution` auf `pass` gesetzt. Wenn eine Ability-Methode eine ID liefert, wird `ability_resolution` auf `pass` gesetzt. Für ActionTypes ohne Ability-Bedarf bleibt `ability_resolution` `not_applicable`.

## Keine Wirkung

AI038 verändert keine Engine, kein Shared-DTO, keine Legalität, keinen Planner, keine Scoring-Funktion, keine Action-Auswahl, keine UI-Derivation und keine Hidden-Info-Projektion.

Alle No-Effect-Flags bleiben `false`.

## Verifikation

| Befehl | Ergebnis |
| --- | --- |
| `node scripts/check-ai038-card-action-source-binding.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `corepack pnpm --filter @netgrid/ai test` | passed |
| `node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs` | passed |
| `node scripts/check-ai031-033-tactic-signal-taxonomy-finalization.mjs` | passed |
| `git diff --check` | passed |

## Nächster Step

`AI039 TargetContext Projection`.
