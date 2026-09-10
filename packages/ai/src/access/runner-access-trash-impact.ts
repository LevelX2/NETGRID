import type { CardSpecPlanningCompatibilityCard } from "@netgrid/cards/planning";
import type { VisibleCard } from "@netgrid/shared";

export type RunnerAccessTrashImpactClass =
  | "stored_economy"
  | "recurring_economy"
  | "scoring_support"
  | "defense_or_tax"
  | "damage_or_tags"
  | "other_visible_impact";

export type RunnerAccessTrashImpactAssessment = Readonly<{
  targetDefinitionId: string;
  trashCost: number;
  dedicatedTrashCredits: number;
  generalCreditCost: number;
  creditsAfterTrash: number;
  economyReserve: number;
  parentReservedCredits: number;
  requiredReserve: number;
  visibleImpactValue: number;
  uncertaintyPenalty: number;
  opportunityCost: number;
  liquidityPenalty: number;
  margin: number;
  recommendation: "trash" | "decline";
  impactClasses: readonly RunnerAccessTrashImpactClass[];
  evidenceCodes: readonly string[];
}>;

/** Pure canonical projection entry point used by generic fixtures and runtime. */
export function assessRunnerAccessTrashImpactFromPlanningCard(params: {
  planningCard: CardSpecPlanningCompatibilityCard;
  accessed: Pick<
    VisibleCard,
    "known" | "definitionId" | "counters" | "advancementCounters"
  >;
  trashCost: number;
  dedicatedTrashCredits?: number;
  runnerCredits: number;
  economyReserve: number;
  parentReservedCredits?: number;
}): RunnerAccessTrashImpactAssessment | undefined {
  const { planning } = params.planningCard;
  if (
    planning.side !== "corp" ||
    params.accessed.known !== true ||
    params.accessed.definitionId !== planning.cardDefinitionId
  ) {
    return undefined;
  }

  const trashCost = nonNegativeInteger(params.trashCost);
  const dedicatedTrashCredits = Math.min(
    trashCost,
    nonNegativeInteger(params.dedicatedTrashCredits ?? 0),
  );
  const generalCreditCost = Math.max(0, trashCost - dedicatedTrashCredits);
  const creditsAfterTrash = params.runnerCredits - generalCreditCost;
  const economyReserve = nonNegativeInteger(params.economyReserve);
  const parentReservedCredits = nonNegativeInteger(
    params.parentReservedCredits ?? 0,
  );
  const requiredReserve = Math.max(economyReserve, parentReservedCredits);
  const facts = canonicalVisibleImpactFacts(
    params.planningCard,
    params.accessed,
  );

  const storedEconomyValue = facts.finiteStoredEconomy
    ? facts.visibleStoredCredits * 140
    : 0;
  const recurringEconomyValue = facts.recurringEconomyPerTurn * 450;
  const strategicImpactValue = facts.strategicImpactRating * 400;
  const hazardImpactValue = facts.damageOrTags ? 900 : 0;
  const storedScoreSupportValue = facts.transferableAdvancementCounters * 400;
  const visibleImpactValue =
    storedEconomyValue +
    recurringEconomyValue +
    strategicImpactValue +
    hazardImpactValue +
    storedScoreSupportValue;
  const uncertaintyPenalty = facts.uncertainVisibleImpact ? 80 : 0;
  const opportunityCost = generalCreditCost * 180;
  const reserveDeficit = Math.max(0, requiredReserve - creditsAfterTrash);
  const liquidityPenalty = reserveDeficit * 180;
  const margin =
    visibleImpactValue -
    uncertaintyPenalty -
    opportunityCost -
    liquidityPenalty;
  const recommendation = margin > 0 ? "trash" : "decline";

  return {
    targetDefinitionId: planning.cardDefinitionId,
    trashCost,
    dedicatedTrashCredits,
    generalCreditCost,
    creditsAfterTrash,
    economyReserve,
    parentReservedCredits,
    requiredReserve,
    visibleImpactValue,
    uncertaintyPenalty,
    opportunityCost,
    liquidityPenalty,
    margin,
    recommendation,
    impactClasses: facts.impactClasses,
    evidenceCodes: [
      "runner_access_trash_impact:canonical_card_spec",
      `runner_access_trash_target:${planning.cardDefinitionId}`,
      `runner_access_trash_cost:${trashCost}`,
      `runner_access_trash_dedicated_credits:${dedicatedTrashCredits}`,
      `runner_access_trash_general_credit_cost:${generalCreditCost}`,
      `runner_access_trash_credits_after:${creditsAfterTrash}`,
      `runner_access_trash_economy_reserve:${economyReserve}`,
      `runner_access_trash_parent_reserved_credits:${parentReservedCredits}`,
      `runner_access_trash_required_reserve:${requiredReserve}`,
      `runner_access_trash_visible_stored_credits:${facts.visibleStoredCredits}`,
      `runner_access_trash_transferable_advancement_counters:${facts.transferableAdvancementCounters}`,
      `runner_access_trash_recurring_economy_per_turn:${facts.recurringEconomyPerTurn}`,
      `runner_access_trash_visible_impact:${visibleImpactValue}`,
      `runner_access_trash_impact_classes:${facts.impactClasses.join(",") || "none"}`,
      `runner_access_trash_uncertainty:${facts.uncertainVisibleImpact ? "conservative" : "none"}`,
      `runner_access_trash_uncertainty_penalty:${uncertaintyPenalty}`,
      `runner_access_trash_opportunity_cost:${opportunityCost}`,
      `runner_access_trash_liquidity_penalty:${liquidityPenalty}`,
      `runner_access_trash_margin:${margin}`,
      `runner_access_trash_recommendation:${recommendation}`,
    ],
  };
}

