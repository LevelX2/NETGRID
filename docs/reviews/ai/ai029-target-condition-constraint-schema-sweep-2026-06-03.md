# AI029: TargetProfile-, Condition- und Constraint-Schema-Sweep

Stand: 2026-06-03
Guide: V3
Source Commit: 7727bc08
Input Audit: AI028
Status: verified

## Scope

AI029 normalisiert den schemaförmigen Teil aus AI028: TargetProfiles, Conditions, Constraints und HiddenInfoPolicy-Inventar. Der Batch erzeugt keine neue Kartenwirkung, keine Strategy ID und keine Runtime-, Planner-, Engine-, Legalitäts-, Targeting- oder UI-Wirkung.

## AI028-Warnings

- AI028-F003 [taxonomy]: defer. Deferred: type/subtype-shaped breaker signals require taxonomy review, not a TargetProfile/Condition/Constraint schema fix.
- AI028-F004 [legacy]: defer. Deferred: legacy aggregation signal retirement is card-semantic/taxonomy work and remains outside AI029.
- AI028-F007 [target_profile]: fix_in_ai029. 3 generated TargetProfiles normalized to target-profile-v1 with explicit HiddenInfoPolicy.
- AI028-F009 [constraint]: needs_schema_design. Retained as schema-gap inventory; no bulk replacement without a dedicated descriptor schema design.

## Änderungen

- TargetProfiles geändert: 3
- Conditions geändert: 0
- Constraints geändert: 0
- HiddenInfoPolicies geändert: 3

Die drei Änderungen sind generierte Search/Install-TargetProfiles. Sie behalten ihre bestehenden Ziel- und Constraint-Felder, bekommen aber vollständige `target-profile-v1`-Schemafelder und eine explizite read-only HiddenInfoPolicy.

## Inventar Vorher/Nachher

- TargetProfiles vorher: 56, missing HiddenInfoPolicy: 3
- TargetProfiles nachher: 56, missing HiddenInfoPolicy: 0
- Conditions vorher/nachher: 575/575
- Constraints vorher/nachher: 288/288
- HiddenInfoPolicy-Einträge vorher/nachher: 57/57

## Aliases Und Gaps

- condition: requires_runner_tagged -> requires_runner_tagged (present_normal_form)
- condition: requires_stolen_agenda_last_turn -> requires_stolen_agenda_last_turn (present_normal_form)
- condition: requires_trace_success -> requires_trace_success (present_normal_form)
- condition: requires_advancement_counter -> requires_advancement_counter (retained_broad_condition)
- hiddenInfoPolicy: public_or_controller_known_only -> own_private_allowed (alias_retained)
- hiddenInfoPolicy: visible_or_known_only -> visible_only (alias_retained)
- hiddenInfoPolicy: legal_targets_only -> legal_targets_only (present_normal_form)

- ai028_descriptor_gap_cards [constraint/needs_schema_design]: Descriptor gaps are not safe to bulk-convert without a dedicated descriptor schema design.
- advancement_source_target_condition_split [condition/deferred_until_action_semantics]: Guide-V3 requested source/target advancement-counter split; current hints retain broad read-only condition until Action semantics expose source/target roles.

## Deferred Items

- AI029-D001 [taxonomy/defer]: breaker.code_gate, breaker.sentry and breaker.wall remain potential type/subtype-shaped signal smells.
- AI029-D002 [legacy/defer]: action.corp_repeatable_extra_action and damage.payoff remain legacy/aggregation signal followups.
- AI029-D003 [constraint/needs_schema_design]: 28 AI028 descriptor-gap cards remain classified, not rewritten.
- AI029-D004 [condition/deferred_until_action_semantics]: Source/target advancement-counter split is deferred until action/target semantics expose source and target roles.

## No-Effect

Alle no-effect Flags sind false: Planner, ActionScore, PlanWeight, Targeting-AI, Engine, Legal, Profile/Default, UI-Derivation und Hidden-Info-Leak.

## Verification

- node scripts/check-ai028-netgrid-semantic-audit-pack.mjs: passed
- node scripts/check-ai029-target-condition-constraint-schema-sweep.mjs: passed
- corepack pnpm check:ai-strategy-taxonomy: passed
- corepack pnpm check:ai-hint-quality: passed
- corepack pnpm check:ai-hint-compiled-index: passed
- corepack pnpm check:ai-approval-consistency: passed
- corepack pnpm check:ai-deck-doctrine-strategy: passed
- corepack pnpm --filter @netgrid/ai test: passed
- corepack pnpm --filter @netgrid/ai typecheck: passed
- corepack pnpm --filter @netgrid/web typecheck: passed
- git diff --check: passed
