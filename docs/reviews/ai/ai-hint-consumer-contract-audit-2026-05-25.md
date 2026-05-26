# AI-Hint-Verbrauchervertrag Audit

Datum: 2026-05-25

## Kurzfazit

Das Hint-System ist als Verbrauchervertrag nur teilweise explizit. Die KI liest aktuell `roles`, `planRoles` und `aiSupportStatus` stabil ein; entscheidungswirksam sind vor allem Rollen/Planrollen, die entweder direkt im Planer abgefragt werden oder über `deck-doctrine.ts` in Archetype-Tags und PlanWeights eingehen. `valueHints`, `riskTags`, `requiredMechanics` und `scenarioRefs` sind im aktuellen KI-Verbrauch überwiegend Dokumentation, Support-/Review-Material oder Test-/Gate-Kontext.

Der wichtigste Befund: `roles` und `planRoles` sind technisch nicht scharf getrennt. In `deck-doctrine.ts`, `corp-plans.ts`, `runner-plans.ts` und `index.ts` werden beide Felder zu einem gemeinsamen Rollenset zusammengeführt. Dadurch können Planrollen wie `build_rig`, `protect_hq`, `score_now` oder `pressure_rnd` direkt wie Rollen wirken. Das ist rückwärtskompatibel praktisch, aber als Ontologie unscharf.

Es gibt 410 aktive Hints, alle mit `aiSupportStatus = ai_supported`. Alle Hints enthalten Rollen und Planrollen. Das System ist breit befüllt, aber es gibt viele seltene, dokumentarische oder nur substring-wirksame Rollen. Für die zuletzt gebauten KI-Slices fehlen strukturierte Effektfelder, besonders für scored-agenda abilities, Future-Run-/Future-Encounter-Effekte, Remote-Portfolio-Rollen, Tag/Punish-Funnel und Breaker-Kostenprofile.

## Dateninventar

Quellen:

