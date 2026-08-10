import { CARD_DEFINITIONS_BY_ID } from "../card-definitions";
/**
 * Reports CardImplementation coverage for the original set.
 *
 * Coverage is metadata for planning, audits, and tests. It must not influence
 * runtime legality or execute card behavior; implemented behavior comes from
 * the registry and the ability-engine runtime.
 */
import type { CardDefinitionId } from "@netgrid/shared";
import {
  cardSpecImplementationDefinitionIds,
  cardSpecRuntimeDefinitionIds,
  cardSpecSourceRefByDefinitionId,
} from "@netgrid/cards/engine";
import { CARD_IMPLEMENTATIONS } from "./registry";
import { IMPLEMENTED_CARD_LOCATION_BY_DEFINITION_ID } from "./coverage-source-locations";

export type CardImplementationCoverageStatus =
  | "implemented"
  | "partial_implementation"
  | "legacy_engine_special_case"
  | "no_engine_behavior_required"
  | "outside_current_release_scope"
  | "pending_implementation";

export type CardImplementationCoverageEntry = {
  cardDefinitionId: CardDefinitionId;
  status: CardImplementationCoverageStatus;
  reason: string;
  currentLocations?: string[];
};

const IMPLEMENTED_REZ_COST_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_INSTALL_COST_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_STEAL_COST_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_TRASH_COST_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_BREAK_SUBROUTINE_COST_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ICE_STRENGTH_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ADDITIONAL_SUBROUTINE_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_PRINTED_SUBROUTINE_LOCATION =
  "packages/engine/src/card-implementations/onr-v1/corp/ice";

const IMPLEMENTED_ICEBREAKER_ABILITY_LOCATION =
  "packages/engine/src/card-implementations/onr-v1/runner/programs";

const IMPLEMENTED_RUNNER_COUNTER_EFFECT_LOCATION =
  "packages/engine/src/card-implementations/onr-v1/corp/ice";

const IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ON_PLAY_EFFECT_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ACTIVATED_ABILITY_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ACCESS_EFFECT_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_RESTRICTED_HOSTED_CREDIT_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_HOSTED_PROGRAM_LOCATION =
  "packages/engine/src/card-implementations/onr-v1/runner/programs";

const IMPLEMENTED_DAMAGE_PREVENTION_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_TAG_TRASH_PREVENTION_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_RUN_CONTROL_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_VIRUS_COUNTER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1/runner/programs";

const IMPLEMENTED_SCORED_AGENDA_LOCATION =
  "packages/engine/src/card-implementations/onr-v1/corp/agendas";

const IMPLEMENTED_CORP_UTILITY_LOCATION =
  "packages/engine/src/card-implementations/onr-v1/corp";

const IMPLEMENTED_FORT_RUN_WINDOW_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_RUN_ENCOUNTER_INTERVENTION_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_VARIABLE_REZ_LOCATION =
  "packages/engine/src/card-implementations";

const IMPLEMENTED_HIDDEN_REPLACEMENT_LONGTAIL_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const CURRENT_RELEASE_CARD_DEFINITION_ID_PATTERN = /^onr_v1_\d{3}_/;
const CARD_SPEC_IMPLEMENTATION_DEFINITION_IDS = new Set<string>(
  cardSpecImplementationDefinitionIds(),
);
const CARD_SPEC_RUNTIME_DEFINITION_IDS = new Set<string>(
  cardSpecRuntimeDefinitionIds(),
);

export function isCurrentCardImplementationReleaseScopeDefinitionId(
  definitionId: CardDefinitionId,
): boolean {
  return CURRENT_RELEASE_CARD_DEFINITION_ID_PATTERN.test(definitionId);
}

