# MVP 0.94 Implementation Review

Status: bestanden
Stand: 2026-05-04

## Ergebnis

`implementation_review_passed: true`

`ready_for_hardening: true`

V0.94 ist als enger Damage-/Flatline-Slice umgesetzt. Die Implementierung erweitert V0.93 additiv und macht keine V0.95+-Mechanik spielbar.

## Umgesetzter Scope

- Shared-Typen für `DamageType` und `GameEndReason`.
- Side-sicherer `gameEndReason` in `GameState`, PlayerViews, Multiplayer Result Summaries und Web-UI-Resulttext.
- Engine-Damage-Pfad für `net` und `meat`.
- `core` ist typisiert vorbereitet, wird aber zur Laufzeit abgelehnt.
- `do_damage` als Subroutine- und EffectCommand-Anschluss an den V0.93-Effect-Vertrag.
- Lokale fiktive Harness-Karte `v094_neural_sentry_ice` mit Net-Damage plus End-the-Run.
- Flatline bei `amount > runner.grip.length` ohne zusätzliche Zufallsauswahl.
- Random Grip-Trash ohne Replacement ueber Seed, RandomCounter und RandomDrawRecords.
- Damage-Events als `hidden_info_barrier` mit redigierter PublicPayload.
- Undo-Barriere nach erfolgreicher Damage-Auflösung.
- AI- und Multiplayer-Smokes fuer side-sichere Damage- und Flatline-Pfade.

## Zentrale Entscheidungen

| Thema | Entscheidung |
|---|---|
| Damage-Quelle | V0.94 nutzt einen internen `doDamage`-Helfer, der nur ueber Engine-Resolver/Subroutine oder EffectCommand erreichbar ist. |
| Testkarte | `v094_neural_sentry_ice` ist lokal/fiktiv, manifestiert und testgedeckt. Sie aktiviert keine offiziellen Karten, Artworks, Frames, Card Backs oder externen Datenquellen. |
| Core Damage | `core` bleibt nicht spielbar und wirft beim EffectCommand-Pfad eine klare Engine-Fehlermeldung. |
| Flatline | Flatline wird vor Random-Auswahl erkannt, wenn die Damage-Menge groesser als die Grip-Groesse ist. Dadurch entsteht kein Zusatzleak. |
| Sichtbarkeit | Der oeffentliche Event enthaelt nur Damage-Typ, Menge, Quelle, getrashte Anzahl und Flatline-Boolean. Kartentitel oder Grip-Reihenfolgen bleiben ausserhalb oeffentlicher Payloads. |
| Heap | Nach ueberlebtem Damage sind getrashte Karten im Runner-Heap gemaess bestehendem Sichtbarkeitsvertrag sichtbar. |
| Replay/StateHash | Damage-Auswahl wird ueber RandomDrawRecords reproduziert; Replay reproduziert den finalen StateHash. |

## Hidden-Info Review

- PublicEvents fuer Damage tragen `visibilityClass: "hidden_info_barrier"`.
- `publicPayload` enthaelt keine DefinitionIds, Kartentitel, Grip-Listen oder nicht ausgewaehlte Grip-Karten.
- Corp PlayerView, Reconnect-Payload und Multiplayer-OpponentPayload zeigen nur Runner-Discard-Zaehlung bzw. oeffentliche Heap-Folgen.
- AI-Inputs bleiben auf PlayerView, LegalActions und side-sichere Fakten beschraenkt.
- Undo ueber Damage hinweg wird serverseitig geblockt.

## No-Scope Review

Nicht implementiert und nicht freigeschaltet:

- Core-Damage-Handlimit/Counters.
- Damage-Prevention, Avoid, Interrupt und Replacement.
- Resources und Resource-Trash.
- Trace, Link und Bidding.
- Mulligan.
- Jack-out, Breach und Multiaccess.
- Identity-Abilities.
- Hosting, Viren, Purge, Counterfamilien, Recurring Credits und Bad Publicity.

## Targeted Checks

- `corepack pnpm --filter @netgrid/shared typecheck`: pass.
- `corepack pnpm --filter @netgrid/engine test -- --run`: pass, 32 Tests.
- `corepack pnpm --filter @netgrid/ai test -- --run`: pass, 17 Tests.
- `corepack pnpm --filter @netgrid/server test -- --run`: pass, 16 Tests.

Root- und Finalchecks werden im Final Review dokumentiert.
