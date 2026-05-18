import type { CardDefinitionId } from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { CARD_IMPLEMENTATIONS } from "./registry";

export type CardImplementationCoverageStatus =
  | "implemented"
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
  "packages/engine/src/card-implementations/onr-v1/rez-cost-modifiers.ts";

const IMPLEMENTED_SIMPLE_GAIN_CREDITS_LOCATION =
  "packages/engine/src/card-implementations/onr-v1/simple-gain-credits.ts";

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
  if (implementation.abilities?.some((ability) => ability.kind === "on_play")) {
    reasons.push(
      "Engine-local CardImplementationDefinition exists for printed-cost on-play gain-credit behavior.",
    );
    currentLocations.add(IMPLEMENTED_SIMPLE_GAIN_CREDITS_LOCATION);
  }

  return {
    cardDefinitionId: implementation.cardDefinitionId,
    status: "implemented",
    reason:
      reasons.join(" ") ||
      "Engine-local CardImplementationDefinition exists for card behavior.",
    currentLocations: [...currentLocations],
  };
}

const IMPLEMENTED_COVERAGE_ENTRIES: CardImplementationCoverageEntry[] =
  CARD_IMPLEMENTATIONS.map(implementedCoverageFor);

export const CARD_IMPLEMENTATION_COVERAGE_OVERRIDES: readonly CardImplementationCoverageEntry[] =
  [
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