function implementedCoverageFor(
  implementation: (typeof CARD_IMPLEMENTATIONS)[number],
): CardImplementationCoverageEntry {
  if (
    CARD_SPEC_IMPLEMENTATION_DEFINITION_IDS.has(implementation.cardDefinitionId)
  ) {
    const sourceRef = cardSpecSourceRefByDefinitionId(
      implementation.cardDefinitionId,
    );
    if (sourceRef === undefined)
      throw new Error(
        `card_spec_coverage_source_ref_missing: ${implementation.cardDefinitionId}`,
      );
    return {
      cardDefinitionId: implementation.cardDefinitionId,
      status: "implemented",
      reason:
        "CardSpec registry mechanical contract projects runtime behavior.",
      currentLocations: [sourceRef.sourcePath],
    };
  }
  const reasons: string[] = [];
  const currentLocations = new Set<string>();

  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "rez_cost")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive Corp rez-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_REZ_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "ice_strength",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive ICE-strength modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_ICE_STRENGTH_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "install_cost",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive Corp install-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_INSTALL_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "new_data_fort_creation_lock",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive new data-fort creation lock behavior.",
    );
    currentLocations.add(IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "steal_cost")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive access agenda steal-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_STEAL_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "additional_subroutine",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive additional-subroutine modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_ADDITIONAL_SUBROUTINE_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "hand_size")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive hand-size modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "memory_units",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive memory-unit modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "agenda_difficulty",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive agenda-difficulty modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "trash_cost")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive access trash-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_TRASH_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "break_subroutine_cost",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive break-subroutine-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_BREAK_SUBROUTINE_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some(
      (modifier) => modifier.kind === "access_count",
    )
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive access-count modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_PASSIVE_ATTRIBUTE_MODIFIER_LOCATION);
  }
  if (implementation.advanceable) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for installed before/after-rez advanceable behavior.",
    );
    currentLocations.add(IMPLEMENTED_ACTIVATED_ABILITY_LOCATION);
  }
  if (implementation.accessHooks?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for access-context hook behavior.",
    );
    currentLocations.add(IMPLEMENTED_ON_PLAY_EFFECT_LOCATION);
  }
  if (implementation.accessEffects?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for Corp access-effect behavior.",
    );
    currentLocations.add(IMPLEMENTED_ACCESS_EFFECT_LOCATION);
  }
  if (implementation.printedSubroutines?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for printed ICE subroutine behavior.",
    );
    currentLocations.add(IMPLEMENTED_PRINTED_SUBROUTINE_LOCATION);
  }
  if (implementation.runnerCounterEffects?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for Runner trace-counter lifecycle and removal behavior.",
    );
    currentLocations.add(IMPLEMENTED_RUNNER_COUNTER_EFFECT_LOCATION);
  }
  if (implementation.icebreakerAbilities?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for simple Runner icebreaker break/pump ability behavior.",
    );
    currentLocations.add(IMPLEMENTED_ICEBREAKER_ABILITY_LOCATION);
  }
  if (implementation.abilities?.some((ability) => ability.kind === "on_play")) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for printed-cost on-play effect behavior.",
    );
    currentLocations.add(IMPLEMENTED_ON_PLAY_EFFECT_LOCATION);
  }
  if (
    implementation.abilities?.some((ability) => ability.kind === "activated")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for activated main-action ability behavior.",
    );
    currentLocations.add(IMPLEMENTED_ACTIVATED_ABILITY_LOCATION);
  }
  if (implementation.restrictedHostedCreditSource) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for restricted hosted-credit source behavior.",
    );
    currentLocations.add(IMPLEMENTED_RESTRICTED_HOSTED_CREDIT_LOCATION);
  }
  if (implementation.hostedProgramCapacity) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for Daemon hosted-program capacity and host cleanup behavior.",
    );
    currentLocations.add(IMPLEMENTED_HOSTED_PROGRAM_LOCATION);
  }
  if (implementation.hostedProgramModifiers?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for hosted-program modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_HOSTED_PROGRAM_LOCATION);
  }
  if (implementation.installAdditionalCosts?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition declares additional install cost behavior.",
    );
    currentLocations.add(IMPLEMENTED_RESTRICTED_HOSTED_CREDIT_LOCATION);
  }
  if (implementation.installTargetBinding) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for install-time public fort target binding behavior.",
    );
    currentLocations.add(IMPLEMENTED_FORT_RUN_WINDOW_LOCATION);
  }
  if (implementation.damagePreventionSources?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for damage-prevention source behavior.",
    );
    currentLocations.add(IMPLEMENTED_DAMAGE_PREVENTION_LOCATION);
  }
  if (implementation.flatlineReplacementSources?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for flatline-replacement source behavior.",
    );
    currentLocations.add(IMPLEMENTED_DAMAGE_PREVENTION_LOCATION);
  }
  if (implementation.tagPreventionSources?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for tag-prevention source behavior.",
    );
    currentLocations.add(IMPLEMENTED_TAG_TRASH_PREVENTION_LOCATION);
  }
  if (implementation.trashPreventionSources?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for installed Runner trash-prevention source behavior.",
    );
    currentLocations.add(IMPLEMENTED_TAG_TRASH_PREVENTION_LOCATION);
  }
  if (implementation.successfulRunFollowups?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for successful-run follow-up behavior.",
    );
    currentLocations.add(IMPLEMENTED_RUN_CONTROL_LOCATION);
  }
  if (implementation.fortRunWindows?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for fort-run window ICE-control behavior.",
    );
    currentLocations.add(IMPLEMENTED_FORT_RUN_WINDOW_LOCATION);
  }
  if (implementation.regionBaseline) {
    reasons.push(
      "Engine-local CardImplementationDefinition declares existing Region install baseline behavior.",
    );
    currentLocations.add(IMPLEMENTED_FORT_RUN_WINDOW_LOCATION);
  }
  if (implementation.installCapabilities?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for fort-scoped install capability behavior.",
    );
    currentLocations.add(IMPLEMENTED_FORT_RUN_WINDOW_LOCATION);
  }
  if (implementation.fortCapacityModifiers?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for fort agenda/node capacity behavior.",
    );
    currentLocations.add(IMPLEMENTED_FORT_RUN_WINDOW_LOCATION);
  }
  if (implementation.leavePlayCleanup?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for fort capacity leave-play cleanup behavior.",
    );
    currentLocations.add(IMPLEMENTED_FORT_RUN_WINDOW_LOCATION);
  }
  if (implementation.runEncounterInterventions?.length) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for run/encounter intervention behavior.",
    );
    currentLocations.add(IMPLEMENTED_RUN_ENCOUNTER_INTERVENTION_LOCATION);
  }
  if (implementation.variableRez) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for variable rez and persistent variable ICE state behavior.",
    );
    currentLocations.add(IMPLEMENTED_VARIABLE_REZ_LOCATION);
  }
  if (implementation.relativeIce) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for relative ICE count behavior.",
    );
    currentLocations.add(IMPLEMENTED_VARIABLE_REZ_LOCATION);
  }
  if (implementation.virusCounter) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for Virus-counter successful-run, start-of-turn and purge-linked behavior.",
    );
    currentLocations.add(IMPLEMENTED_VIRUS_COUNTER_LOCATION);
  }
  if (implementation.scoredAgenda) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for scored agenda on-score, scored-area ability or persistent scored modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_SCORED_AGENDA_LOCATION);
  }
  if (implementation.corpUtility) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for Corp utility operation/node behavior.",
    );
    currentLocations.add(IMPLEMENTED_CORP_UTILITY_LOCATION);
  }
  if (implementation.hiddenReplacementLongtail) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for hidden-order, secret-choice or deferred replacement longtail behavior.",
    );
    currentLocations.add(IMPLEMENTED_HIDDEN_REPLACEMENT_LONGTAIL_LOCATION);
  }
  if (implementation.runnerUtilityLongtail) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for Runner utility, trace, trash-replacement or lifecycle longtail behavior.",
    );
    currentLocations.add(IMPLEMENTED_HIDDEN_REPLACEMENT_LONGTAIL_LOCATION);
  }
  if (implementation.runnerEventLongtail) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for Runner event longtail behavior.",
    );
    currentLocations.add(IMPLEMENTED_ON_PLAY_EFFECT_LOCATION);
  }
  if (implementation.uniqueDirectLongtail) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for unique/direct-ability longtail behavior.",
    );
    currentLocations.add(IMPLEMENTED_ACTIVATED_ABILITY_LOCATION);
  }
  if (implementation.remainingReplacementLongtail) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for P3.61 remaining replacement, trace-credit, draw-modifier or counter longtail behavior.",
    );
    currentLocations.add(IMPLEMENTED_HIDDEN_REPLACEMENT_LONGTAIL_LOCATION);
  }
  if (implementation.unique) {
    reasons.push(
      "Engine-local CardImplementationDefinition declares unique-by-title behavior.",
    );
    currentLocations.add(IMPLEMENTED_ACTIVATED_ABILITY_LOCATION);
  }

  return {
    cardDefinitionId: implementation.cardDefinitionId,
    status: "implemented",
    reason:
      reasons.join(" ") ||
      "Engine-local CardImplementationDefinition exists for card behavior.",
    currentLocations: [
      IMPLEMENTED_CARD_LOCATION_BY_DEFINITION_ID[
        implementation.cardDefinitionId
      ] ?? [...currentLocations][0],
    ].filter((location): location is string => Boolean(location)),
  };
}

