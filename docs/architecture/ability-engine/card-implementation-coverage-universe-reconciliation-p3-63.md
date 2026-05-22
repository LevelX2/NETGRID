# P3.63 CardImplementation Coverage Universe Reconciliation

Stand: 2026-05-22

## Ergebnis

P3.63 klärt das Coverage-Universum: Der aktuelle ONR-v1-Release-Scope umfasst 374 Karten. Davon haben 373 eine registrierte CardImplementation und Tycho Extension ist korrekt als `no_engine_behavior_required` klassifiziert. Innerhalb von ONR-v1 bleiben damit keine `pending_implementation`-, `partial_implementation`- oder `legacy_engine_special_case`-Karten.

Die in der Aufgabenbeschreibung genannten `pending=127` sind in diesem Worktree nach P3.62 nicht reproduzierbar. Der reproduzierte Ausgangswert vor P3.63 ist `pending=55`: 52 lokale Demo-/Test-/Harness-CardDefinitions plus 3 Proteus-Planungs-/Harness-CardDefinitions. Diese Karten sind keine ONR-v1-Karten und wurden in P3.63 als `outside_current_release_scope` klassifiziert.

## Vergleichstabelle

| Universum | Anzahl | Quelle | Befund |
|---|---:|---|---|
| Runner-Spoilerkarten | 187 | `docs/source/Runnerspoiler 1.0.txt`; validiertes Inventory | ONR-v1-Scope |
| Corp-Spoilerkarten | 187 | `docs/source/Corpspoiler 1.0.txt`; validiertes Inventory | ONR-v1-Scope |
| ONR-v1-CardDefinitions | 374 | `data/cards/originalset-v1-cards.json`; `onr_v1_\d{3}_` IDs in `packages/shared/src/index.ts` | vollständig im Release-Scope |
| Shared CardDefinitions gesamt | 429 | `packages/shared/src/index.ts` | 374 ONR-v1, 55 außerhalb Scope |
| Coverage-Einträge gesamt | 429 | `packages/engine/src/card-implementations/coverage.ts` | deckt alle Shared-Demo-Definitionen ab |
| Registry-Einträge | 373 | `packages/engine/src/card-implementations/registry.ts` | alle registrierten IDs sind ONR-v1 |
| CardImplementation-Dateien | 373 | `packages/engine/src/card-implementations/onr-v1/` | alle enthalten ONR-v1-Definitionen |

## Coverage-Status nach P3.63

| Status | Anzahl | Scope |
|---|---:|---|
| `implemented` | 373 | ONR-v1 |
| `no_engine_behavior_required` | 1 | ONR-v1, Tycho Extension |
| `pending_implementation` | 0 | ONR-v1 |
| `partial_implementation` | 0 | ONR-v1 |
| `legacy_engine_special_case` | 0 | ONR-v1 |
| `outside_current_release_scope` | 55 | nicht ONR-v1 |

## ONR-v1-Scope-Regel

ONR-v1 wird im aktuellen Code eindeutig über `CardDefinitionId` erkannt:

```text
^onr_v1_\d{3}_
```

Diese Regel deckt exakt die 374 IDs aus `data/cards/originalset-v1-cards.json` ab. Es gibt keine ONR-v1-CardDefinition ohne Coverage, keine Coverage-ID ohne Shared-CardDefinition und keine registrierte CardImplementation außerhalb dieses Scopes.

## Reststatus-Tabelle