function canonicalVisibleImpactFacts(
  card: CardSpecPlanningCompatibilityCard,
  accessed: Pick<
    VisibleCard,
    "known" | "definitionId" | "counters" | "advancementCounters"
  >,
): {
  finiteStoredEconomy: boolean;
  visibleStoredCredits: number;
  recurringEconomyPerTurn: number;
  strategicImpactRating: number;
  transferableAdvancementCounters: number;
  damageOrTags: boolean;
  uncertainVisibleImpact: boolean;
  impactClasses: RunnerAccessTrashImpactClass[];
} {
  const capabilities = card.planning.prospectiveCapabilities.capabilities;
  const finiteStoredEconomy = capabilities.some((capability) =>
    capability.descriptors.some(
      (descriptor) =>
        descriptor.kind === "effect" &&
        jsonContainsKind(descriptor.value, "take_hosted_credits"),
    ),
  );
  const visibleStoredCredits = finiteStoredEconomy
    ? Math.max(
        0,
        accessed.counters?.bit ?? 0,
        accessed.counters?.recurring_credit ?? 0,
      )
    : 0;
  const recurringEconomyPerTurn = Math.max(
    ...capabilities.map((capability) => {
      const recurringTiming =
        capability.sourcePath.includes("start_of_corp_turn") ||
        capability.descriptors.some(
          (descriptor) =>
            descriptor.kind === "mechanic" &&
            jsonContainsText(descriptor.value, "start_of_corp_turn"),
        );
      if (!recurringTiming) return 0;
      if (finiteStoredEconomy && visibleStoredCredits === 0) return 0;
      return maximumAmountForKinds(capability.descriptors, [
        "gain_credits",
        "take_hosted_credits",
        "recurring_trace_credit_pool",
      ]);
    }),
    0,
  );
  const annotations = card.planning.planningAnnotations?.card ?? [];
  const remoteRole = annotations.find(
    (annotation) => annotation.kind === "remote_role",
  );
  const strategicImpactRating = remoteRole
    ? remoteRole.role === "asset_economy" && finiteStoredEconomy
      ? 0
      : remoteRole.threatLevel === "high"
        ? 3
        : remoteRole.threatLevel === "medium"
          ? 2
          : 1
    : Math.max(
        0,
        ...annotations.flatMap((annotation) =>
          annotation.kind === "value_interpretation" &&
          annotation.axis === "remote_root_value"
            ? [
                annotation.rating === "low"
                  ? 1
                  : annotation.rating === "medium" ||
                      annotation.rating === "high" ||
                      annotation.rating === "very_high" ||
                      annotation.rating === "critical"
                    ? 2
                    : 0,
              ]
            : [],
        ),
      );
  const role = remoteRole?.role ?? "";
  const transfersAdvancement = capabilities.some((capability) =>
    capability.descriptors.some(
      (descriptor) =>
        descriptor.kind === "effect" &&
        jsonContainsKind(descriptor.value, "move_advancement_counters"),
    ),
  );
  const transferableAdvancementCounters = transfersAdvancement
    ? nonNegativeInteger(accessed.advancementCounters ?? 0)
    : 0;
  const scoringSupport =
    /(score|advance|agenda)/u.test(role) || transfersAdvancement;
  const defenseOrTax =
    /(protect|defen[cs]e|tax|ice|capacity|run_control)/u.test(role);
  const damageOrTags = capabilities.some((capability) =>
    capability.descriptors.some(
      (descriptor) =>
        (descriptor.kind === "capability_kind" &&
          descriptor.value === "runner_draw_tax_tag") ||
        (descriptor.kind === "effect" &&
          (jsonContainsKind(descriptor.value, "deal_damage") ||
            jsonContainsKind(descriptor.value, "damage") ||
            jsonContainsKind(descriptor.value, "give_tags") ||
            jsonContainsKind(descriptor.value, "add_tags") ||
            jsonContainsKind(descriptor.value, "trace"))),
    ),
  );
  const impactClasses: RunnerAccessTrashImpactClass[] = [];
  if (finiteStoredEconomy && visibleStoredCredits > 0)
    impactClasses.push("stored_economy");
  if (recurringEconomyPerTurn > 0) impactClasses.push("recurring_economy");
  if (scoringSupport) impactClasses.push("scoring_support");
  if (defenseOrTax) impactClasses.push("defense_or_tax");
  if (damageOrTags) impactClasses.push("damage_or_tags");
  if (
    strategicImpactRating > 0 &&
    !scoringSupport &&
    !defenseOrTax &&
    !damageOrTags &&
    !(finiteStoredEconomy && visibleStoredCredits > 0)
  ) {
    impactClasses.push("other_visible_impact");
  }
  const uncertainVisibleImpact = capabilities.some(
    (capability) => capability.uncertaintyClass === "requires_engine_quote",
  );
  return {
    finiteStoredEconomy,
    visibleStoredCredits,
    recurringEconomyPerTurn,
    strategicImpactRating,
    transferableAdvancementCounters,
    damageOrTags,
    uncertainVisibleImpact,
    impactClasses,
  };
}

