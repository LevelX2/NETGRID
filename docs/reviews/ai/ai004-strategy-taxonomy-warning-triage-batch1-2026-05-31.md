# AI004 Strategy Taxonomy Warning Triage Batch 1

Aufgabe-ID: AI004

## Kurzfazit

AI004 triagiert die aktuellen `check:ai-strategy-taxonomy`-Warnings und normalisiert einen kleinen, sicheren Batch. Der Schnitt bleibt ohne Plannerwirkung: keine Engine-Regeländerung, keine Legalitätsänderung, keine Action-Score- oder PlanWeight-Änderung, keine Profil-/Default-Umschaltung und keine DeckDoctrine-Runtime-Änderung.

Die Aufgabenbeschreibung nannte für Legacy-`lineSupport` 118 Vorkommen. Die vor Start gemessene Workspace-Baseline am 2026-05-31 war abweichend 196 Vorkommen bei 15 Werten; diese gemessene Baseline ist im Review führend.

## Bezug zu AI003 und AI003-1

- AI003 definiert 20 StrategyGoals, 11 optionale `strategicRole`-Werte und die Trennung `lineSupport` = Strategieanker/Payoff/klare Strategiebelege.
- AI003-1 macht Function-Signal-Derivation side-, cardType- und scope-aware und verhindert 26 Wrong-Side-Anker.
- AI004 nutzt diesen Vertrag nur zur Triage und sicheren Hint-Normalisierung. `roles` und `planRoles` bleiben Legacy-/Kompatibilitätsfelder und erzeugen keine neuen Strategy-IDs.

## Warning-Baseline

| Messpunkt | Vor AI004 | Nach AI004 |
| --- | ---: | ---: |
| Errors | 0 | 0 |
| Total Warnings | 70 | 69 |
| Legacy-`lineSupport` distinct | 15 | 14 |
| Legacy-`lineSupport` occurrences | 196 | 161 |
| Unknown `roles`/`planRoles` distinct | 52 | 0 |
| Descriptor-Gaps | 3 | 3 |
| Wrong-Side-Anker | 0 | 0 |
| Verhinderte Wrong-Side-Anker | 26 | 26 |

Nach AI004 werden die früher unknown `roles`/`planRoles` nicht mehr als unbekannt gemeldet, sondern in warn-only Klassen aufgeteilt: `function_signal_only` 29 Werte / 77 Vorkommen, `legacy_role_only` 11 / 31, `descriptor_gap` 10 / 44, `remove_or_deprecate` 1 / 1 und `deferred_requires_human_review` 1 / 2.

## Legacy-lineSupport-Triage

| Wert | Batch-1-Klassifikation | Ergebnis |
| --- | --- | --- |
| `tag_trace_punish` | `safe_strategy_anchor_alias` | alle 20 Vorkommen zu `corp.tag_trace_punish` normalisiert |
| `early_rnd_pressure` | `safe_strategy_anchor_alias` bei R&D-Evidenz | 3 Vorkommen zu `runner.rnd_pressure` normalisiert, 2 zurückgestellt |
| `early_hq_pressure` | `safe_strategy_anchor_alias` bei HQ-Evidenz | 2 Vorkommen zu `runner.hq_pressure` normalisiert, 1 zurückgestellt |
| `interface_pressure` | `safe_strategy_anchor_alias` bei Interface-/Multiaccess-Evidenz | 4 Vorkommen zu `runner.interface_closeout` normalisiert, 2 zurückgestellt |
| `remote_contest` | kartenspezifisch; Trash-Credit-Payoff ist `runner.remote_trash` | 2 Vorkommen zu `runner.remote_trash` normalisiert, 3 zurückgestellt |
| `closeout_pressure` | zu breit ohne Multiaccess-/Interface-Evidenz | ausgewählte Multiaccess-Fälle normalisiert; nicht belegte Fälle entfernt oder zurückgestellt |
| `rig_first` | `structure_or_support_goal_requires_card_review` | keine Batch-1-Migration |
| `economy_first` | `structure_or_support_goal_requires_card_review` | keine Batch-1-Migration |
| `breaker_search_first` | potenzieller Strategy-Anchor, aber pro Karte zu prüfen | keine Batch-1-Migration |
| `central_stabilize` | strukturelles Corp-Supportziel | keine Batch-1-Migration |
| `remote_scoring_build` | strukturelles Corp-Supportziel | keine Batch-1-Migration |
| `ice_tax_glacier` | strukturelles Corp-Supportziel | keine Batch-1-Migration |
| `economy_rez_reserve` | strukturelles Corp-Supportziel | keine Batch-1-Migration |
| `fast_advance_or_counter_ops` | Score-/Counter-Payoff mit Reviewbedarf | keine Batch-1-Migration |
| `score_closeout` | Rush/Fast-Advance nicht blind ableitbar | keine Batch-1-Migration |

## Hintänderungen

Alle Hintänderungen wurden pro Karte entschieden, nicht nur pro Legacy-Wert. Es wurden keine `strategicRole`-Werte ergänzt.