| CardDefinitionId | Title | Side | Type | Set/Scope | In ONR v1 Spoiler? | Current Coverage | Recommended Status | Reason |
|---|---|---|---|---|---|---|---|---|
| corp_identity_001 | Corp Identity | corp | identity | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| efficient_fracter | Efficient Fracter | runner | program | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| onr_proteus_020_digiconda | Digiconda | corp | ice | Proteus planning harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| onr_proteus_022_food-fight | Food Fight | corp | ice | Proteus planning harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| onr_proteus_041_toughoniumtm-wall | Toughonium™ Wall | corp | ice | Proteus planning harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| runner_identity_001 | Runner Identity | runner | identity | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_agenda | Simple Agenda | corp | agenda | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_barrier_ice | Simple Barrier ICE | corp | ice | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_code_gate_ice | Simple Code Gate ICE | corp | ice | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_decoder | Simple Decoder | runner | program | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_draw_event | Simple Draw Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_draw_operation | Simple Draw Operation | corp | operation | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_economy_asset | Simple Economy Asset | corp | asset | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_economy_event | Simple Economy Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_economy_operation | Simple Economy Operation | corp | operation | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_fracter | Simple Fracter | runner | program | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_killer | Simple Killer | runner | program | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_priority_agenda | Simple Priority Agenda | corp | agenda | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_run_event | Simple Run Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_sentry_ice | Simple Sentry ICE | corp | ice | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_setup_hardware | Simple Setup Hardware | runner | hardware | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_tag_ice | Simple Tag ICE | corp | ice | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_tag_punishment_operation | Simple Tag Punishment Operation | corp | operation | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_taxing_barrier_ice | Simple Taxing Barrier ICE | corp | ice | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| simple_upgrade | Simple Upgrade | corp | upgrade | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_adaptive_killer | Adaptive Killer | runner | program | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_archive_planning_operation | Archive Planning Operation | corp | operation | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_burst_credit_event | Burst Credit Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_cashout_asset | Cashout Asset | corp | asset | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_credit_surge_operation | Credit Surge Operation | corp | operation | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_deep_draw_event | Deep Draw Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_gate_ice | Gate ICE | corp | ice | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_memory_chip | Memory Chip | runner | hardware | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_overclock_run_event | Overclock Run Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_precise_decoder | Precise Decoder | runner | program | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_project_agenda | Project Agenda | corp | agenda | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_steady_fracter | Steady Fracter | runner | program | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_wall_ice | Wall ICE | corp | ice | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v08_watchdog_ice | Watchdog ICE | corp | ice | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v094_neural_sentry_ice | Neural Sentry ICE | corp | ice | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v095_safehouse_resource | Safehouse Resource | runner | resource | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v096_trace_probe_ice | Trace Probe ICE | corp | ice | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v097_deep_dive_event | Deep Dive Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v098_corp_identity | Identity Lab Corp | corp | identity | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v098_expose_event | Expose Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v098_hq_rd_swap_operation | HQ R&D Swap Operation | corp | operation | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v098_reveal_top_event | Public Reveal Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v098_runner_identity | Identity Lab Runner | runner | identity | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v098_stack_arrange_event | Stack Arrange Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v098_stack_search_event | Stack Search Event | runner | event | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v099_bad_publicity_operation | Bad Publicity Operation | corp | operation | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v099_host_resource | Host Resource | runner | resource | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v099_recurring_chip | Recurring Chip | runner | hardware | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v099_virus_program | Virus Program | runner | program | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |
| v111_core_damage_operation | Core Damage Harness | corp | operation | Local demo/test harness | No | pending_implementation | outside_current_release_scope | Not part of ONR-v1 release scope. |

## Direkte Karten-ID-Reste in Engine-Pipelines

| File | CardDefinitionId | Purpose | Still Needed? | Recommendation |
|---|---|---|---|---|
| `packages/engine/src/index.ts` | multiple ONR-v1 IDs | CardImplementation adapter constants, payload compatibility, choice-source labels, and guarded legacy fallback branches. | Yes for current P3 scope. | Keep in P3.63; remove only in a later typed-effect/payload migration. |
| `packages/engine/src/ability-engine/active-modifiers.ts` | `onr_v1_277_virizz` | Break-cost modifier bridge. | Yes. | Keep until break-cost modifier querying is fully data-driven. |
| `packages/engine/src/mechanics/*.ts` | multiple ONR-v1 IDs grouped by mechanic family | Named constants used by current resolver/adaptor families. | Yes. | Legitimate transitional mechanic constants; do not change in reconciliation batch. |
| `packages/engine/src/public-context.ts` | none found | No direct ONR-v1 card IDs found. | N/A | No action. |

No direct card-ID residue in the searched Engine paths points to a non-ONR-v1 pending card. No direct ID residue proves a missing ONR-v1 implementation.

## Registry/Coverage-Konsistenz

- 373 CardImplementation-Dateien existieren under `packages/engine/src/card-implementations/onr-v1/`.
- 373 CardImplementations sind registriert.
- 373 registrierte Implementations haben `implemented` Coverage.
- Tycho Extension hat `no_engine_behavior_required`.
- Keine ONR-v1-Karte bleibt pending.
- Keine `outside_current_release_scope`-Karte hat einen Registry-Eintrag.
- Keine doppelten Registry-IDs oder Coverage-IDs sind erlaubt; der Test `requires implementation coverage for every demo card` prüft diese Invarianten.

## Nächster Schritt

Kein neuer Mechanikbatch ist nötig, um ONR-v1-Coverage zu schließen. Der nächste sinnvolle Schritt ist ein kleiner Architektur-/Cleanup-Batch, der die weiterhin legitimen direkten Karten-ID-Konstanten in Engine-Adapterpfaden gezielt reduziert, sobald ein typisierter Effect-/Payload-Vertrag dafür bereitsteht.