function maximumAmountForKinds(
  descriptors: CardSpecPlanningCompatibilityCard["planning"]["prospectiveCapabilities"]["capabilities"][number]["descriptors"],
  kinds: readonly string[],
): number {
  const kindSet = new Set(kinds);
  const flattenedCapabilityAmount = descriptors.some(
    (descriptor) =>
      descriptor.kind === "capability_kind" &&
      typeof descriptor.value === "string" &&
      kindSet.has(descriptor.value),
  )
    ? Math.max(
        0,
        ...descriptors.flatMap((descriptor) =>
          descriptor.kind === "mechanic" &&
          descriptor.path.endsWith(".amount") &&
          typeof descriptor.value === "number" &&
          Number.isFinite(descriptor.value)
            ? [Math.max(0, Math.floor(descriptor.value))]
            : [],
        ),
      )
    : 0;
  return Math.max(
    flattenedCapabilityAmount,
    ...descriptors.flatMap((descriptor) =>
      descriptor.kind === "effect" || descriptor.kind === "mechanic"
        ? maximumAmountForKind(descriptor.value, kindSet)
        : [],
    ),
  );
}

function maximumAmountForKind(
  value: unknown,
  kinds: ReadonlySet<string>,
): number[] {
  if (Array.isArray(value))
    return value.flatMap((entry) => maximumAmountForKind(entry, kinds));
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const own =
    typeof record.kind === "string" &&
    kinds.has(record.kind) &&
    typeof record.amount === "number" &&
    Number.isFinite(record.amount)
      ? [Math.max(0, Math.floor(record.amount))]
      : [];
  return [
    ...own,
    ...Object.values(record).flatMap((entry) =>
      maximumAmountForKind(entry, kinds),
    ),
  ];
}

function jsonContainsKind(value: unknown, expected: string): boolean {
  if (Array.isArray(value))
    return value.some((entry) => jsonContainsKind(entry, expected));
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    record.kind === expected ||
    Object.values(record).some((entry) => jsonContainsKind(entry, expected))
  );
}

function jsonContainsText(value: unknown, expected: string): boolean {
  if (typeof value === "string")
    return value === expected || value.startsWith(`${expected}_`);
  if (Array.isArray(value))
    return value.some((entry) => jsonContainsText(entry, expected));
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((entry) =>
    jsonContainsText(entry, expected),
  );
}

function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
