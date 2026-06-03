# AI028: NETGRID Semantic Audit Pack

Stand: 2026-06-03
Guide: V3 (docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md)
Source Commit: 330e9cb0
Status: verified

## Scope

AI028 ist ein globales, maschinenlesbares Audit-Pack nach AI024-1, AI025-1, AI026-1 und AI027. Der Lauf ist bewusst read-only: keine Card-Hints, Taktiksignale, Strategie-IDs, Ableitungsregeln, Inspector-Logik, Runtime-, Planner-, Engine-, Legal-, Targeting- oder UI-Pfade wurden semantisch geändert.

## Counts

- Aktive Hints: 564
- Kompilierte Hints: 564
- Inspector-Karten: 564
- Card Inventory gesamt: 618
- Semantic Profiles: 564
- Originalset aktiv: 374
- Proteus aktiv: 154
- Testset aktiv: 36 (davon V08: 14)
- Classic inaktiv: 52
- Taktiksignale: 507
- Ableitungsregeln: 589
- StrategyGoals: 20
- Reviewed StrategySupportPairs: 226
- Derived possible StrategyAnchors: 238
- TargetProfiles: 56
- Conditions: 575
- Risk-Inventar-Einträge: 890
- Constraint-Inventar-Einträge: 288
- Hidden-Info-Policy-Einträge: 57

## Coverage

Das JSON enthält die geforderten Maschineninventare: Card Inventory, Card Semantic Profiles, Signal Catalog Summary, Signal Usage Index, StrategySupportPair-Inventar, TargetProfile-, Condition-, Risk-, Constraint- und Hidden-Info-Policy-Inventare, Legacy-/Aggregation-Signale, Supporting-Evidence-only-Signale, getrennte Inventare für derivedPossibleStrategyAnchors und reviewedStrategySupportPairs sowie die Test-/V08-/Classic-Separation.

## Guide-V3 Findings

- Error Findings: 0
- Warning Findings: 4
- Info Findings: 7

- AI028-F001 [info/taxonomy]: Strategy-goal taxonomy remains at 20 IDs; AI028 adds no strategy ID. Empfehlung: Keep AI028 as evidence only.
- AI028-F002 [info/taxonomy]: All active, compiled and inspector-derived tactic signals are cataloged. Empfehlung: No AI028 semantic change.
- AI028-F003 [warning/taxonomy]: Potential type/subtype-shaped signal IDs need later review: breaker.code_gate, breaker.sentry, breaker.wall Empfehlung: Review as taxonomy candidates; do not rename inside AI028.
- AI028-F004 [warning/legacy]: Legacy/aggregation signals still appear directly on cards: action.corp_repeatable_extra_action=2, damage.payoff=40 Empfehlung: Keep as deferred evidence unless a later batch replaces the direct card usage with precise signals.
- AI028-F005 [info/card_semantics]: No damage-kill anchor was detected that relies only on broad damage.payoff. Empfehlung: No AI028 semantic change.
- AI028-F006 [info/strategy_anchor]: 226 reviewed StrategySupportPair entries are sourced from lineSupport; derivedPossibleStrategyAnchors stay separate. Empfehlung: No AI028 semantic change.
- AI028-F007 [warning/target_profile]: 3 TargetProfile(s) lack an explicit hiddenInfoPolicy. Empfehlung: Add or normalize policy fields in a later TargetProfile schema batch.
- AI028-F008 [info/hidden_info]: 57 hidden-info policy inventory entries have no private-state/token wording. Empfehlung: No AI028 semantic change.
- AI028-F009 [warning/constraint]: 28 card(s) still have inspector descriptor gaps; classify as deferred schema/descriptor work. Empfehlung: Triage descriptor gaps separately; AI028 only records them.
- AI028-F010 [info/condition]: 575 machine-readable condition entries are inventoried for later schema review. Empfehlung: Use this inventory as the baseline for a later condition normalization batch.
- AI028-F011 [info/test_fixture]: 36 active Testset cards, including 14 V08 cards, are separated from production inventories; 52 Classic cards remain inactive. Empfehlung: Keep fixture and inactive Classic counts separate in future semantic reports.

