# AI010 Strategy Anchor Completion / Deferred Card Review

Aufgabe-ID: AI010

## Kurzfazit

AI010 prüft die 71 nach AI009 zurückgestellten Karten vollständig. 28 Karten erhalten sichere normierte `lineSupport`-Strategy-IDs und passende `strategicRole`-Werte. 43 Karten bleiben bewusst ohne `lineSupport`, weil Function-Signals, bestehende Human-Review-Warnings oder Descriptor-Gaps die richtige Grenze sind. Legacy-`lineSupport` ist in aktiven und compiled Hints vollständig entfernt.

Keine Plannerwirkung, keine Action-Score- oder PlanWeight-Änderung, keine Engine-/Legalitätsänderung, keine Profil-/Default-Umschaltung und keine neuen Strategy IDs.

## Bezug zu AI009

AI009 hatte 47 Karten normalisiert und 71 Karten zurückgestellt. Der AI009-Nachstand war: Taxonomy-Warnings 66, Legacy-`lineSupport` distinct 11, Legacy-Occurrences 110, normalisierte Occurrences 80, Inspector-Warning-Karten 411 und Inspector-`legacy_lineSupport` 71.

AI010 arbeitet genau diese 71 Karten ab und nutzt keine `roles` oder `planRoles` allein als Evidenz.

## Ergebniszahlen

| Messpunkt | Wert |
| --- | ---: |
| Geprüfte AI009-Restkarten | 71 |
| Karten mit AI010-Hintänderung | 71 |
| Sichere Strategieanker | 28 |
| Bewusst ohne `lineSupport` | 43 |
| Support-/Funktionskarten ohne `lineSupport` | 32 |
| Descriptor-Gaps ohne `lineSupport` | 2 |
| Human-Review-Klasse ohne `lineSupport` | 9 |
| Reviewed Cards mit `deferred_requires_human_review`-Warning danach | 12 |
| Legacy-`lineSupport` nach AI010 | 0 |

## Kandidatengruppen

| Gruppe | geprüft |
| --- | ---: |
| Corp scoreline and economy review | 6 |
| Corp structure / scoring protection review | 2 |
| Generic economy / reserve support review | 13 |
| ICE tax / tag / damage / support review | 20 |
| Normal breaker function-signal review | 20 |
| Normal draw/setup support review | 3 |
| Rig support review | 3 |
| Runner pressure / remote contest review | 4 |

## Gesetzte Strategy IDs und Strategic Roles

Neue/normierte `lineSupport`-IDs in AI010: `corp.damage_kill`, `corp.economy_rez_reserve`, `corp.ice_tax_glacier`, `corp.remote_scoring`, `corp.tag_trace_punish`, `runner.remote_contest`.

Ergänzte `strategicRole`-Werte: `engine_anchor`, `punish_payoff`, `support_tool`, `tax_tool`.

## Sichere Strategieanker

