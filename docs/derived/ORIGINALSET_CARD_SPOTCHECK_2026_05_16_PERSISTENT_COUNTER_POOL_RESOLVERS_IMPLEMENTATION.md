# Originalset-Spotcheck 2026-05-16 Persistent Counter/Pool Resolvers Implementation

Quelle: `docs/derived/originalset-spotcheck-jobs/inbox/spotcheck-2026-05-16-persistent-counter-pool-resolvers.md`

Jobstatus: `done`; die aus dem blockierten Trace-Cache-Ambush-Sammeljob herausgezogenen Counter-, Purge- und Trace-Pool-Resolver sind umgesetzt und grün geprüft.

## Umgesetzter Scope

| Karte | Card ID | Ergebnis |
|---|---|---|
| Code Viral Cache | `onr_v1_155_code-viral-cache` | Installation ist an einen erfolgreichen HQ-Run im selben Zug gebunden. Corp-Purge öffnet eine Runner-Choice, die bis zu zwei Virus-/Pox-Counter erhält. Die Korp kann die installierte Resource mit einer source-bound Action für 5 Credits trashen. |
| Cerberus | `onr_v1_227_cerberus` | Trace-Erfolg legt einen öffentlichen Cerberus-Counter auf den Runner-Identitätsstatus. Start jedes Runs verursacht 2 Net Damage pro Counter; Runner-Removal kostet 1 Click und 4 Credits. |
| Paris City Grid | `onr_v1_365_paris-city-grid` | Rezzed Paris City Grid erhält sechs Bits, die nur für Traces während Runs auf dem geschützten Fort ausgegeben werden. Verbrauch und Refresh zum Korp-Zugstart sind public-payloadfähig und replay-stabil. |

## Nachgezogene Artefakte

- Shared-Kartentexte, Mechanics-Tags, TraceState-Typen und PublicPayload-Schema wurden an die finalen Verträge angepasst.
- V1.9.13-, V1.9.15- und V1.9.18-Manifeste sowie AI-Hints/AI-Approval-Refs wurden synchronisiert.
- Der alte Trace-2-Tag-Aktionsstub von Paris City Grid wurde entfernt.
- Code Viral Cache wurde aus dem generischen Damage-Prevention-Profil entfernt.

## Regressionen

- Code Viral Cache: HQ-Run-Gate, Purge-Replacement-Choice, Counter-Erhalt und Korp-Trash-Aktion.
- Cerberus: 3 Net Damage ohne falschen Tag, Trace-Erfolg mit Counter, Runner-Removal und Run-Start-Damage inklusive Replay/StateHash.
- Paris City Grid: servergebundener Trace-Pool, Pool-first-Payment, falscher Server/Stale-Trace-Barriere durch source-bound TraceState und Corp-Turnstart-Refresh.

## Checks

- `corepack pnpm --filter @netgrid/engine test` - grün, 464 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 17 Dateien / 133 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 48 Tests.
- `corepack pnpm --filter @netgrid/ai test` - grün, 119 Tests.
- `corepack pnpm typecheck` - grün.

## Ergebnis

Die drei Removal Conditions aus `spotcheck-2026-05-15-trace-cache-ambush` sind in diesem Follow-up erledigt. Der ursprüngliche Sammeljob bleibt nur noch für `Signpost` und `The Springboard` blockiert.
