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
  if (!CARD_SPEC_IMPLEMENTATION_DEFINITION_IDS.has(implementation.cardDefinitionId))
    throw new Error(
      `card_spec_coverage_implementation_missing: ${implementation.cardDefinitionId}`,
    );
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
    reason: "CardSpec registry mechanical contract projects runtime behavior.",
    currentLocations: [sourceRef.sourcePath],
  };
}

const IMPLEMENTED_COVERAGE_ENTRIES: CardImplementationCoverageEntry[] =
  CARD_IMPLEMENTATIONS.map(implementedCoverageFor);

export const CARD_IMPLEMENTATION_COVERAGE_OVERRIDES: readonly CardImplementationCoverageEntry[] =
  [];

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
