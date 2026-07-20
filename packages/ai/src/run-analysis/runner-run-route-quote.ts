import type { KnownRezzedIcePathAssessment } from "./visible-run-analysis-contracts";

export type RunnerRunRouteReachability =
  | "guaranteed_access"
  | "conditional_access"
  | "no_access";

export type RunnerRunRouteEffect = {
  kind:
    | "end_run_or_deflect"
    | "tags"
    | "damage"
    | "trash"
    | "credits"
    | "run_lock"
    | "future_modifier";
  timing: "before_access" | "at_access" | "after_access";
  sourceDefinitionId?: string;
  sourceTitle?: string;
  amount?: number;
  preventsAccess: boolean;
  canEndGameBeforeAccess: boolean;
  evidence: string[];
};

export type RunnerRunRouteQuote = {
  reachability: RunnerRunRouteReachability;
  knownCost: number;
  guaranteedKnownCost: number;
  availableCredits: number;
  fundingGap: number;
  unknownIceCount: number;
  effects: RunnerRunRouteEffect[];
  conditionalReasons: string[];
  conditionalRiskReasons?: string[];
  noAccessReason?: string;
  evidence: string[];
};

export function quoteRunnerRunRoute(params: {
  path: KnownRezzedIcePathAssessment;
  availableCredits: number;
  unknownIceCount?: number;
  runnerGripCount?: number;
}): RunnerRunRouteQuote {
  const availableCredits = normalizeCredits(params.availableCredits);
  const unknownIceCount = Math.max(0, Math.floor(params.unknownIceCount ?? 0));
  const hazards = params.path.visibleIceRunHazards ?? [];
  const runnerGripCount = Math.max(
    0,
    Math.floor(params.runnerGripCount ?? Number.MAX_SAFE_INTEGER),
  );
  const effects = hazards.flatMap((hazard) =>
    routeEffectsForHazard(hazard, runnerGripCount),
  );
  const paidHazardAvoidance = Math.max(
    0,
    params.path.visibleIceHazardAvoidanceCost ?? 0,
  );
  const knownCost = Math.max(0, params.path.visibleBreakCost ?? 0);
  const baseKnownCost = Math.max(0, knownCost - paidHazardAvoidance);
  const accessGuaranteeCosts = hazards
    .filter((hazard) => hazard.preventsAccess)
    .map((hazard) =>
      minimumDefined(
        hazard.breakAvoidanceCost,
        hazard.visibleCorpMaxTraceAvoidanceCost,
      ),
    );
  const hasUnquotableAccessGuarantee = accessGuaranteeCosts.some(
    (cost) => cost === undefined,
  );
  const guaranteedKnownCost = hasUnquotableAccessGuarantee
    ? knownCost
    : baseKnownCost +
      accessGuaranteeCosts.reduce<number>((sum, cost) => sum + (cost ?? 0), 0);
  const knownRouteCashCost = Math.max(
    0,
    availableCredits - params.path.creditsAfterPath,
  );
  const provenRestrictedRouteCredits = Math.max(
    0,
    knownCost - knownRouteCashCost,
  );
  const availableKnownRouteCredits =
    availableCredits + provenRestrictedRouteCredits;
  const accessPreventingConditionalHazard = hazards.some(
    (hazard) => hazard.preventsAccess && hazard.unavoidable,
  );
  const lethalConditionalHazard = effects.some(
    (effect) => effect.canEndGameBeforeAccess,
  );
  const conditionalReasons = [
    ...(params.path.conditionalAccessReasons ?? []),
    ...(accessPreventingConditionalHazard
      ? ["visible_access_preventing_effect_not_guaranteed"]
      : []),
    ...(lethalConditionalHazard ? ["visible_flatline_risk_before_access"] : []),
    ...(unknownIceCount > 0 ? ["unknown_ice_on_route"] : []),
  ];
  const conditionalRiskReasons = [
    ...(params.path.conditionalRiskReasons ?? []),
  ];
  const traceConditionalBlock =
    params.path.blocked &&
    hazards.some(
      (hazard) =>
        hazard.unavoidable &&
        (hazard.preventsAccess || hazard.canCauseFlatlineBeforeAccess),
    );
  const reachability: RunnerRunRouteReachability = params.path.blocked
    ? traceConditionalBlock
      ? "conditional_access"
      : "no_access"
    : conditionalReasons.length > 0
      ? "conditional_access"
      : "guaranteed_access";
  const fundingGap = Math.max(
    0,
    guaranteedKnownCost - availableKnownRouteCredits,
  );
  return {
    reachability,
    knownCost,
    guaranteedKnownCost,
    availableCredits,
    fundingGap,
    unknownIceCount,
    effects,
    conditionalReasons,
    ...(conditionalRiskReasons.length > 0 ? { conditionalRiskReasons } : {}),
    ...(reachability === "no_access"
      ? {
          noAccessReason:
            params.path.noAccessReason ?? "known_route_cannot_reach_access",
        }
      : {}),
    evidence: [
      `route_reachability:${reachability}`,
      `route_known_cost:${knownCost}`,
      `route_guaranteed_known_cost:${guaranteedKnownCost}`,
      `route_available_credits:${availableCredits}`,
      `route_proven_restricted_credits:${provenRestrictedRouteCredits}`,
      `route_available_known_route_credits:${availableKnownRouteCredits}`,
      `route_credits_after_known_path:${params.path.creditsAfterPath}`,
      `route_funding_gap:${fundingGap}`,
      `route_unknown_ice_count:${unknownIceCount}`,
      ...conditionalReasons.map((reason) => `route_conditional:${reason}`),
      ...conditionalRiskReasons.map(
        (reason) => `route_conditional_risk:${reason}`,
      ),
    ],
  };
}