| cardId | Titel | neue `lineSupport` | `strategicRole` | Begründung |
| --- | --- | --- | --- | --- |
| `onr_v1_173_restrictive-net-zoning` | Restrictive Net Zoning | `runner.remote_contest` | `tax_tool` | Persistent remote-server tax is direct remote-contest pressure, not generic setup. |
| `onr_v1_193_corporate-coup` | Corporate Coup | `corp.economy_rez_reserve` | `engine_anchor` | Scored agenda action plus repeatable finite counter economy is a real economy/reserve engine. |
| `onr_v1_196_corporate-war` | Corporate War | `corp.economy_rez_reserve` | `support_tool` | When-scored credit burst is scoreline economy support, not score-closeout or remote scoring. |
| `onr_v1_203_hostile-takeover` | Hostile Takeover | `corp.economy_rez_reserve` | `support_tool` | When-scored credit burst is explicit scoreline economy support. |
| `onr_v1_209_political-coup` | Political Coup | `corp.economy_rez_reserve` | `engine_anchor` | Scored agenda action plus repeatable finite counter economy is a real economy/reserve engine. |
| `onr_v1_210_political-overthrow` | Political Overthrow | `corp.economy_rez_reserve` | `engine_anchor` | Scored agenda action plus repeatable economy is a reserve engine after scoring. |
| `onr_v1_212_priority-requisition` | Priority Requisition | `corp.economy_rez_reserve` | `support_tool` | When-scored rez discount is explicit rez-reserve scoreline support; old remote/score labels were too broad. |
| `onr_v1_191_black-ice-quality-assurance` | Black Ice Quality Assurance | `corp.remote_scoring`, `corp.ice_tax_glacier` | `tax_tool` | Persistent ICE strength protection supports remote scoring and ICE-tax/glacier structure. |
| `onr_v1_219_superior-net-barriers` | Superior Net Barriers | `corp.remote_scoring`, `corp.ice_tax_glacier` | `tax_tool` | Persistent ICE strength protection supports remote scoring and ICE-tax/glacier structure. |
| `onr_v1_206_marine-arcology` | Marine Arcology | `corp.economy_rez_reserve` | `engine_anchor` | Scored agenda action plus repeatable economy is a reserve engine after scoring. |
| `onr_v1_293_netwatch-credit-voucher` | Netwatch Credit Voucher | `corp.tag_trace_punish` | `punish_payoff` | Tagged-runner condition plus additional tag source keeps tag/trace punish while removing generic economy reserve. |
| `onr_v1_222_ball-and-chain` | Ball and Chain | `corp.ice_tax_glacier` | `tax_tool` | Future-run effect plus repeatable credit tax is an ICE-tax anchor, not central-specific stabilization. |
| `onr_v1_223_banpei` | Banpei | `corp.ice_tax_glacier` | `tax_tool` | Program-trash/run-path protection is a taxing ICE tool, not a generic central/remote label. |
| `onr_v1_224_bolter-cluster` | Bolter Cluster | `corp.damage_kill`, `corp.ice_tax_glacier` | `punish_payoff`, `tax_tool` | Encounter damage and future encounter pressure support damage-kill pressure and ICE-tax. |
| `onr_v1_225_canis-major` | Canis Major | `corp.ice_tax_glacier` | `tax_tool` | Future-run strength tax is a direct ICE-tax tool. |
| `onr_v1_226_canis-minor` | Canis Minor | `corp.ice_tax_glacier` | `tax_tool` | Future-run strength tax is a direct ICE-tax tool. |
| `onr_v1_227_cerberus` | Cerberus | `corp.tag_trace_punish`, `corp.damage_kill`, `corp.ice_tax_glacier` | `punish_payoff`, `tax_tool` | Trace source, damage, and run-path protection combine tag/trace punish, damage pressure, and ICE tax. |
| `onr_v1_228_cinderella` | Cinderella | `corp.tag_trace_punish`, `corp.damage_kill`, `corp.ice_tax_glacier` | `punish_payoff`, `tax_tool` | Trace success hardware trash, damage, and protection combine tag/trace punish, damage pressure, and ICE tax. |
| `onr_v1_236_data-raven` | Data Raven | `corp.tag_trace_punish` | `engine_anchor` | Trace-to-tag source is a direct tag/trace punish engine anchor; central stabilization was legacy noise. |
| `onr_v1_243_fetch-4-0-1` | Fetch 4.0.1 | `corp.tag_trace_punish` | `engine_anchor` | Trace-to-tag source is a direct tag/trace punish engine anchor; central stabilization was legacy noise. |
| `onr_v1_249_hunter` | Hunter | `corp.tag_trace_punish` | `engine_anchor` | Trace-to-tag source is a direct tag/trace punish engine anchor; central stabilization was legacy noise. |
| `onr_v1_258_neural-blade` | Neural Blade | `corp.ice_tax_glacier` | `tax_tool` | Damage plus future encounter pressure is kept as ICE-tax pressure; low damage was not promoted to damage-kill lineSupport. |
| `onr_v1_267_sentinels-prime` | Sentinels Prime | `corp.ice_tax_glacier` | `tax_tool` | Program-trash/run-path protection is a taxing ICE tool. |
| `onr_v1_268_shock-r` | Shock.r | `corp.ice_tax_glacier` | `tax_tool` | Future encounter pressure is a direct ICE-tax tool. |
| `onr_v1_274_tutor` | Tutor | `corp.ice_tax_glacier` | `tax_tool` | Future-run effect plus run-path protection is a direct ICE-tax tool. |
| `onr_v1_276_viral-15` | Viral 15 | `corp.ice_tax_glacier` | `tax_tool` | Future-run pressure, credit tax, and program-trash pressure are ICE-tax evidence. |
| `onr_v1_277_virizz` | Virizz | `corp.ice_tax_glacier` | `tax_tool` | Future-run pressure plus repeatable credit tax is ICE-tax evidence. |
| `onr_v1_278_wall-of-ice` | Wall of Ice | `corp.damage_kill`, `corp.ice_tax_glacier` | `punish_payoff`, `tax_tool` | High encounter damage plus run-path protection supports damage pressure and ICE-tax. |

## Bewusst ohne lineSupport

