# AI037 Basic Action Semantics

Datum: 2026-06-04
Primärer Agent: `release-implementation-agent`
Status: `done`
Scope: ActionType-nahe Basic-/System- und Broad-Intent-Klassifikation, keine Card-Hints

## Kurzfazit

AI037 klassifiziert Basic-, Game-Rule-, Choice- und einige eindeutige ActionType-nahe Broad-Intent-Familien direkt im read-only Builder. Die Klassifikation nutzt nur die bereits vorhandene `LegalAction.type`- und `LegalAction.source`-Oberfläche. Sie importiert keine Card-Hints, keine Inspector-Daten, keine Kartentexte und keine Planner-Module.

Die bestehende KI importiert den Builder weiterhin nicht. Es gibt keine Action-Auswahl, kein Scoring und keine Runtime-Wirkung.

## Klassifizierte Kernfamilien

Kontrolliert klassifiziert sind:

- Economy: `gain_credit` -> `economy.gain_credit`
- Draw: `draw_card` -> `draw.card`, `mandatory_draw` -> `draw.mandatory`
- Run: `start_run`, `continue_run`, `jack_out`
- Access: `access_card`, `steal_agenda`, `trash_accessed_card`, `decline_trash`
- Corp window: `rez_ice`, `decline_rez`
- Turn flow: `end_turn`, `forgo_action`
- Tag/Counters: `remove_tag`, `purge_virus_counters`, `purge_runner_virus_counters`
- Choice: `resolve_choice`

`trash_accessed_card`, `rez_ice` und `resolve_choice` bleiben `partial_projected`, weil konkrete Ziel-/Choice-Kontexte erst AI039 side-safe projiziert.

## Weitere Pflichtfamilien

`install_card`, `play_event`, `play_operation`, `advance_card`, `score_agenda`, `pump_breaker`, `break_subroutine`, `activated_card_ability`, `trigger_ability` und Spezialzonen-Actions bekommen nur breite ActionType-nahe Semantik.

Nicht geraten werden:

- konkrete Runner-Install-Subtypen wie Program, Hardware oder Resource
- konkrete Corp-Install-Ziele wie ICE oder Remote-Root
- Prep-vs-Event-Subtypen jenseits von `play_event`
- konkrete Ability-Bedeutung bei Card-Ability- und Breaker-Actions
- TargetProfile-Relevanz ohne konkrete legale Zieloptionen

Pay-/Boost-Trace, Damage-Prevention und Cleanup-Discard liegen aktuell nicht als eigene `ActionType`s im Inventar vor und bleiben Report-Gaps.

## Gate-Verhalten

Wenn `LegalAction.source` `basic_action`, `game_rule` oder eine Choice-Aktion ist, wird `source_resolution` als `pass` beziehungsweise `choice` gesetzt. Card-Source-Bindung bleibt bewusst bei `unknown` bis AI038. Ability-Bindung bleibt für Basic-/Game-Rule-/Choice-Actions `not_applicable`; für Card-/Breaker-Actions bleibt sie unresolved.

## Keine Wirkung

AI037 verändert keine Engine, kein Shared-DTO, keine Legalität, keinen Planner, keine Scoring-Funktion, keine Action-Auswahl, keine UI-Derivation und keine Hidden-Info-Projektion.

Alle No-Effect-Flags bleiben `false`.

## Verifikation

| Befehl | Ergebnis |
| --- | --- |
| `node scripts/check-ai037-basic-action-semantics.mjs` | passed |
| `corepack pnpm --filter @netgrid/ai typecheck` | passed |
| `corepack pnpm --filter @netgrid/ai test` | passed |
| `node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs` | passed |
| `node scripts/check-ai031-033-tactic-signal-taxonomy-finalization.mjs` | passed |
| `git diff --check` | passed |

## Nächster Step

`AI038 Card Action Source Binding`.