## Taxonomy Smells

- Type-/Subtype-Signal-Smells: 3
- Support-only-Signale mit erlaubten Anchors: 0
- May-anchor ohne erlaubte Anchors: 0
- Unkatalogisierte genutzte Signale: 0
- Direkte Legacy-/Aggregation-Nutzung: 2
- Broad-Damage-only-Anker: 0
- Reviewed-Pairs mit Nicht-lineSupport-Quelle: 0
- TargetProfiles ohne HiddenInfoPolicy: 3
- Unsichere Hidden-Info-Policy-Refs: 0
- Descriptor-Gap-Karten: 28

### Inspector Warning Categories

- deferred_requires_human_review: 64
- legacy_fallback_only: 53
- descriptor_gap: 45
- function_signal_descriptor_gap: 28

## Test-/V08-/Classic-Separation

Die Fixture-Separation nutzt Set-Quelle und Card-ID, nicht bloße Titelstrings. Produktionskarten mit "Test" im Namen bleiben Produktionskarten. Aktive Testset-Fixtures: 36; aktive V08-Fixtures: 14; inaktive Classic-Karten: 52.

## Deferred Items

- AI028-D001 [target_profile/deferred]: 56 TargetProfile entries are inventoried but not normalized by AI028. Vorschlag: AI029 TargetProfile schema and purpose normalization
- AI028-D002 [condition/deferred]: 575 condition entries are inventoried; AI028 does not change condition names or shapes. Vorschlag: AI029/AI030 Condition catalog cleanup
- AI028-D003 [legacy/deferred]: 2 legacy aggregation signal class(es) still have direct card usage and remain evidence-only candidates. Vorschlag: AI030 Legacy aggregation signal retirement review
- AI028-D004 [constraint/deferred]: 28 inspector descriptor-gap card(s) remain outside AI028 scope. Vorschlag: AI030 Descriptor-gap triage

## Recommended Followups

- AI029 [normal]: TargetProfile-, Condition- und Constraint-Schema-Sweep. 56 TargetProfiles and 575 Conditions are now inventoried for a controlled schema cleanup without changing strategy IDs.
- AI030 [normal]: Descriptor-gap and legacy aggregation triage. 28 descriptor-gap cards and 2 direct legacy aggregation signal classes need candidate/deferred decisions.
- AI031 [low]: StrategySupportPair role model completion. Reviewed StrategySupportPairs are separated from derived candidates; a later batch can add explicit role-within-strategy metadata where the Guide V3 model needs it.

## No-Effect

Alle no-effect Flags sind false: Planner, ActionScore, PlanWeight, Targeting-AI, Engine, Legal, Profile/Default, UI-Derivation und Hidden-Info-Leak.

## Verification

Status: passed

- node scripts/check-ai024-1-corp-ice-semantics-polish.mjs: passed
- node scripts/check-ai025-1-corp-operations-semantics-polish.mjs: passed
- node scripts/check-ai026-1-corp-nodes-assets-semantics-polish.mjs: passed
- node scripts/check-ai027-derivation-inspector-guide-v3-alignment.mjs: passed
- node scripts/check-ai028-netgrid-semantic-audit-pack.mjs: passed
- corepack pnpm check:ai-strategy-taxonomy: passed
- corepack pnpm check:ai-hint-quality: passed
- corepack pnpm check:ai-hint-compiled-index: passed
- corepack pnpm check:ai-approval-consistency: passed
- corepack pnpm check:deck-doctrine: not_available_equivalent_passed; Equivalent: corepack pnpm check:ai-deck-doctrine-strategy
- corepack pnpm --filter @netgrid/ai test: passed
- corepack pnpm --filter @netgrid/ai typecheck: passed
- corepack pnpm --filter @netgrid/web typecheck: passed
- git diff --check: passed
