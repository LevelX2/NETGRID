import type { CardDefinitionId } from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { CARD_IMPLEMENTATIONS } from "./registry";

export type CardImplementationCoverageStatus =
  | "implemented"
  | "partial_implementation"
  | "legacy_engine_special_case"
  | "no_engine_behavior_required"
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

const IMPLEMENTED_ICE_STRENGTH_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ADDITIONAL_SUBROUTINE_MODIFIER_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ON_PLAY_EFFECT_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_ACTIVATED_ABILITY_LOCATION =
  "packages/engine/src/card-implementations/onr-v1";

const IMPLEMENTED_CARD_LOCATION_BY_DEFINITION_ID: Partial<
  Record<CardDefinitionId, string>
> = {
  "onr_v1_045_newsgroup-filter":
    "packages/engine/src/card-implementations/onr-v1/runner/programs/newsgroup-filter.ts",
  "onr_v1_079_bodyweight-synthetic-blood":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/bodyweight-synthetic-blood.ts",
  "onr_v1_095_jack-n-joe":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/jack-n-joe.ts",
  "onr_v1_097_livewires-contacts":
    "packages/engine/src/card-implementations/onr-v1/runner/preps/livewires-contacts.ts",
  onr_v1_108_score:
    "packages/engine/src/card-implementations/onr-v1/runner/preps/score.ts",
  "onr_v1_281_accounts-receivable":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/accounts-receivable.ts",
  "onr_v1_282_annual-reviews":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/annual-reviews.ts",
  "onr_v1_285_closed-accounts":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/closed-accounts.ts",
  "onr_v1_287_datapool-by-zetatech":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/datapool-by-zetatech.ts",
  "onr_v1_288_day-shift":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/day-shift.ts",
  "onr_v1_290_efficiency-experts":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/efficiency-experts.ts",
  "onr_v1_295_night-shift":
    "packages/engine/src/card-implementations/onr-v1/corp/operations/night-shift.ts",
  "onr_v1_317_data-masons":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/data-masons-hosting.ts",
  "onr_v1_320_encoder-inc":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/encoder-inc.ts",
  "onr_v1_321_esa-contract":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/esa-contract.ts",
  "onr_v1_324_fortress-architects":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/fortress-architects.ts",
  "onr_v1_341_skalderviken-sa-beta-test-site":
    "packages/engine/src/card-implementations/onr-v1/corp/assets/skalderviken-sa-beta-test-site.ts",
  "onr_v1_360_jerusalem-city-grid":
    "packages/engine/src/card-implementations/onr-v1/corp/upgrades/jerusalem-city-grid.ts",
};

