import { cardSpecPlanningCards } from "../packages/cards/src/planning/index";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

import { deriveCardSpecAiHint } from "../packages/ai/src/card-spec-ai-hint-compiler";

const root = fileURLToPath(new URL("..", import.meta.url));
const reportPath = path.join(
  root,
  "docs/reviews/cards/proteus-card-spec-migration-report.json",
);
const outputPath = path.join(
  root,
  "packages/ai/src/test-fixtures/proteus-card-spec-ai-hints-reviewed-v1.json",
);
const mode = process.argv.includes("--write") ? "write" : "check";
const reportSource = await readFile(reportPath);
const report = JSON.parse(reportSource.toString("utf8")) as {
  aggregateOutputFingerprint: string;
  cards: Array<{ cardDefinitionId: string }>;
};
const reviewedIds = new Set(report.cards.map((card) => card.cardDefinitionId));
const cards = cardSpecPlanningCards()
  .filter((entry) => reviewedIds.has(entry.definition.id))
  .map((entry) => ({
    cardId: entry.definition.id,
    hint: deriveCardSpecAiHint(entry),
  }))
  .sort((left, right) => left.cardId.localeCompare(right.cardId));

if (reviewedIds.size !== 151 || cards.length !== 151)
  throw new Error(
    `proteus_ai_hint_golden_partition_mismatch:${reviewedIds.size}:${cards.length}`,
  );

const golden = {
  schemaVersion: "proteus-card-spec-ai-hint-reviewed-golden-v1",
  migrationReportFingerprint: report.aggregateOutputFingerprint,
  migrationReportSha256: `sha256:${createHash("sha256")
    .update(reportSource)
    .digest("hex")}`,
  dispositions: {
    mechanicalFacts:
      "derived_only_from_closed_typed_proteus_card_spec_engine_nodes",
    sharedSubroutineFacts:
      "exact13_previously_shared_runtime_subroutines_on_10_cards_are_canonical_typed_engine_nodes_including_homing_trace_run_lock",
    closedCardStrategyEvidence:
      "card_level_profiles_are_closed_and_mechanically_validated_capability_level_anchors_remain_disjoint",
    longtailMechanicalHints:
      "eight_reviewed_family_kind_translators_preserve_typed_mechanical_hint_surfaces_with_negative_mutation_gates",
    dynamicSharedSubroutineHints:
      "relative_ice_and_x_trace_placeholders_never_compile_as_fixed_zero_values_and_are_bound_to_their_typed_dynamic_owners",
    currentRunAdditionalAccess:
      "typed_access_start_abilities_derive_exact_hq_or_rd_multiaccess_routes_and_reject_malformed_cost_condition_effect_or_visibility_shapes",
    planOwnedMechanicalRoutes:
      "typed_next_agenda_access_free_rez_post_pass_derez_and_pay_or_end_run_nodes_restore_existing_pressure_development_and_defense_owners_with_negative_shape_gates",
    planningClassifications:
      "derived_only_from_closed_typed_card_and_capability_annotations",
    scenarioAndQuality:
      "regenerated_from_current_ai_supported_scenario_evidence",
    actionCapacity:
      "exact16_profiles_on_15_cards_derived_from_typed_mechanical_owners",
    tagPreventionCosts:
      "credit_and_forgo_next_action_is_action_debt_credit_and_trash_source_is_not_an_action_penalty",
    capabilityStrategyEvidence:
      "exact27_pairs_on_17_cards_bound_to_reviewed_capability_keys_with_closed_non_tautological_detail_and_evidence",
    passiveHuntingPackPair:
      "discarded_non_action_addressable_relative_ice_trace_classification",
    disintegratorTargetProfile:
      "canonical_breaker_effect_owner_replaces_stale_legacy_timing_and_visibility_claim",
    canonicalDamageValues:
      "fixed_damage_values_derive_from_typed_mechanics_instead_of_legacy_empty_value_hints",
    streetwareEconomyValue:
      "typed_three_credit_recurring_mechanic_replaces_stale_legacy_economy_one_evaluation",
    legacyEditorialNotes: "discarded_all_nonruntime_manual_notes",
    timeToCollectLegacyCondition:
      "discard_stale_requires_program_trash_because_the_typed_owner_prevents_resource_trash_without_a_program_cost",
  },
  cards,
};
const serialized = await format(JSON.stringify(golden), {
  parser: "json",
  endOfLine: "lf",
});

if (mode === "write") {
  await writeFile(outputPath, serialized, "utf8");
  console.log(`Wrote ${path.relative(root, outputPath)}.`);
} else {
  const current = await readFile(outputPath, "utf8");
  if (current !== serialized)
    throw new Error(
      "proteus_card_spec_ai_hint_golden_drift:run_with_--write_after_review",
    );
  console.log(
    `Proteus CardSpec AI hint golden current: ${cards.length} cards.`,
  );
}