const IMPLEMENTED_COVERAGE_ENTRIES: CardImplementationCoverageEntry[] =
  CARD_IMPLEMENTATIONS.map(implementedCoverageFor);

export const CARD_IMPLEMENTATION_COVERAGE_OVERRIDES: readonly CardImplementationCoverageEntry[] =
  [
    {
      cardDefinitionId: "onr_v1_220_tycho-extension",
      status: "no_engine_behavior_required",
      reason:
        "Tycho Extension has no additional rules text; normal agenda scoring and agenda points come from the CardDefinition data.",
      currentLocations: ["packages/shared/src/card-definitions.ts"],
    },
  ];

function pendingCoverageFor(
  cardDefinitionId: CardDefinitionId,
): CardImplementationCoverageEntry {
  if (
    CARD_SPEC_RUNTIME_DEFINITION_IDS.has(cardDefinitionId) &&
    !CARD_SPEC_IMPLEMENTATION_DEFINITION_IDS.has(cardDefinitionId)
  ) {
    const sourceRef = cardSpecSourceRefByDefinitionId(cardDefinitionId);
    if (sourceRef === undefined)
      throw new Error(
        `card_spec_definition_coverage_source_ref_missing: ${cardDefinitionId}`,
      );
    return {
      cardDefinitionId,
      status: "no_engine_behavior_required",
      reason:
        "CardSpec definition and generic printed-card rules own runtime behavior without a projected CardImplementation.",
      currentLocations: [sourceRef.sourcePath],
    };
  }
  if (!isCurrentCardImplementationReleaseScopeDefinitionId(cardDefinitionId)) {
    return {
      cardDefinitionId,
      status: "outside_current_release_scope",
      reason:
        "CardDefinition is a demo, test harness, Proteus planning, or non-ONR-v1 catalog card outside the current CardImplementation release scope.",
    };
  }

  return {
    cardDefinitionId,
    status: "pending_implementation",
    reason:
      "Known card has not yet been explicitly classified beyond the default conservative coverage status.",
  };
}