function routeEffectsForHazard(
  hazard: NonNullable<
    KnownRezzedIcePathAssessment["visibleIceRunHazards"]
  >[number],
  runnerGripCount: number,
): RunnerRunRouteEffect[] {
  const effects: RunnerRunRouteEffect[] = [];
  const add = (
    kind: RunnerRunRouteEffect["kind"],
    amount: number | undefined,
    preventsAccess = false,
    canEndGameBeforeAccess = false,
  ) => {
    effects.push({
      kind,
      timing: hazard.effectTiming,
      ...(hazard.sourceDefinitionId
        ? { sourceDefinitionId: hazard.sourceDefinitionId }
        : {}),
      ...(hazard.sourceTitle ? { sourceTitle: hazard.sourceTitle } : {}),
      ...(amount !== undefined ? { amount } : {}),
      preventsAccess,
      canEndGameBeforeAccess,
      evidence: [
        `route_effect_type:${hazard.effectType}`,
        `route_effect_timing:${hazard.effectTiming}`,
        `route_effect_prevents_access:${preventsAccess}`,
      ],
    });
  };
  if (hazard.preventsAccess) {
    add("end_run_or_deflect", undefined, true);
  }
  if (hazard.expectedTags) add("tags", hazard.expectedTags);
  if (hazard.expectedDamage) {
    add(
      "damage",
      hazard.expectedDamage,
      false,
      hazard.canCauseFlatlineBeforeAccess &&
        hazard.expectedDamage >= runnerGripCount,
    );
  }
  if (hazard.kind === "trace_trash") add("trash", undefined);
  if (hazard.actionTax) add("run_lock", hazard.actionTax);
  if (effects.length === 0) {
    add("future_modifier", hazard.expectedCounters);
  }
  return effects;
}

function minimumDefined(
  ...values: Array<number | undefined>
): number | undefined {
  const defined = values
    .filter((value): value is number => value !== undefined)
    .map(normalizeCredits);
  return defined.length > 0 ? Math.min(...defined) : undefined;
}

function normalizeCredits(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