function implementedCoverageFor(
  implementation: (typeof CARD_IMPLEMENTATIONS)[number],
): CardImplementationCoverageEntry {
  const reasons: string[] = [];
  const currentLocations = new Set<string>();

  if (implementation.modifiers?.some((modifier) => modifier.kind === "rez_cost")) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive Corp rez-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_REZ_COST_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "ice_strength")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive Corp ICE-strength modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_ICE_STRENGTH_MODIFIER_LOCATION);
  }
  if (
    implementation.modifiers?.some((modifier) => modifier.kind === "install_cost")
  ) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for passive Corp install-cost modifier behavior.",
    );
    currentLocations.add(IMPLEMENTED_INSTALL_COST_MODIFIER_LOCATION);
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
      cardDefinitionId: "onr_v1_360_jerusalem-city-grid",
      status: "partial_implementation",
      reason:
        "Engine-local CardImplementationDefinition covers the same-server wall rez-cost reduction and same-server wall strength increase. Missing printed text: region install/replacement rules.",
      currentLocations: [
        "packages/engine/src/card-implementations/onr-v1/corp/upgrades/jerusalem-city-grid.ts",
      ],
    },
    {
      cardDefinitionId: "onr_v1_363_olivia-salazar",
      status: "legacy_engine_special_case",
      reason:
        "Optional timed Corp rez-cost ability with source validation, once-per-run state and temporary derez; not yet migrated to CardImplementationDefinition.",
      currentLocations: [
        "packages/engine/src/ability-engine/cost-pipeline.ts",
        "packages/engine/src/index.ts::corpApproachActions",
        "packages/engine/src/index.ts::rezCard",
      ],
    },
    {
      cardDefinitionId: "onr_v1_068_startup-immolator",
      status: "legacy_engine_special_case",
      reason:
        "Runner installed-program ability pays the passed ICE rez cost and trashes it after fully broken pass-ice timing; not yet migrated to CardImplementationDefinition.",
      currentLocations: [
        "packages/engine/src/index.ts::startupImmolatorActions",
        "packages/engine/src/index.ts::useStartupImmolator",
        "packages/engine/src/mechanics/longtail-card-effects.ts",
      ],
    },
    {
      cardDefinitionId: "onr_v1_168_loan-from-chiba",
      status: "legacy_engine_special_case",
      reason:
        "Installed resource creates immediate credits, turn loss, leave-play penalty and special state outside CardImplementationDefinition.",
      currentLocations: [
        "packages/engine/src/index.ts",
        "packages/engine/src/index.test.ts",
      ],
    },
    {
      cardDefinitionId: "onr_v1_314_corporate-negotiating-center",
      status: "legacy_engine_special_case",
      reason:
        "HQ-agenda reveal choice and hidden-info-safe resolution are still implemented through legacy engine paths.",
      currentLocations: [
        "packages/engine/src/index.ts",
        "packages/engine/src/mechanics/hidden-zone.ts",
      ],
    },
    {
      cardDefinitionId: "onr_v1_173_restrictive-net-zoning",
      status: "legacy_engine_special_case",
      reason:
        "Server-bound install-cost modifier and selected-server state are still implemented in legacy engine paths.",
      currentLocations: ["packages/engine/src/index.ts"],
    },
    {
      cardDefinitionId: "onr_v1_133_militech-mram-chip",
      status: "legacy_engine_special_case",
      reason:
        "Installed hardware hand-size modifier is still represented by existing CardDefinition fields and ActiveModifier query reconstruction.",
      currentLocations: [
        "packages/shared/src/index.ts::maxHandSizeBonus",
        "packages/engine/src/ability-engine/active-modifiers.ts",
        "packages/engine/src/index.ts",
      ],
    },
    {
      cardDefinitionId: "onr_v1_134_mram-chip",
      status: "legacy_engine_special_case",
      reason:
        "Installed hardware hand-size modifier is still represented by existing CardDefinition fields and ActiveModifier query reconstruction.",
      currentLocations: [
        "packages/shared/src/index.ts::maxHandSizeBonus",
        "packages/engine/src/ability-engine/active-modifiers.ts",
        "packages/engine/src/index.ts",
      ],
    },
    {
      cardDefinitionId: "onr_v1_039_krash",
      status: "legacy_engine_special_case",
      reason:
        "Run-duration breaker strength modifier is still stored in RunState and reconstructed by ActiveModifier query.",
      currentLocations: [
        "packages/engine/src/index.ts",
        "packages/engine/src/ability-engine/active-modifiers.ts",
      ],
    },
    {
      cardDefinitionId: "onr_v1_277_virizz",
      status: "legacy_engine_special_case",
      reason:
        "Run-duration break-subroutine-cost modifier is still stored in RunState and reconstructed by ActiveModifier query.",
      currentLocations: [
        "packages/engine/src/index.ts",
        "packages/engine/src/ability-engine/active-modifiers.ts",
      ],
    },
  ];

function pendingCoverageFor(
  cardDefinitionId: CardDefinitionId,
): CardImplementationCoverageEntry {
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
    Object.keys(DEMO_CARDS_BY_ID).map((cardDefinitionId) => [
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

export function cardImplementationCoverageForDefinitionId(
  definitionId: CardDefinitionId,
): CardImplementationCoverageEntry | undefined {
  return CARD_IMPLEMENTATION_COVERAGE_BY_DEFINITION_ID[definitionId];
}