- `deferred_requires_human_review` (9): `onr_v1_097_livewires-contacts`, `onr_v1_188_ai-chief-financial-officer`, `onr_v1_002_ai-boon`, `onr_v1_007_blink`, `onr_v1_055_reflector`, `onr_v1_070_tinweasel`, `onr_v1_079_bodyweight-synthetic-blood`, `onr_v1_095_jack-n-joe`, `onr_v1_231_cortical-scrub`
- `descriptor_gap` (2): `onr_v1_068_startup-immolator`, `onr_v1_080_core-command-jettison-ice`
- `support_function_only` (32): `onr_v1_108_score`, `onr_v1_045_newsgroup-filter`, `onr_v1_178_short-term-contract`, `onr_v1_199_employee-empowerment`, `onr_v1_281_accounts-receivable`, `onr_v1_282_annual-reviews`, `onr_v1_288_day-shift`, `onr_v1_290_efficiency-experts`, `onr_v1_295_night-shift`, `onr_v1_296_off-site-backups`, `onr_v1_005_bartmoss-memorial-icebreaker`, `onr_v1_006_black-dahlia`, `onr_v1_014_codecracker`, `onr_v1_016_cyfermaster`, `onr_v1_019_dropp`, `onr_v1_037_japanese-water-torture`, `onr_v1_039_krash`, `onr_v1_040_loony-goon`, `onr_v1_047_pile-driver`, `onr_v1_052_raffles`, `onr_v1_054_raptor`, `onr_v1_056_replicator`, `onr_v1_060_shaka`, `onr_v1_072_wild-card`, `onr_v1_073_wizards-book`, `onr_v1_074_worm`, `onr_v1_075_zetatech-software-installer`, `onr_v1_237_data-wall`, `onr_v1_279_wall-of-static`, `onr_v1_011_cloak`, `onr_v1_071_vewy-vewy-quiet`, `onr_v1_168_loan-from-chiba`

Pro-Karte-Evidenz mit alten und neuen Werten, Effects, Conditions, Function-Signals, StrategyAnchors und Warning-Kategorien steht im JSON-Detailreport: `docs/reviews/ai/ai010-strategy-anchor-completion-deferred-review-report-2026-05-31.json`.

## Warning-Delta

| Messpunkt | nach AI009 | nach AI010 |
| --- | ---: | ---: |
| Taxonomy-Warnings | 66 | 55 |
| Legacy-`lineSupport` distinct | 11 | 0 |
| Legacy-`lineSupport` occurrences | 110 | 0 |
| Normalisierte `lineSupport` occurrences | 80 | 110 |
| Inspector-Karten mit Warnings | 411 | 353 |
| Inspector `legacy_lineSupport` Karten | 71 | 0 |

## DeckDoctrine-Diagnostik

Die Änderungen bleiben diagnostisch und werden nicht vom Planner konsumiert.

| Deck | Strategie | vorher final | nachher final | Delta final | vorher anchor | nachher anchor | Evidence |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| onr_origin_corp_ai_snapshot_v1 | `corp.central_stabilize` | 95 | 50 | -45 | 100 | 0 | 2 -> 0 |
| onr_origin_corp_ai_snapshot_v1 | `corp.economy_rez_reserve` | 69 | 95 | +26 | 44 | 100 | 2 -> 3 |
| onr_origin_corp_ai_tag_ops_snapshot_v1 | `corp.central_stabilize` | 95 | 50 | -45 | 100 | 0 | 4 -> 0 |
| onr_origin_corp_ai_tag_ops_snapshot_v1 | `corp.economy_rez_reserve` | 69 | 95 | +26 | 44 | 100 | 2 -> 3 |
| onr_origin_corp_ai_tag_ops_snapshot_v1 | `corp.tag_trace_punish` | 100 | 100 | +0 | 100 | 100 | 11 -> 14 |

## Bewusst nicht geändert

- keine Plannerwirkung
- keine Action-Score-Änderung
- keine PlanWeight-Änderung
- keine Engine-/Legalitätsänderung
- keine Profil-/Default-Umschaltung
- keine Massenmigration
- keine Hidden-Info-Nutzung
- keine Catalog-/Proteus-Baseline-Korrektur
- keine neuen Strategy IDs
- keine Ableitung allein aus `roles` oder `planRoles`

## Checks

- `corepack pnpm build:ai-compiled-hints`: pass
- `corepack pnpm build:ai-hint-inspector-index`: pass
- `corepack pnpm check:ai-strategy-taxonomy`: pass
- `corepack pnpm check:ai-compiled-hints`: pass
- `corepack pnpm check:ai-hint-inspector-index`: pass
- `corepack pnpm check:ai-hint-quality`: pass
- `corepack pnpm check:ai-approval-consistency`: pass
- `corepack pnpm check:ai-deck-doctrine-strategy`: pass
- `corepack pnpm --filter @netgrid/ai test`: pass
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`: pass
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`: pass
- `git diff --check`: pass
- `git diff --cached --check`: pass