| Karte | Änderung | Evidenz |
| --- | --- | --- |
| `onr_v1_041_microtech-ai-interface` | `early_rnd_pressure`, `interface_pressure`, `closeout_pressure` -> `runner.rnd_pressure`, `runner.interface_closeout` | R&D-Access-Replacement, R&D-Topdeck-Info, Interface-Karte |
| `onr_v1_050_r-and-d-protocol-files` | `early_rnd_pressure`, `interface_pressure` -> `runner.rnd_pressure`, `runner.interface_closeout` | R&D-Access-Replacement, R&D-Topdeck-Info |
| `onr_v1_081_custodial-position` | `early_rnd_pressure`, `interface_pressure`, `closeout_pressure` -> `runner.rnd_pressure`, `runner.interface_closeout` | R&D-Multiaccess |
| `onr_v1_084_edited-shipping-manifests` | `early_hq_pressure`, `closeout_pressure` -> `runner.hq_pressure` | HQ-Access-Replacement; kein Interface-Closeout-Beleg |
| `onr_v1_085_executive-wiretaps` | `early_hq_pressure`, `interface_pressure`, `closeout_pressure` -> `runner.hq_pressure`, `runner.interface_closeout` | HQ-Multiaccess |
| `onr_v1_048_poltergeist` | `remote_contest` -> `runner.remote_trash` | wiederholbare Trash-Credits |
| `onr_v1_057_scatter-shot` | `remote_contest` -> `runner.remote_trash` | wiederholbare Trash-Credits |
| 20 Corp-Tag/Trace/Punish-Karten | `tag_trace_punish` -> `corp.tag_trace_punish` | Corp-side `tag_source`, `trace`, `tag_punish_payoff` oder Runner-Damage-Punish-Effekte |

Die 20 Corp-Karten sind `Netwatch Operations Office`, `On-Call Solo Team`, `Private Cybernet Police`, `Strike Force Kali`, `Cerberus`, `Cinderella`, `Data Raven`, `Fetch 4.0.1`, `Hunter`, `Audit of Call Records`, `Chance Observation`, `Closed Accounts`, `Corporate Detective Agency`, `Datapool by Zetatech`, `Netwatch Credit Voucher`, `Power Grid Overload`, `Punitive Counterstrike`, `Scorched Earth`, `Trojan Horse` und `Urban Renewal`.

## Roles- und PlanRoles-Triage

Die vollständige Liste aller 52 vormals unknown Werte steht im JSON-Report. Zusammenfassung:

- `function_signal_only`: `virus`, `ice_modifier`, `action`, `hosting`, `modifier`, `expose_helper`, `handlimit`, `stealth`, `rig_defense`, `tempo`, `code_gate`, `expose`, `sentry`, `server_defense`, `start_of_turn`, `stealth_loss`, `bit_depot`, `bit_pool`, `daemon_host`, `etr_tax`, `killer_support`, `recursion`, `recycle_zones`, `server_tax`, `worm_hate`, `break_walls`, `protect_rig`, `click_for_credits_when_safe`, `credit_swing`.
- `legacy_role_only`: `city_grid`, `region`, `transactions`, `connection`, `gray_ops`, `daemon`, `persistent`, `sysop`, `black_ops`, `persistent_liability`, `position`.
- `descriptor_gap`: `hidden_zone_tool`, `hidden_zone`, `information`, `rd_reorder`, `rd_reveal`, `rd_success_replacement`, `server_development`, `stack_reorder`, `hidden_information_pressure`.
- `remove_or_deprecate`: `noisy`.
- `deferred_requires_human_review`: `steal_reward`.

Keine dieser Klassen fließt als Strategiequelle in den Planner.

## Descriptor-Gaps

| Gap | Betroffene Signale/Werte | Warum nicht migriert | Späterer Bedarf |
| --- | --- | --- | --- |
| `remote_contest_pressure_not_first_class` | `remote_contest`, `contest_remote`, `server_development` | Remote-Contest ist noch zu breit; Trash-Payoffs wurden nur kartenspezifisch als `runner.remote_trash` normalisiert | bessere Remote-Contest-Descriptors |
| `cheap_ice_and_rush_shape_partial` | `score_closeout`, `ice_tax_glacier`, `server_defense`, `etr_tax` | Corp-Rush darf nicht aus jedem günstigen ICE oder Score-Kontext abgeleitet werden | Early-ICE-/Agenda-/Economy-Shape-Descriptors |
| `interface_closeout_density_requires_aggregation` | `interface_pressure`, `closeout_pressure`, `information`, `hidden_information_pressure` | Interface-Closeout braucht Deckdichte und zentrale Reichweite; nur echte Einzelkarten-Payoffs wurden normalisiert | spätere DeckDoctrine-Aggregation |

## Gates und Artefakte

`corepack pnpm check:ai-strategy-taxonomy` hard-failt jetzt zusätzlich unbekannte neue `lineSupport`-Werte und falsche Side-Präfixe in `lineSupport`. Bekannte Legacy-`lineSupport`-Aliases bleiben warn-only. Die vormals unknown `roles`/`planRoles` sind als explizite AI004-Warnklassen allowlisted.

Artefakte:

- `docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-report-2026-05-31.json`
- `docs/reviews/ai/ai004-strategy-taxonomy-warning-triage-batch1-alias-report-2026-05-31.json`
- `docs/reviews/ai/ai004-side-aware-function-signal-derivation-report-2026-05-31.json`

## Checks

Ausgeführt:

- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm check:ai-strategy-taxonomy`
- `corepack pnpm check:ai-compiled-hints`
- `corepack pnpm check:ai-derived-facts`
- `corepack pnpm check:ai-derived-facts-full`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`

Ausstehend unmittelbar vor Commit:

- `git diff --check`
- `git diff --cached --check`
