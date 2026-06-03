# AI028-R: NETGRID Semantic Audit Pack Refresh

Stand: 2026-06-03
Guide: V3 (docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md)
Branch: main
HEAD: 333ccfd2
Supersedes: AI028
Post-Batches: AI023-2, AI029, AI030
Status: verified

## Kurzfazit

AI028-R ersetzt AI028 als aktuelle globale Semantik-Baseline nach AI023-2, AI029 und AI030. Der Refresh ist read-only: keine Karten-Hints, keine Taktiksignale, keine Strategy IDs, keine Derivationsregeln und keine Runtime-, Planner-, Engine-, Legalitäts-, Targeting-, UI- oder Hidden-Info-Wirkung wurden erzeugt.

Corp-Hauptklassen sind jetzt durch die Review-Linie geschlossen: Agendas durch AI023-2, ICE durch AI024-1, Operations durch AI025-1, Nodes/Assets durch AI026-1 und Upgrades durch AI030. Die alten AI028-Warnings wurden neu klassifiziert: TargetProfile-HiddenInfoPolicy ist durch AI029 erledigt; Type-/Subtype-Signale, Legacy-/Aggregation-Signale, Descriptor-Gaps und Advancement-Counter-Condition-Split bleiben bewusst deferred.

## Scope / Out-of-Scope

Scope: aktive und compiled Runner- und Corp-Karten, aktive Test-/V08-Karten getrennt, inaktive Classic-Karten getrennt, Taktiksignale, Function-Signal-Derivations, Active Hints, Compiled Hints, Inspector Index, StrategySupportPairs, TargetProfiles, Conditions, Risks, Constraints, HiddenInfoPolicies, Legacy-/Aggregation-Signale, supportingEvidenceOnly, derivedPossibleStrategyAnchors und reviewedStrategySupportPairs.

Out-of-Scope: Karten-Hint-Änderungen, neue Taktiksignale, neue Strategy IDs, Derivationsregeländerungen, Engine-/Legalitätsänderungen, Planner-/ActionScore-/PlanWeight-Wirkung, Targeting-KI, UI-Änderungen und Chronicle-Dateien.

## Verwendete Quellen

- Guide V3: `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`
- AI-Daten: `data/ai/tactic-signals-v1.json`, `data/ai/function-signal-derivation-v1.json`, `data/ai/ai-card-hints-active.json`, `data/ai/ai-card-hints-compiled.json`, `data/ai/ai-hint-inspector-index.json`, `data/ai/strategy-goals-v1.json`, `data/ai/strategic-roles-v1.json`
- Reviews/Reports: AI023-2, AI024-1, AI025-1, AI026-1, AI027, AI028, AI029, AI030
- Kartenlisten: `data/cards/originalset-v1-cards.json`, `data/cards/proteus-cards.json`, `data/cards/classic-cards.json`, `data/cards/testset-cards.json`

## Branch / HEAD

- Branch: `main`
- HEAD: `333ccfd2`

## Externe Working-Tree-Notizen

- ?? scripts/ai023-2-corp-agendas-active-hint-sync-report-2026-06-03.json (external_unrelated_excluded)

## Gesamtcounts

- Aktive Hints: 564
- Kompilierte Hints: 564
- Inspector-Karten: 564
- Card Inventory gesamt: 618
- Semantic Profiles: 564
- Originalset aktiv: 374
- Proteus aktiv: 154
- Testset aktiv: 36 (davon V08: 14)
- Classic inaktiv: 52
- Taktiksignale: 524
- Ableitungsregeln: 621
- StrategyGoals: 20
- Reviewed StrategySupportPairs: 252
- Derived possible StrategyAnchors: 264
- TargetProfiles: 73
- Conditions: 595
- Risks: 853
- Constraints: 314
- HiddenInfoPolicy-Einträge: 74

## Corp-Klassenabdeckung

- Agendas: covered; coveredBy=AI023-2; active/compiled=46; production=43; inspectorMissing=0
- ICE: covered; coveredBy=AI024-1; active/compiled=103; production=95; inspectorMissing=0
- Operations: covered; coveredBy=AI025-1; active/compiled=40; production=35; inspectorMissing=0
- Nodes/Assets: covered; coveredBy=AI026-1; active/compiled=54; production=52; inspectorMissing=0
- Upgrades: covered; coveredBy=AI030; active/compiled=40; production=39; inspectorMissing=0

## Runner-Klassenabdeckung

- Identity: covered; active/compiled=1; inspectorMissing=0; tacticSignalCards=0
- Programs: covered; active/compiled=105; inspectorMissing=0; tacticSignalCards=0
- Events: covered; active/compiled=76; inspectorMissing=0; tacticSignalCards=0
- Hardware: covered; active/compiled=37; inspectorMissing=0; tacticSignalCards=0
- Resources: covered; active/compiled=61; inspectorMissing=0; tacticSignalCards=0

## Signal-Katalog-Status

