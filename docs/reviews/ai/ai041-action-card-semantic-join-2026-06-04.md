# AI041 Action-to-Card-Semantic Join

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: optionaler read-only Join mit übergebenen CardSemanticProfiles

## Kurzfazit

AI041 ergänzt einen optionalen Join über `cardSemanticProfilesByCardId`. Der Builder importiert keine Hint-Dateien, keinen Inspector-Index und keine Kartendaten. Profile müssen explizit und side-safe übergeben werden.

Card-Level-`tacticSignals` werden nur als `cardContextSignals` übernommen. `actionTacticSignals` entstehen ausschließlich aus `abilitySemantics`, wenn eine `abilityId` explizit oder über `single_legal_ability_inferred` side-safe gebunden ist.

## Join-Regeln

| Fall | Ergebnis |
| --- | --- |
| Single-Ability mit side-safe Binding | Card-Kontext plus ability-nahe `actionTacticSignals` |
| Multi-Ability mit `abilityId` | Card-Kontext plus passende ability-nahe `actionTacticSignals` |
| Multi-Ability ohne `abilityId` | nur `cardContextSignals`, Issue `ability_unresolved` |
| Fehlendes CardSemanticProfile | Issue `card_semantics_unavailable` |

`TargetProfileMatches` werden nur in einen bereits vorhandenen `TargetContext` kopiert. Es findet keine Zielbewertung und keine Zielauswahl statt.

## Keine Wirkung

AI041 erzeugt keine Legalität, wählt keine Aktion, scored keine Aktion, bewertet keine Ziele und verändert keine Runtime-Entscheidung.

Alle No-Effect-Flags bleiben `false`.

## Verifikation

| Befehl | Ergebnis |
| --- | --- |
| `node scripts/check-ai041-action-card-semantic-join.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `corepack pnpm --filter @netgrid/ai test` | passed |
| `node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs` | passed |
| `node scripts/check-ai031-033-tactic-signal-taxonomy-finalization.mjs` | passed |
| `git diff --check` | passed |

## Nächster Step

`AI042 Action Semantics Coverage Report`.
