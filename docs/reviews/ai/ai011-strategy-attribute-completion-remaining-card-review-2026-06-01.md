# AI011 Strategy Attribute Completion / Remaining Card Review

Aufgabe-ID: AI011

## Kurzfazit

AI011 setzt die AI010-Nacharbeit für die noch nicht voll mit den neuen Strategieattributen bearbeiteten Karten fort. 101 weitere Karten erhalten normierte `lineSupport`-Strategy-IDs plus passende `strategicRole`-Werte. 13 bereits normalisierte Karten erhalten nur die fehlende `strategicRole`. Aktive und compiled Hints bleiben frei von Legacy-`lineSupport`; alle normierten `lineSupport`-Karten tragen danach eine kontrollierte `strategicRole`.

Keine Plannerwirkung, keine Action-Score- oder PlanWeight-Änderung, keine Engine-/Legalitätsänderung, keine Profil-/Default-Umschaltung und keine neuen Strategy IDs.

## Scope und Grenze

AI011 nutzt die AI003/AI010-Grenze: `lineSupport` ist ein enger Strategieanker für Payoffs, Engines und klare Strategiebelege. AI010-bewusst-zurückgestellte Karten wurden nicht pauschal umgedeutet. Reine Recurring-Credit-Hardware, reine Basis-ETR-ICE, reine Draw-/Hand-size-Karten und Descriptor-Gaps bleiben ohne neuen Strategieanker.

## Ergebniszahlen

| Messpunkt | Vor AI011 | Nach AI011 |
| --- | ---: | ---: |
| Geänderte Karten | - | 114 |
| Karten mit neuem lineSupport | - | 101 |
| Karten nur mit ergänzter strategicRole | - | 13 |
| Normierte lineSupport-Occurrences | 110 | 234 |
| Karten mit normiertem lineSupport | 88 | 189 |
| Normierte Karten ohne strategicRole | 13 | 0 |
| Legacy-lineSupport-Occurrences | 0 | 0 |
| Inspector: abgeleitete Anker ohne normiertes lineSupport | 153 | 52 |
| Taxonomy-Warnings | 55 | 55 |

## Geänderte Gruppen

| Gruppe | Karten |
| --- | ---: |
| Runner survival / trace / damage defense | 37 |
| Corp tag / trace / damage punish | 27 |
| Corp ICE tax / glacier pressure | 19 |
| StrategicRole completion for existing normalized lineSupport | 13 |
| Corp ambush / access punish | 6 |
| Runner central pressure / interface closeout | 4 |
| Corp asset economy | 3 |
| Corp economy / rez / remote protection | 3 |
| Runner breaker search / recovery | 2 |

## Gesetzte Strategy IDs und Rollen

| Strategy ID | Occurrences im geänderten Batch |
| --- | ---: |
| `runner.survival_defense` | 37 |
| `corp.ice_tax_glacier` | 30 |
| `corp.tag_trace_punish` | 21 |
| `corp.damage_kill` | 20 |
| `corp.ambush_bluff` | 6 |
| `runner.interface_closeout` | 6 |
| `runner.hq_pressure` | 5 |
| `corp.economy_rez_reserve` | 4 |
| `runner.rnd_pressure` | 4 |
| `corp.asset_economy` | 3 |
| `runner.breaker_search` | 2 |
| `runner.remote_trash` | 2 |
| `corp.remote_scoring` | 1 |

| StrategicRole | Neue Rollen im Batch |
| --- | ---: |
| `defensive_tool` | 35 |
| `tax_tool` | 31 |
| `punish_payoff` | 24 |
| `engine_anchor` | 14 |
| `payoff_anchor` | 8 |
| `enabler` | 6 |
| `support_tool` | 6 |
| `emergency_tool` | 3 |
| `win_condition` | 2 |

## Bewusst nicht geändert

| Grund | Karten |
| --- | ---: |
| plain_etr_or_deferred_basic_ice_only | 21 |
| recurring_credit_or_install_support_only | 17 |
| draw_or_generic_economy_support_only | 5 |
| low_damage_or_descriptor_review_needed | 4 |
| descriptor_gap_kept_for_separate_review | 3 |
| hand_size_or_remote_slot_support_only | 2 |

52 Karten mit abgeleiteten StrategyAnchors bleiben bewusst ohne normiertes `lineSupport`. Das sind vor allem normale Recurring-Credit-/Install-Support-Karten, Basis-ETR-ICE, reine Draw-/Hand-size-Assets, Descriptor-Gaps und AI010-bewusst-zurückgestellte Support-Fälle.

## Details

Der maschinenlesbare Detailreport enthält alte und neue Werte, Inspector-Evidenz, Warning-Kategorien und Begründung pro Karte: `docs/reviews/ai/ai011-strategy-attribute-completion-remaining-card-review-report-2026-06-01.json`.

## Bewusst nicht geändert am System

- keine Plannerwirkung
- keine Action-Score-Änderung
- keine PlanWeight-Änderung
- keine Engine-/Legalitätsänderung
- keine Profil-/Default-Umschaltung
- keine Hidden-Info-Nutzung
- keine neuen Strategy IDs
- keine Ableitung allein aus `roles` oder `planRoles`

## Checks

- `corepack pnpm build:ai-compiled-hints`: pass
- `corepack pnpm build:ai-hint-inspector-index`: pass
- `corepack pnpm check:ai-strategy-taxonomy`: pass
- `node scripts/check-ai-manual-overlays.mjs --write`: pass
- `node scripts/check-ai-derived-facts.mjs --write`: pass
- `node scripts/check-ai-hint-compiled-index.mjs --write`: pass
- `corepack pnpm check:ai-compiled-hints`: pass
- `corepack pnpm check:ai-hint-inspector-index`: pass
- `corepack pnpm check:ai-hint-quality`: pass
- `corepack pnpm check:ai-approval-consistency`: pass
- `corepack pnpm check:ai-deck-doctrine-strategy`: pass
- `corepack pnpm --filter @netgrid/ai test`: pass
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`: pass
- `corepack pnpm --filter @netgrid/web exec tsc -p tsconfig.json --noEmit`: pass
- `git diff --check`: pass