- Katalogisierte Signale: 524
- Aktive Taktiksignal-Klassen: 220
- Inspector-derived Signal-Klassen: 427
- Unkatalogisierte genutzte Signale: 0
- Support-only-Signale: 369
- Legacy-/Aggregation-Warnklassen mit direkter Nutzung: 2

## StrategySupportPair-Status

Reviewed StrategySupportPairs und derived possible StrategyAnchors bleiben als getrennte Inventare mit eigenen `inventoryKind`- und `sourceField`-Werten erhalten. Wertüberschneidungen zwischen `lineSupport` und derived Signals werden nicht in AI028-R umgedeutet, weil der Refresh keine Semantikdaten ändert.

## TargetProfile-/Condition-/Risk-/Constraint-Status

- TargetProfiles ohne HiddenInfoPolicy: 0
- Conditions: 595
- Risks: 853
- Constraints: 314
- Descriptor-/Function-Descriptor-Warning-Karten: 61

## HiddenInfo-Status

AI028-R erzeugt keine neue PlayerView-, WebSocket-, Reconnect-, Undo-, Replay-, Log- oder Client-Error-Projektion. Unrezzed Upgrades und verdeckte Agendas bleiben side-safe; Inspector- und Review-Daten bleiben Entwickler-/Katalog-Evidence.

## Test-/V08-Trennung

- Aktive Test-Fixtures: 36
- Aktive V08-Fixtures: 14
- Inaktive Test-Fixtures: 2
- Inaktive Classic-Karten: 52
- `simple_upgrade`: test_fixture_no_active_tactical_semantics; tacticSignals=0

## Findings nach Severity

- Error Findings: 0
- Warning Findings: 4
- Info Findings: 6

### Error Findings

- Keine

### Warning Findings

- AI028-R-F005 [taxonomy]: Potential type/subtype-shaped support-only breaker signals remain: breaker.code_gate, breaker.sentry, breaker.wall
- AI028-R-F006 [legacy]: Legacy/aggregation signal classes still have direct card usage: action.corp_repeatable_extra_action=2, damage.payoff=42
- AI028-R-F007 [constraint]: 61 cards still carry descriptor or function-signal descriptor warnings.
- AI028-R-F008 [condition]: The broad requires_advancement_counter condition remains deferred until source/target action semantics exist.

## Wichtigste verbleibende Warnings

- Type-/Subtype-förmige Breaker-Signale bleiben support-only Taxonomie-Follow-up.
- Legacy-/Aggregation-Signale mit direkter Nutzung bleiben Deferred Items.
- Descriptor-/Function-Descriptor-Warnings bleiben Schemaarbeit, nicht AI028-R-Semantikänderung.
- `requires_advancement_counter` bleibt breit, bis Action-/Target-Semantik source/target trennt.

## Empfohlene nächste Schritte

- AI031 [normal]: Tactic-signal taxonomy cleanup. 3 support-only type/subtype-shaped breaker signals remain candidates for taxonomy cleanup.
- AI032 [normal]: Legacy aggregation signal retirement review. 2 direct legacy/aggregation signal classes remain after AI029 and AI030.
- AI033 [normal]: Descriptor schema design. 61 descriptor/function-signal descriptor warning cards need schema-level handling before bulk rewrite.
- AI034 [low]: Advancement source-target condition split. 11 broad advancement-counter conditions should wait for action/target semantics.

## Verifikation

Status: passed

- node scripts/check-ai023-2-corp-agendas-active-hint-sync.mjs: passed
- node scripts/check-ai024-1-corp-ice-semantics-polish.mjs: passed
- node scripts/check-ai025-1-corp-operations-semantics-polish.mjs: passed
- node scripts/check-ai026-1-corp-nodes-assets-semantics-polish.mjs: passed
- node scripts/check-ai027-derivation-inspector-guide-v3-alignment.mjs: passed
- node scripts/check-ai028-r-netgrid-semantic-audit-pack-refresh.mjs: passed
- node scripts/check-ai029-target-condition-constraint-schema-sweep.mjs: passed
- node scripts/check-ai030-corp-upgrades-semantics.mjs: passed
- corepack pnpm check:ai-strategy-taxonomy: passed
- corepack pnpm check:ai-hint-quality: passed
- corepack pnpm check:ai-hint-compiled-index: passed
- corepack pnpm check:ai-approval-consistency: passed
- corepack pnpm check:ai-deck-doctrine-strategy: passed
- corepack pnpm check:ai-compiled-hints: passed
- corepack pnpm check:ai-hint-inspector-index: passed
- corepack pnpm --filter @netgrid/ai test: passed
- corepack pnpm --filter @netgrid/ai typecheck: passed
- corepack pnpm --filter @netgrid/web typecheck: passed
- git diff --check: passed

## No-Effect-Bestätigung

Alle no-effect Flags sind false: Planner, ActionScore, PlanWeight, Targeting-AI, Engine, Legal, Profile/Default, UI-Derivation und Hidden-Info-Leak.