- `data/ai/ai-card-hints-active.json`
- `data/ai/card-role-manifest-0.9.json`
- `data/ai/ai-profiles-0.9.json`
- `data/ai/corp-plan-profiles-1.4.0.json`
- `data/ai/runner-plan-profiles-1.4.1.json`
- `data/ai/deck-role-profiles-0.9.json`
- `packages/ai/src/ai-hints.ts`
- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/corp-plans.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/index.ts`

Vollständiges maschinelles Inventar mit allen Rollen, Planrollen, Häufigkeiten, bis zu fünf Beispielen pro Wert, Code-Referenzindikator und heuristischer Verbrauchsklassifikation:

- `docs/reviews/ai/ai-hint-consumer-contract-inventory-2026-05-25.json`

Aktive Hint-Felder:

| Feld                | Häufigkeit | Aktueller Verbraucherstatus                                                       |
| ------------------- | ---------: | --------------------------------------------------------------------------------- |
| `cardId`            |        410 | Schlüssel, direkt genutzt                                                         |
| `side`              |        410 | geladen, side-Konsistenz/Inventar                                                 |
| `cardType`          |        410 | Dateninventar; Planer nutzt primär Runtime-/VisibleCard-Typ                       |
| `roles`             |        410 | direkt und indirekt entscheidungswirksam                                          |
| `planRoles`         |        410 | direkt und indirekt entscheidungswirksam, weil in Rollenset gemischt              |
| `requiredMechanics` |        410 | Support-/Review-Kontext, nicht als Planwert genutzt                               |
| `valueHints`        |        410 | aktuell weitgehend dokumentarisch; keine breite direkte Score-Auswertung gefunden |
| `riskTags`          |        410 | aktuell weitgehend dokumentarisch; nicht als Plan-Risk-Modell genutzt             |
| `aiSupportStatus`   |        410 | `isAiSupportedCard`-Gate; alle aktiven Hints sind `ai_supported`                  |
| `scenarioRefs`      |        410 | Review-/Fixture-Kontext, nicht entscheidungswirksam                               |

`aiSupportStatus`:

- `ai_supported`: 410
- `scenario_ready`: 0
- `hinted_only`: 0
- `none`: 0

Verteilung nach Seite und Typ:

- Corp: 207, Runner: 203
- Identity: 2, Program: 81, Hardware: 32, Event: 49, Resource: 40
- Agenda: 36, ICE: 68, Operation: 32, Asset: 43, Upgrade: 27

## Verbrauchspfade

### `ai-hints.ts`

`createAiHintsByCard()` lädt `ai-card-hints-active.json` als `Map<cardId, AiCardHint>`. Der Type enthält nur `roles`, `planRoles`, `aiSupportStatus` und optional `valueHints`. `requiredMechanics`, `riskTags` und `scenarioRefs` sind in der JSON vorhanden, aber nicht im exportierten `AiCardHint`-Typ modelliert. Das reduziert den expliziten Verbrauchervertrag auf Rollen, Planrollen und Supportstatus.

### `deck-doctrine.ts`

`rolesForCard()` kombiniert:

- `card-role-manifest-0.9.json` Rollen
- aktive Hint-`roles`
- aktive Hint-`planRoles`
- runtime-inferred Rollen aus Side, Type, Subtype und ETR-Subroutinen

Diese Rollen treiben:

- `roleCounts`
- `missingRoles`
- Corp-/Runner-`archetypeTags`
- `planWeights`
- Mulligan-/Risk-Evidence
- Confidence/Evidence

Direkt wichtige Doctrine-Rollen:

- Corp: `agenda`, `corp_score_agenda`, `score_agenda`, `agenda_2pt`, `agenda_3pt`, `corp_install_ice`, `corp_rez_ice`, `taxing_ice`, `etr_ice`, `economy_operation`, `economy_asset`, `draw_operation`, `tag_ice`, `tag_punishment`, `trace`, `trace_ice`, `asset_trash_target`, `upgrade`, `remote_support`, `ambush`, `central_defense`, `barrier_ice`, `code_gate_ice`, `sentry_ice`
- Runner: `setup_runner`, `setup_hardware`, `runner_program`, `memory`, `breaker_fracter`, `breaker_decoder`, `breaker_killer`, `run_pressure`, `pressure_rnd`, `pressure_hq`, `multiaccess`, `remote_contest`, `trash_support`, `tag_clear`, `link`, `tag_resilient`, `economy`, `draw`

### `runner-plans.ts`

Runner-Planung nutzt Rollen direkt für:

- Breaker-Coverage: `breaker_` Prefix, besonders `breaker_fracter`, `breaker_decoder`, `breaker_killer`, plus `breaker_generic`
- Setup/Rig: `build_rig`, `setup`, `memory`, `memory_support`, `runner_program`
- Economy: `economy`, `tempo`, Rollen mit `economy`
- Search/Recovery: Rollen mit `search`, `tutor`, `recovery`, `trash_recovery`
- Pressure: `run_pressure`, `pressure_rnd`, `pressure_hq`, `archives_pressure`, `multiaccess`, `interface`
- Remote-Trash-/Access-Bewertung: `agenda_steal_tax`, `remote_upgrade_tax`, `access_tax`, `remote_capacity`, `economy`, `ambush`, `trap`, `low_value`
- Duplicate-/Install-Priorität: `efficient_breaker`, `flex_breaker`, `breaker_`, `memory`

### `corp-plans.ts`

Corp-Planung nutzt Rollen direkt für:

- Agenda-/Score-Aktionen: `agenda`, `corp_score_agenda`, `score_agenda`, `agenda_`
- ICE-/Protection: `corp_install_ice`, `corp_rez_ice`, `etr_ice`, `barrier_ice`, `code_gate_ice`, `sentry_ice`, `taxing_ice`, `ice`
- Remote-Safety und Root-Auswahl: `remote_support`, `remote_upgrade_tax`, `protect_remote`, `scoring_remote_support`, `remote_capacity`, `ambush`, `bait_runner`, `economy_asset`, `asset_trash_target`
- Economy: `economy_operation`, `economy_asset`, Rollen mit `economy`, scored-agenda classification über sichtbare Score-Area-Aktion
- Tag/Punish: `tag_punishment`, `tag_ice`, `tag_source`, `tag_enabler`, `trace`, `trace_ice`, `trace_tag`
- Plan-Signale: `protect_hq`, `protect_rnd`, `build_scoring_remote`, `score_now`, `score_next_turn`, `remote_scoring_build`-nahe Rollen über PlanCandidates und Strategic Lines

Scored-agenda activated abilities werden inzwischen nicht primär über Hint-Rollen, sondern durch sichtbare Action-/Text-/Payload-Auswertung klassifiziert:

- `scored_agenda_economy`
- `scored_agenda_counter_economy`
- `scored_agenda_draw`
- `scored_agenda_extra_action`
- `scored_agenda_trace_tag`
- `scored_agenda_damage_punish`
- `scored_agenda_shuffle_draw`
- `scored_agenda_utility`

Das ist funktional, zeigt aber eine Ontologie-Lücke: Diese Fähigkeitstypen existieren als Diagnose-/Assessment-Kategorien, nicht als strukturierte Hint-Effekte.

### `index.ts`

Die Baseline-/Simulationsebene nutzt dieselbe Rollen-Mischung für:

- Discard- und install-basierte Baseline-Scores
- Run-/Pressure-Erkennung
- Breaker-/Memory-/Economy-Installwerte
- Remote-Trash-Rollenklassifikation
- Tag/Punish-Diagnosemetriken
- R&D-/HQ-/Remote-Pressure- und Phase-Exit-Diagnose

## Rollenklassifikation

### A. Direkt entscheidungswirksam

Diese Rollen/Patterns werden explizit abgefragt oder lösen direkte Score-/Plan-/Metrikpfade aus:

- Breaker: `breaker_`, `breaker_fracter`, `breaker_decoder`, `breaker_killer`, `breaker_generic`, `efficient_breaker`, `flex_breaker`
- Runner pressure: `run_pressure`, `pressure_rnd`, `rnd_pressure`, `pressure_hq`, `hq_pressure`, `archives_pressure`, `multiaccess`, `interface`
- Runner setup/economy: `memory`, `memory_support`, `build_rig`, `setup`, `economy`, `tempo`, Rollen mit `search`, `tutor`, `recovery`
- Corp agenda/score: `agenda`, `corp_score_agenda`, `score_agenda`, `agenda_`
- Corp ICE/protection: `corp_install_ice`, `corp_rez_ice`, `etr_ice`, `barrier_ice`, `code_gate_ice`, `sentry_ice`, `taxing_ice`
- Corp economy: `economy_operation`, `economy_asset`, `draw_operation`, Rollen mit `economy`
- Remote/trash: `remote_support`, `protect_remote`, `remote_agenda_protection`, `remote_upgrade_tax`, `agenda_steal_tax`, `access_tax`, `remote_capacity`, `asset_trash_target`, `ambush`, `trap`, `low_value`
- Tag/Punish: `tag_punishment`, `tag_ice`, `tag_source`, `tag_enabler`, `trace`, `trace_ice`, `trace_tag`, `damage_operation`
- Strategic-line-nahe Planrollen: `build_scoring_remote`, `score_now`, `score_next_turn`, `protect_hq`, `protect_rnd`, `recover_economy`, `contest_remote`, `bait_runner`

### B. Indirekt entscheidungswirksam

Diese Rollen wirken sichtbar über Doctrine-Dichte, Archetype-Tags, PlanWeights, generic substring checks oder Evidence:

- Corp-Dichte: `central_defense`, `upgrade`, `remote_support`, `ambush`, `economy_asset`, `economy_operation`, `draw_operation`
- Runner-Dichte: `setup_runner`, `setup_hardware`, `runner_program`, `tag_clear`, `tag_resilient`, `trash_support`
- Generic substring-Rollen: alles mit `economy`, `pressure`, `search`, `tutor`, `recovery`, `remote`, `score`, `trace`, `tag`, `damage`, `multiaccess`
- Planrollen, die durch Rollenmix mitlaufen: `remote_asset_economy`, `remote_asset_trap`, `remote_upgrade_tax`, `runner_install_program`, `runner_play_event`, `runner_event_choice`

### C. Nur dokumentarisch oder sehr schwach wirksam

Diese Rollen existieren in den Hints, haben aber keinen klaren direkten Verbraucher oder wirken nur über breite substring-/Evidence-Pfade:

- Per-card-/Resolver-Hinweise: `per_card_longtail`, `runner_program_ability`, `corp_operation_choice`, `corp_play_operation`
- Kartenform-/Flavor-nahe Rollen: `corp_identity`, `runner_identity`, `city_grid`, `region`, `unique`, `connection`, `daemon`, `sysop`, `gray_ops`, `black_ops`
- Timing-/Resolver-Spezialrollen ohne eigenen Planer: `start_of_turn`, `persistent`, `counter_transform`, `counter_ice`, `random`, `random_ice`, `random_discard_event`, `random_discard_pressure`
- Stark kartennahe Rollen: `runner_event_playful_ai_dice_loop`, `runner_start_turn_random_hq_reveal`, `corp_after_pass_ice_random_end_run`, `remote_upgrade_reactive_defense`

Diese Rollen können als Dokumentation sinnvoll sein, aber sie bilden noch keine stabile maschinenlesbare Ontologie.

### D. Dead / suspicious

Verdächtig sind vor allem Werte, die nur einmal vorkommen, keine exakte Code-Abfrage haben und deren Semantik als Rolle statt Effekt unscharf ist:

- Runner: `barrier_breaker`, `code_gate_breaker`, `sentry_breaker`, `wall_breaker`, `restricted_breaker`, `low_install_breaker`, `high_strength_breaker`, `breaker_end_run`
- R&D/HQ: `rd_run`, `rd_pressure`, `rd_multiaccess`, `rd_reorder`, `rd_reveal`, `rd_success_replacement`, `hq_run`, `hq_run_counter`, `hq_run_reward`, `hq_agenda_reveal`
- Corp remote/scoring: `remote_asset_agenda_support`, `remote_asset_control`, `remote_asset_finisher`, `remote_asset_run_start_tax`, `remote_upgrade_economy`, `remote_upgrade_reactive_defense`, `remote_upgrade_rez_support`, `scoring_remote_support`, `server_development`
- Corp agenda/effect: `scored_trigger_agenda`, `scored_agenda_ability`, `deck_reset_agenda`, `agenda_node_slot`, `agenda_point_cancel`, `agenda_point_cost`, `agenda_reward`, `overadvance_agenda`
- ICE/effects: `future-run`-ähnliche Rollen fehlen als Standard; vorhandene Einzelrollen wie `run_rewind_ice`, `jack_out_lock_ice`, `etr_tax`, `global_ice_strength_modifier`, `wall_ice_armor` sind nicht einheitlich
- Tag/Punish: `black_ops_punish_event`, `punish_tagged_runner`, `tag_punish`, `run_punish`, `corp_asset_tag_checked_damage`, `trace_pressure`, `tag_damage_agenda`

Suspicious heißt hier nicht falsch. Es heißt: als Verbrauchervertrag ist nicht klar, ob ein Planer diese Rolle bewusst lesen soll oder ob sie nur Review-Wissen ist.

## Häufigkeiten

Top-Rollen:

| Rolle               | Anzahl | Wirkung                            |
| ------------------- | -----: | ---------------------------------- |
| `program`           |     69 | vor allem dokumentarisch/generisch |
| `ice`               |     60 | direkt/generisch für Corp          |
| `per_card_longtail` |     44 | dokumentarisch                     |
| `runner`            |     44 | dokumentarisch/generisch           |
| `agenda`            |     43 | direkt                             |
| `asset`             |     41 | generisch                          |
| `event`             |     41 | generisch                          |
| `resource`          |     40 | generisch                          |
| `etr_ice`           |     38 | direkt                             |
| `corp`              |     35 | dokumentarisch/generisch           |
| `economy`           |     30 | direkt                             |
| `hardware`          |     29 | generisch                          |
| `operation`         |     27 | generisch                          |
| `upgrade`           |     27 | direkt/indirekt                    |
| `sentry_ice`        |     24 | direkt                             |
| `icebreaker`        |     22 | generisch                          |
| `counter`           |     20 | schwach/generisch                  |
| `hidden_zone_tool`  |     19 | indirekt                           |
| `trace`             |     19 | direkt/generisch                   |
| `score_plan`        |     17 | substring-wirksam                  |

Top-Planrollen:

| Planrolle                | Anzahl | Wirkung            |
| ------------------------ | -----: | ------------------ |
| `build_rig`              |    117 | direkt             |
| `protect_rnd`            |     61 | direkt/strategisch |
| `protect_hq`             |     55 | direkt/strategisch |
| `recover_economy`        |     39 | direkt/strategisch |
| `safe_probe_run`         |     35 | indirekt           |
| `build_scoring_remote`   |     30 | direkt/strategisch |
| `bait_runner`            |     20 | direkt/strategisch |
| `score_next_turn`        |     18 | direkt/strategisch |
| `contest_remote`         |     16 | direkt/strategisch |
| `runner_install_program` |     16 | indirekt           |
| `corp_score_agenda`      |     15 | direkt             |
| `pressure_rnd`           |     13 | direkt             |
| `runner_program_ability` |     13 | dokumentarisch     |
| `pressure_hq`            |     12 | direkt             |
| `remote_asset_economy`   |     12 | indirekt           |
| `score_now`              |     12 | direkt/strategisch |

`valueHints`-Schlüssel sind breit vorhanden, aber nicht als strukturierte Entscheidungsquelle verdrahtet. Häufige Schlüssel sind `defense(77)`, `economy(58)`, `runPressure(56)`, `perCardLongtailPriority(44)`, `threat(40)`, `rigCoverage(30)`, `scoring(23)`, `tempo(21)`, `utility(18)` und `information(16)`.

`riskTags` enthalten viele hochwertige Review-Signale (`hidden_ice`, `replay_statehash_required`, `trace_window`, `credit_reserve`, `tag_window`, `runner_trash_value`), sind aber kein aktives Risk-Modell.

## Entscheidungsthemen

### Runner

Breaker-Coverage ist grundsätzlich ausdrückbar, aber grob:

- Gut: `breaker_fracter`, `breaker_decoder`, `breaker_killer`, `breaker_generic`, `efficient_breaker`, `flex_breaker`
- Schwach: Kostenprofil, Pump-Schwellen, Basisstärke, Nebenwirkungen, Break-Restrictions und Trace-/AP-/Random-Spezialisierung sind nicht strukturiert. Einzelrollen wie `random_breaker`, `restricted_breaker`, `low_install_breaker`, `high_strength_breaker` sind nicht einheitlich genug.

Search/Tutor ist teilweise ausdrückbar:

- Gut: `stack_search`, `program_search`, `trash_recovery`, Rollen mit `search`/`recovery`
- Schwach: top-five selection, in-run install, temporary install, delayed install und spezifische Recovery-Zonen sind nicht strukturiert.

Economy ist grob ausdrückbar:

- Gut: `economy`, `tempo`, `recurring_credit`, `trash_cost_payment`, Rollen mit `economy`
- Schwach: burst vs recurring vs finite pool vs run-only/install-only/trash-only economy ist meist nicht maschinenlesbar getrennt. `valueHints.economy` wird nicht breit verbraucht.

Run Pressure ist gut genug für aktuelle Planer:

- Gut: `pressure_rnd`, `pressure_hq`, `archives_pressure`, `multiaccess`, `run_pressure`, `interface`-Substring, erfolgreiche Run-Trigger über Einzelrollen
- Schwach: R&D-Freshness, Topdeck-Wissen, stale vs fresh und Interface-Dig-Qualität entstehen aus Memory/Belief/Events, nicht aus Hint-Ontologie.

Trash/Access ist gemischt:

- Gut: `trash_cost_payment`, `remote_upgrade_tax`, `agenda_steal_tax`, `access_tax`, `remote_capacity`, `ambush`, `trap`
- Schwach: high-impact trash, reserve risk, dedicated trash credits und access-tradeoff sind aktuell Planerlogik/Metrik, nicht strukturierte Hint-Effekte.

Tag/Damage Defense ist teilweise vorhanden:

- Gut: `link`, `tag_remove`, `tag_avoid`, `tag_protection`, `damage_prevention`, `rig_defense`
- Schwach: damage prevention nach Typ, Flatline-Vermeidung, tag window timing und prevention budget sind nicht strukturiert.

### Corp

ICE ist als Rolle gut, als Effektprofil schwach:

- Gut: `etr_ice`, `barrier_ice`, `code_gate_ice`, `sentry_ice`, `taxing_ice`, `damage_ice`, `tag_ice`, `trace_ice`, `program_trash_ice`
- Schwach: Future-Run-/Future-Encounter-Effekte, Pump-/Break-Kosten des sichtbaren Runner-Rigs, unbrokenRunEffect-Kategorien, Stärke-/Kosten-/Subroutine-Profil sind nicht strukturiert in Hints.

Remote/Scoring ist teilweise ausdrückbar:

- Gut: `remote_support`, `protect_remote`, `remote_agenda_protection`, `remote_upgrade_tax`, `agenda_steal_tax`, `remote_capacity`, `ambush`, `bait_runner`
- Schwach: remote portfolio role, cheap contest risk, effective remote safety, score-window compression und protect-to-score conversion werden aus Board/LegalActions berechnet, nicht aus Hint-Effekten.

Corp Economy ist grob ausdrückbar:

- Gut: `economy_operation`, `economy_asset`, `remote_asset_economy`, `economy_agenda`
- Schwach: scored-agenda economy und rez-reserve sind nicht über strukturierte Hint-Effekte abgebildet; sie werden über Action/Text/Payload klassifiziert.

Agenda-Qualität ist teilweise ausdrückbar:

- Gut: `agenda_1pt`, `agenda_2pt`, `agenda_3pt`, `agenda_4pt`, `score_now`, `score_next_turn`, `corp_agenda_ability`
- Schwach: score difficulty, when-scored effect, scored activated ability, passive global effect und advance-burst synergy sind nicht typisiert genug.

Operations sind grob ausdrückbar:

- Gut: `economy_operation`, `draw_operation`, `tag_operation`, `trace_operation`, `damage_operation`, `corp_agenda_operation`
- Schwach: fast advance, counter movement, HQ/R&D manipulation und exact terminal-punish classes sind eher Karten-/Textwissen als Hint-Ontologie.

Tag/Punish ist vorhanden, aber nicht terminal genug:

- Gut: `tag_ice`, `trace_ice`, `tag_operation`, `trace_operation`, `tag_punishment`, `tag_punishment_operation`, `damage_operation`
- Schwach: `tag_source` vs `tag_payoff` vs `tagged_runner_payoff` vs `economic_punish` vs `flatline_threat` ist nicht konsequent getrennt.

## Konkrete Lücken

| Frage                                        | Befund                                                                                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scored-agenda activated ability ausdrückbar? | Nur unscharf über Rollen wie `corp_agenda_ability`, `economy_agenda`, `tag_damage_agenda`; echte Klassifikation lebt im Code.                             |
| Future-run-effect ICE ausdrückbar?           | Nicht sauber. Einzelrollen existieren, aber keine standardisierte `future_effect`-Ontologie mit Scope und Remaining-Path-Relevanz.                        |
| Cheaply contestable remote risk ausdrückbar? | Nein. Wird korrekt aus Board/Rig/Effective-Run-Quote berechnet, nicht durch Hints.                                                                        |
| Remote portfolio role ausdrückbar?           | Teilweise über `remote_asset_*`, `remote_upgrade_*`, `bait_runner`, `build_scoring_remote`; kein strukturiertes Ziel wie `payloadPlan` oder `remoteRole`. |
| HQ agenda density / dilution ausdrückbar?    | Nein. Das ist Board-/Handzustand und sollte eher Diagnose/Doctrine sein als Kartenhint.                                                                   |
| Strategic line support ausdrückbar?          | Teilweise über Planrollen, aber nicht strukturiert nach `supportsLine`, `linePhase`, `abortSignal`, `conversionTarget`.                                   |
| Opponent archetype signal ausdrückbar?       | Nein, bewusst nicht. Sollte side-safe aus öffentlichen Signalen entstehen, nicht aus eigenen Hints allein.                                                |
| Phase exit / setup-to-pressure ausdrückbar?  | Nur indirekt über `build_rig`, `recover_economy`, `pressure_*`; keine explizite `unlocksPressureLine`-Semantik.                                           |
| Breaker priority ladder ausdrückbar?         | Nur über Breakerrollen und Planerlogik. Kein strukturiertes Kosten-/Coverage-/Priority-Profil.                                                            |

## Erweiterungsvorschlag

Rückwärtskompatibel: `roles` und `planRoles` bleiben erhalten. Neu wäre ein optionales maschinenlesbares Effekt-/Kosten-/Strategieprofil. Der Planer kann es schrittweise lesen, ohne alte Hints zu brechen.

```json
{
  "roles": ["economy", "breaker"],
  "planRoles": ["build_rig", "pressure_rnd"],
  "effects": [
    {
      "kind": "economy",
      "scope": "runner",
      "timing": "action",
      "amount": 3,
      "resource": "credits",
      "finite": true
    }
  ],
  "conditions": [
    {
      "kind": "requires_tagged_runner"
    }
  ],
  "costProfile": {
    "clicks": 1,
    "credits": 2,
    "reserveRisk": "low"
  },
  "strategicTags": [
    "remote_scoring_protection",
    "tag_punish_payoff",
    "breaker_search"
  ],
  "qualityReviewed": true
}
```

Empfohlene Ergänzungen:

- `effects.kind`: `economy`, `draw`, `tag_source`, `tag_payoff`, `damage_payoff`, `trace`, `score_counter`, `advance_burst`, `run_tax`, `access_tax`, `future_run_effect`, `breaker_coverage`, `search`, `trash_recovery`, `remote_protection`, `remote_capacity`, `topdeck_info`
- `effects.scope`: `runner`, `corp`, `server`, `fort`, `hq`, `rd`, `archives`, `remote`, `run`, `encounter`, `access`
- `effects.timing`: `action`, `when_scored`, `scored_activated`, `start_of_turn`, `during_run`, `successful_run`, `on_access`, `on_encounter`, `passive`
- `conditions.kind`: `requires_tagged_runner`, `requires_runner_tagged_at_corp_turn`, `requires_agenda_in_remote`, `requires_known_top_rd`, `requires_remaining_ice`, `requires_ice_subtype`, `requires_counter`, `requires_trace_success`
- `costProfile`: clicks, credits, recurring-credit restriction, pool source, break cost class, pump threshold, reserve risk
- `remoteRole`: `scoring`, `asset_value`, `bait_ambush`, `tax`, `secondary_scoring`, `central_support`
- `lineSupport`: `early_hq_pressure`, `early_rnd_pressure`, `remote_contest`, `economy_first`, `rig_first`, `breaker_search_first`, `interface_pressure`, `closeout_pressure`, `central_stabilize`, `remote_scoring_build`, `tag_trace_punish`

Wichtig: Diese Felder sollen keine Legalität freischalten. Sie dürfen nur die bestehende LegalAction-/PlayerView-/Belief-Auswertung präziser gewichten oder diagnostizieren.

## Konkrete Empfehlungen

1. Rollen-/Planrollen-Vertrag dokumentieren: `roles` sind Eigenschaftslabels, `planRoles` sind Plan-Support-Labels. Der aktuelle Code mischt beide; das sollte als bestehende Kompatibilität festgehalten werden.
2. `valueHints` entweder aktiv anbinden oder als Review-only deklarieren. Momentan klingt der Name entscheidungswirksam, ist es aber kaum.
3. `riskTags` als Review-/Safety-Tags deklarieren oder eine kleine Risk-Consumer-Schicht bauen. Derzeit sind sie wertvoll, aber nicht Planerwirksam.
4. Alias-/Synonymprüfung einführen: z. B. `rd_pressure` vs `pressure_rnd`, `hq_run` vs `pressure_hq`, `tag_remove` vs `tag_removal` vs `clear_tags`/`remove_tags`, `remote_agenda_protection` vs `scoring_remote_support`.
5. Für kommende Slices keine weiteren Einzelrollen erfinden, sondern zuerst `effects`, `conditions`, `costProfile` und `strategicTags` als optionales Schema definieren.
6. Eine kleine Contract-Testdatei wäre sinnvoll: aktive Hints laden, Rollen gegen bekannte Consumer-Aliaslisten prüfen, rare roles reporten, aber nicht failen.

## Keine Änderungen am Verhalten

Dieser Audit ändert keine AI-Hints, keine Kartendaten, keine Engine-Regeln, keine Decks, keine Profile und keine Strategiegewichte. Er beschreibt den aktuellen Verbrauchervertrag und schlägt ein rückwärtskompatibles Erweiterungsmodell vor.