export const CARD_IMPLEMENTATION_COVERAGE_BY_DEFINITION_ID: Partial<
  Record<CardDefinitionId, CardImplementationCoverageEntry>
> = {
  ...Object.fromEntries(
    Object.keys(CARD_DEFINITIONS_BY_ID).map((cardDefinitionId) => [
      cardDefinitionId,
      pendingCoverageFor(cardDefinitionId),
    ]),
  ),
  ...Object.fromEntries(
    IMPLEMENTED_COVERAGE_ENTRIES.map((entry) => [
      entry.cardDefinitionId,
      entry,
    ]),
  ),
  ...Object.fromEntries(
    CARD_IMPLEMENTATION_COVERAGE_OVERRIDES.map((entry) => [
      entry.cardDefinitionId,
      entry,
    ]),
  ),
};

export const CARD_IMPLEMENTATION_COVERAGE_ENTRIES: readonly CardImplementationCoverageEntry[] =
  Object.values(CARD_IMPLEMENTATION_COVERAGE_BY_DEFINITION_ID).filter(
    (entry): entry is CardImplementationCoverageEntry => Boolean(entry),
  );

/**
 * Returns the current coverage status for a card definition id.
 */
export function cardImplementationCoverageForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationCoverageEntry | undefined {
  return CARD_IMPLEMENTATION_COVERAGE_BY_DEFINITION_ID[definitionId];
}
