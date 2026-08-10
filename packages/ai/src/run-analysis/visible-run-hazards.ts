import {
  type TraceSuccessEffect,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
  type VisibleRunnerTraceSupportQuote,
} from "@netgrid/shared";
import type {
  BreakAssessment,
  HardUnbrokenRunEffectKind,
  IceCardLike,
  KnownRezzedIcePathAssessment,
  MutableRunnerRunPathCreditBudget,
  RunPathProjection,
  RunPathProjectionEffect,
  VisibleIceRunHazard,
  VisibleIceRunHazardKind,
  VisibleIceRunHazardProjection,
  VisibleIceRunHazardSeverity,
  VisibleTraceSupportSideEffect,
} from "./visible-run-analysis-contracts";
import {
  effectiveIceForQuote,
  effectiveRunQuoteForIce,
  minimumCreditsToBreakVisibleSubroutines,
} from "./visible-run-breaker-path";

export function pathProjectionEffectsForQuote(
  quote: VisibleEffectiveIceRunQuote | undefined,
): RunPathProjection[] {
  const effects: RunPathProjection[] = [];
  for (const subroutine of quote?.subroutines ?? []) {
    const effect = subroutine.unbrokenRunEffect;
    if (effect && runPathProjectionEffectCanMatter(effect)) {
      effects.push({ effect, sourceSubroutine: subroutine });
    }
  }
  return effects;
}

export function visibleIceRunHazardSummary(
  hazards: VisibleIceRunHazard[],
  creditsAfterAvoidingVisibleIceHazards: number,
): Partial<KnownRezzedIcePathAssessment> {
  if (hazards.length === 0) return {};
  const visibleIceHazardPenalty = hazards.reduce(
    (sum, hazard) => sum + hazard.penalty,
    0,
  );
  const visibleIceHazardAvoidanceCost = hazards.reduce(
    (sum, hazard) => sum + Math.max(0, hazard.minimumAvoidanceCost ?? 0),
    0,
  );
  const expectedTagsFromVisibleIce = hazards.reduce(
    (sum, hazard) => sum + Math.max(0, hazard.expectedTags ?? 0),
    0,
  );
  const unavoidableVisibleIceHazardCount = hazards.filter(
    (hazard) => hazard.unavoidable,
  ).length;
  return {
    visibleIceRunHazards: hazards,
    visibleIceHazardPenalty,
    visibleIceHazardAvoidanceCost,
    creditsAfterAvoidingVisibleIceHazards,
    ...(expectedTagsFromVisibleIce > 0 ? { expectedTagsFromVisibleIce } : {}),
    ...(unavoidableVisibleIceHazardCount > 0
      ? { unavoidableVisibleIceHazardCount }
      : {}),
    ...(hazards.some(
      (hazard) =>
        hazard.unavoidable &&
        (hazard.kind === "trace_tag" || hazard.kind === "trace_tag_counter"),
    )
      ? { visibleTraceTagHazardUnavoidable: true }
      : {}),
  };
}

export function visibleIceRunHazardsForQuote(params: {
  quote: VisibleEffectiveIceRunQuote | undefined;
  ice: IceCardLike;
  iceIndex: number;
  rigCards: VisibleCard[];
  availableCredits: number;
  visibleCorpBidCapacity: number;
  breakerStrengths: Map<string, number>;
  additionalBreakCostPerSubroutine: number;
  runnerTraceSupportQuote?: VisibleRunnerTraceSupportQuote;
  runTraceLinkBonus?: number;
  excludeStealthTraceCredits?: boolean;
}): VisibleIceRunHazardProjection[] {
  if (!params.quote) return [];
  const hazards: VisibleIceRunHazardProjection[] = [];
  let remainingHazardCredits = Math.max(0, Math.floor(params.availableCredits));
  let remainingTraceCreditPool = visibleTraceCreditPool(
    params.runnerTraceSupportQuote,
    params.excludeStealthTraceCredits,
  );
  const consumedTraceSupportSourceIds = new Set<string>();
  params.quote.subroutines.forEach((subroutine) => {
    if (subroutine.type !== "initiate_trace") return;
    const traceSupport = visibleRunnerTraceSupport(
      traceSupportQuoteWithoutConsumedSources(
        params.runnerTraceSupportQuote,
        consumedTraceSupportSourceIds,
      ),
      remainingHazardCredits,
      params.runTraceLinkBonus,
      {
        traceCreditPool: remainingTraceCreditPool,
        ...(params.excludeStealthTraceCredits
          ? { excludeStealthCredits: true }
          : {}),
      },
    );
    const successEffect = traceSuccessEffectForVisibleSubroutine(subroutine);
    const baseHazard = visibleIceRunHazardForTraceEffect(successEffect);
    if (!baseHazard) return;
    const traceBaseStrength = traceBaseStrengthForVisibleSubroutine(subroutine);
    const traceAvoidance =
      traceBaseStrength === undefined
        ? undefined
        : visibleTraceAvoidanceForBaseStrength(traceBaseStrength, traceSupport);
    const visibleCorpBidCapacity = visibleCorpTraceBidCapacity(
      params.quote!,
      subroutine,
      params.visibleCorpBidCapacity,
    );
    const visibleCorpMaxTraceAvoidance =
      traceBaseStrength === undefined
        ? undefined
        : visibleTraceAvoidanceForBaseStrength(
            traceBaseStrength + visibleCorpBidCapacity,
            traceSupport,
          );
    const traceSuccessCancel = cheapestTraceSuccessCancel(
      traceSupport,
      remainingHazardCredits,
    );
    const traceAvoidanceCandidate =
      visibleCorpMaxTraceAvoidance?.cheapestAffordableSafe?.creditCost;
    const traceSuccessCancelCandidate = traceSuccessCancel?.activationCost;
    const breakAssessment = minimumCreditsToBreakVisibleSubroutines(
      effectiveIceForQuote(params.ice, params.quote),
      params.rigCards,
      [subroutine],
      params.breakerStrengths,
      params.additionalBreakCostPerSubroutine,
    );
    const breakAvoidanceCandidate =
      breakAssessment && breakAssessment.cost <= remainingHazardCredits
        ? breakAssessment.cost
        : undefined;
    const avoidanceCandidates = [
      traceAvoidanceCandidate,
      traceSuccessCancelCandidate,
      breakAvoidanceCandidate,
    ].filter((cost): cost is number => cost !== undefined);
    const minimumAvoidanceCost =
      avoidanceCandidates.length > 0
        ? Math.min(...avoidanceCandidates)
        : undefined;
    const usesBreakAvoidance =
      breakAvoidanceCandidate !== undefined &&
      minimumAvoidanceCost === breakAvoidanceCandidate &&
      (traceAvoidanceCandidate === undefined ||
        breakAvoidanceCandidate < traceAvoidanceCandidate) &&
      (traceSuccessCancelCandidate === undefined ||
        breakAvoidanceCandidate < traceSuccessCancelCandidate);
    const usesTraceLinkAvoidance =
      traceAvoidanceCandidate !== undefined &&
      minimumAvoidanceCost === traceAvoidanceCandidate &&
      (traceSuccessCancelCandidate === undefined ||
        traceAvoidanceCandidate <= traceSuccessCancelCandidate) &&
      !usesBreakAvoidance;
    const usesTraceSuccessCancel =
      traceSuccessCancelCandidate !== undefined &&
      minimumAvoidanceCost === traceSuccessCancelCandidate &&
      !usesBreakAvoidance &&
      !usesTraceLinkAvoidance;
    const unavoidable = minimumAvoidanceCost === undefined;
    const sourceDefinitionId =
      subroutine.sourceDefinitionId ?? params.quote!.iceDefinitionId;
    const sourceTitle = subroutine.sourceTitle;
    const cheapestTraceAvoidance = traceAvoidance?.cheapestSafe;
    const cheapestCorpMaxTraceAvoidance =
      visibleCorpMaxTraceAvoidance?.cheapestSafe;
    const unsafeTraceAvoidance =
      visibleCorpMaxTraceAvoidance?.cheapestAffordableUnsafe ??
      visibleCorpMaxTraceAvoidance?.cheapestUnsafe ??
      traceAvoidance?.cheapestAffordableUnsafe ??
      traceAvoidance?.cheapestUnsafe;
    const guaranteedTraceAvoidance =
      visibleCorpMaxTraceAvoidance?.cheapestAffordableSafe;
    const baseLinkEvidenceSource = guaranteedTraceAvoidance?.baseLink
      ? guaranteedTraceAvoidance
      : cheapestCorpMaxTraceAvoidance?.baseLink
        ? cheapestCorpMaxTraceAvoidance
        : cheapestTraceAvoidance?.baseLink
          ? cheapestTraceAvoidance
          : unsafeTraceAvoidance?.baseLink
            ? unsafeTraceAvoidance
            : undefined;
    const baseTraceCovered =
      traceAvoidance?.cheapestAffordableSafe !== undefined;
    const visibleCorpMaxTraceCovered =
      visibleCorpMaxTraceAvoidance?.cheapestAffordableSafe !== undefined;
    const penalty = visibleIceHazardPenalty(
      baseHazard.kind,
      baseHazard.severity,
      unavoidable,
      minimumAvoidanceCost,
    );
    const hazard: VisibleIceRunHazard = {
      ...baseHazard,
      iceIndex: params.iceIndex,
      ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
      ...(sourceTitle ? { sourceTitle } : {}),
      subroutineId: subroutine.id,
      ...(traceBaseStrength !== undefined ? { traceBaseStrength } : {}),
      runnerTraceCapacity: traceSupport.runnerTraceCapacity,
      ...(traceBaseStrength !== undefined ? { baseTraceCovered } : {}),
      visibleCorpBidCapacity,
      ...(traceBaseStrength !== undefined
        ? { visibleCorpMaxTraceCovered }
        : {}),
      ...(cheapestTraceAvoidance
        ? {
            traceAvoidanceCost: cheapestTraceAvoidance.creditCost,
            traceBidCost: cheapestTraceAvoidance.traceBidCost,
          }
        : {}),
      ...(cheapestCorpMaxTraceAvoidance
        ? {
            visibleCorpMaxTraceAvoidanceCost:
              cheapestCorpMaxTraceAvoidance.creditCost,
          }
        : {}),
      ...(traceSuccessCancel
        ? { traceSuccessCancelAvoidanceCost: traceSuccessCancel.activationCost }
        : {}),
      ...(baseLinkEvidenceSource?.baseLink
        ? { baseLinkValue: baseLinkEvidenceSource.baseLink }
        : {}),
      ...(baseLinkEvidenceSource?.activationCost !== undefined
        ? {
            baseLinkActivationCost: baseLinkEvidenceSource.activationCost,
          }
        : {}),
      ...(baseLinkEvidenceSource?.sourceDefinitionId
        ? {
            baseLinkSourceDefinitionId:
              baseLinkEvidenceSource.sourceDefinitionId,
          }
        : {}),
      ...(baseLinkEvidenceSource?.sourceTitle
        ? { baseLinkSourceTitle: baseLinkEvidenceSource.sourceTitle }
        : {}),
      ...(baseLinkEvidenceSource?.sideEffect
        ? { baseLinkSideEffect: baseLinkEvidenceSource.sideEffect }
        : {}),
      ...(breakAssessment ? { breakAvoidanceCost: breakAssessment.cost } : {}),
      ...(minimumAvoidanceCost !== undefined ? { minimumAvoidanceCost } : {}),
      unavoidable,
      penalty,
      evidence: [
        `visible_ice_hazard:${baseHazard.kind}`,
        ...(sourceTitle ? [`visible_ice_hazard_source:${sourceTitle}`] : []),
        ...(traceBaseStrength !== undefined
          ? [`visible_ice_trace_base:${traceBaseStrength}`]
          : []),
        `visible_runner_trace_capacity:${traceSupport.runnerTraceCapacity}`,
        ...(traceBaseStrength !== undefined
          ? [
              `visible_trace_base_covered:${baseTraceCovered}`,
              `visible_corp_bid_capacity:${visibleCorpBidCapacity}`,
              `visible_corp_max_trace_covered:${visibleCorpMaxTraceCovered}`,
            ]
          : []),
        ...(cheapestTraceAvoidance
          ? [
              `visible_trace_avoidance_cost:${cheapestTraceAvoidance.creditCost}`,
              `visible_trace_bid_cost:${cheapestTraceAvoidance.traceBidCost}`,
            ]
          : []),
        ...(cheapestCorpMaxTraceAvoidance
          ? [
              `visible_corp_max_trace_avoidance_cost:${cheapestCorpMaxTraceAvoidance.creditCost}`,
            ]
          : []),
        ...(traceSuccessCancel
          ? [
              `visible_trace_success_cancel_cost:${traceSuccessCancel.activationCost}`,
              `visible_trace_success_cancel_source:${traceSuccessCancel.sourceTitle}`,
            ]
          : []),
        ...(baseLinkEvidenceSource?.baseLink
          ? [
              `visible_trace_base_link:${baseLinkEvidenceSource.baseLink}`,
              `visible_trace_base_link_cost:${baseLinkEvidenceSource.activationCost}`,
            ]
          : []),
        ...(baseLinkEvidenceSource?.sourceTitle
          ? [
              `visible_trace_base_link_source:${baseLinkEvidenceSource.sourceTitle}`,
            ]
          : []),
        ...(baseLinkEvidenceSource?.sideEffect
          ? [
              `visible_trace_base_link_side_effect:${baseLinkEvidenceSource.sideEffect}`,
            ]
          : []),
        ...(breakAssessment
          ? [`visible_trace_break_cost:${breakAssessment.cost}`]
          : []),
        `visible_ice_hazard_unavoidable:${unavoidable}`,
      ],
    };
    hazards.push({
      hazard,
      ...(usesTraceLinkAvoidance &&
      visibleCorpMaxTraceAvoidance?.cheapestAffordableSafe
        ? {
            traceCreditPoolSpent:
              visibleCorpMaxTraceAvoidance.cheapestAffordableSafe
                .traceCreditPoolSpent,
          }
        : {}),
      ...(usesTraceLinkAvoidance &&
      visibleCorpMaxTraceAvoidance?.cheapestAffordableSafe
        ? {
            traceSupportSourceIdsConsumed:
              visibleCorpMaxTraceAvoidance.cheapestAffordableSafe
                .consumedSourceIds,
          }
        : usesTraceSuccessCancel && traceSuccessCancel
          ? {
              traceSupportSourceIdsConsumed: [
                traceSuccessCancel.sourceCardInstanceId,
              ],
            }
          : {}),
      ...(!unavoidable && minimumAvoidanceCost !== undefined
        ? usesBreakAvoidance && breakAssessment
          ? {
              avoidancePayment: {
                kind: "breaker" as const,
                assessment: breakAssessment,
              },
            }
          : {
              avoidancePayment: {
                kind: "general" as const,
                cost: minimumAvoidanceCost,
              },
            }
        : {}),
    });
    if (!unavoidable && minimumAvoidanceCost !== undefined) {
      remainingHazardCredits -= minimumAvoidanceCost;
      const selectedTraceCreditPoolSpent = usesTraceLinkAvoidance
        ? (visibleCorpMaxTraceAvoidance?.cheapestAffordableSafe
            ?.traceCreditPoolSpent ?? 0)
        : 0;
      remainingTraceCreditPool = Math.max(
        0,
        remainingTraceCreditPool - selectedTraceCreditPoolSpent,
      );
      if (usesTraceLinkAvoidance) {
        for (const sourceId of visibleCorpMaxTraceAvoidance
          ?.cheapestAffordableSafe?.consumedSourceIds ?? []) {
          consumedTraceSupportSourceIds.add(sourceId);
        }
      }
      if (usesTraceSuccessCancel && traceSuccessCancel) {
        consumedTraceSupportSourceIds.add(
          traceSuccessCancel.sourceCardInstanceId,
        );
      }
    }
  });
  return hazards;
}

function visibleCorpTraceBidCapacity(
  quote: VisibleEffectiveIceRunQuote,
  subroutine: VisibleEffectiveSubroutine,
  visibleCorpCredits: number,
): number {
  const available =
    Math.max(0, Math.floor(visibleCorpCredits)) +
    Math.max(0, Math.floor(quote.encounterTemporaryTraceCredits ?? 0));
  return subroutine.traceLimit === undefined
    ? available
    : Math.min(available, Math.max(0, Math.floor(subroutine.traceLimit)));
}

export function visibleIceRunHazardForTraceEffect(
  effect: TraceSuccessEffect | undefined,
):
  | Omit<
      VisibleIceRunHazard,
      | "iceIndex"
      | "sourceDefinitionId"
      | "sourceTitle"
      | "subroutineId"
      | "traceBaseStrength"
      | "runnerTraceCapacity"
      | "baseTraceCovered"
      | "visibleCorpBidCapacity"
      | "visibleCorpMaxTraceCovered"
      | "traceAvoidanceCost"
      | "visibleCorpMaxTraceAvoidanceCost"
      | "traceBidCost"
      | "baseLinkValue"
      | "baseLinkActivationCost"
      | "baseLinkSourceDefinitionId"
      | "baseLinkSourceTitle"
      | "baseLinkSideEffect"
      | "breakAvoidanceCost"
      | "minimumAvoidanceCost"
      | "unavoidable"
      | "penalty"
      | "evidence"
    >
  | undefined {
  if (!effect || effect.type === "none") return undefined;
  switch (effect.type) {
    case "add_tag":
      return {
        kind: "trace_tag",
        severity: "high",
        effectType: effect.type,
        effectTiming: "before_access",
        preventsAccess: false,
        canCauseFlatlineBeforeAccess: false,
        expectedTags: Math.max(1, Math.floor(effect.amount)),
      };
    case "add_tags_by_trace_margin_over_runner_link":
      return {
        kind: "trace_tag",
        severity: "high",
        effectType: effect.type,
        effectTiming: "before_access",
        preventsAccess: false,
        canCauseFlatlineBeforeAccess: false,
        expectedTags: 1,
      };
    case "add_tag_and_counter":
      return {
        kind: "trace_tag_counter",
        severity: "high",
        effectType: effect.type,
        effectTiming: "before_access",
        preventsAccess: false,
        canCauseFlatlineBeforeAccess: false,
        expectedTags: Math.max(1, Math.floor(effect.tagAmount)),
        expectedCounters: Math.max(1, Math.floor(effect.amount)),
      };
    case "add_counter":
      return {
        kind: "trace_counter",
        severity: "medium",
        effectType: effect.type,
        effectTiming: "before_access",
        preventsAccess: false,
        canCauseFlatlineBeforeAccess: false,
        expectedCounters: Math.max(1, Math.floor(effect.amount)),
      };
    case "net_damage":
      return {
        kind: "trace_damage",
        severity: effect.amount >= 3 ? "high" : "medium",
        effectType: effect.type,
        effectTiming: "before_access",
        preventsAccess: false,
        canCauseFlatlineBeforeAccess: true,
        expectedDamage: Math.max(1, Math.floor(effect.amount)),
      };
    case "end_run_and_run_lock":
      return {
        kind: "trace_run_lock",
        severity: "high",
        effectType: effect.type,
        effectTiming: "before_access",
        preventsAccess: true,
        canCauseFlatlineBeforeAccess: false,
        actionTax: Math.max(1, Math.floor(effect.amount)),
      };
    case "end_run_trash_program_and_run_lock":
      return {
        kind: "trace_trash",
        severity: "high",
        effectType: effect.type,
        effectTiming: "before_access",
        preventsAccess: true,
        canCauseFlatlineBeforeAccess: false,
        actionTax: Math.max(1, Math.floor(effect.amount)),
      };
    case "end_run_trash_hardware_and_unpreventable_meat_damage":
      return {
        kind: "trace_damage",
        severity: "high",
        effectType: effect.type,
        effectTiming: "before_access",
        preventsAccess: true,
        canCauseFlatlineBeforeAccess: true,
        expectedDamage: 2,
      };
    case "trash_runner_resource_and_add_tag":
      return {
        kind: "trace_trash",
        severity: "high",
        effectType: effect.type,
        effectTiming: "before_access",
        preventsAccess: false,
        canCauseFlatlineBeforeAccess: false,
        expectedTags: 1,
      };
  }
}

export function visibleIceHazardPenalty(
  kind: VisibleIceRunHazardKind,
  severity: VisibleIceRunHazardSeverity,
  unavoidable: boolean,
  minimumAvoidanceCost: number | undefined,
): number {
  const base =
    kind === "trace_tag_counter" || kind === "trace_trash"
      ? 1750
      : kind === "trace_tag"
        ? 1450
        : kind === "trace_damage" || kind === "trace_run_lock"
          ? 1350
          : 760;
  const severityBonus =
    severity === "high" ? 350 : severity === "medium" ? 120 : 0;
  if (unavoidable) return base + severityBonus;
  return Math.min(650, 180 + Math.max(0, minimumAvoidanceCost ?? 0) * 90);
}

export function normalizeVisibleCorpBidCapacity(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

type VisibleRunnerTraceSupportOption = {
  baseLink: number;
  activationCost: number;
  safeForAccess: boolean;
  sourceDefinitionId?: string;
  sourceTitle?: string;
  sideEffect?: VisibleTraceSupportSideEffect;
};

type VisibleRunnerTracePostBidLinkOption = {
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  sourceTitle: string;
  linkDelta: number;
  activationCost: number;
  tapSource: boolean;
  trashSource: boolean;
  safeForAccess: boolean;
};

type VisibleRunnerTraceSuccessCancelOption = {
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  sourceTitle: string;
  activationCost: number;
  tapSource: boolean;
  trashSource: boolean;
};

type VisibleRunnerTraceSupport = {
  availableCredits: number;
  traceCreditPool: number;
  runnerTraceCapacity: number;
  baseLinkOptions: VisibleRunnerTraceSupportOption[];
  postBidLinkOptions: VisibleRunnerTracePostBidLinkOption[];
  traceSuccessCancelOptions: VisibleRunnerTraceSuccessCancelOption[];
};

type VisibleTraceAvoidanceCandidate = VisibleRunnerTraceSupportOption & {
  creditCost: number;
  traceBidCost: number;
  affordable: boolean;
  runnerTraceCapacity: number;
  traceCreditPoolSpent: number;
  consumedSourceIds: string[];
};

type VisibleTraceAvoidanceAssessment = {
  cheapestSafe?: VisibleTraceAvoidanceCandidate;
  cheapestAffordableSafe?: VisibleTraceAvoidanceCandidate;
  cheapestUnsafe?: VisibleTraceAvoidanceCandidate;
  cheapestAffordableUnsafe?: VisibleTraceAvoidanceCandidate;
};

export function visibleRunnerTraceSupport(
  quote: VisibleRunnerTraceSupportQuote | undefined,
  availableCredits: number,
  runTraceLinkBonus = 0,
  options: {
    traceCreditPool?: number;
    excludeStealthCredits?: boolean;
  } = {},
): VisibleRunnerTraceSupport {
  const normalizedCredits = Math.max(0, Math.floor(availableCredits));
  const traceCreditPool = Math.max(
    0,
    Math.floor(
      options.traceCreditPool ??
        visibleTraceCreditPool(quote, options.excludeStealthCredits),
    ),
  );
  const linkBonus = Math.max(0, Math.floor(runTraceLinkBonus));
  const baseLinkOptions: VisibleRunnerTraceSupportOption[] = (
    quote?.baseLinkOptions ?? [
      { baseLink: 0, activationCost: 0, safeForAccess: true },
    ]
  ).map((option) => ({
    ...option,
    baseLink: Math.max(0, Math.floor(option.baseLink)) + linkBonus,
    activationCost: Math.max(0, Math.floor(option.activationCost)),
  }));
  const postBidLinkOptions = (quote?.postBidLinkOptions ?? []).map(
    (option) => ({
      ...option,
      linkDelta: Math.max(0, Math.floor(option.linkDelta)),
      activationCost: Math.max(0, Math.floor(option.activationCost)),
    }),
  );
  const traceSuccessCancelOptions = (
    quote?.traceSuccessCancelOptions ?? []
  ).map((option) => ({
    ...option,
    activationCost: Math.max(0, Math.floor(option.activationCost)),
  }));
  const runnerTraceCapacity = Math.max(
    0,
    ...baseLinkOptions.flatMap((baseOption) =>
      visibleTracePostBidSelections(postBidLinkOptions)
        .filter(
          (selection) =>
            baseOption.safeForAccess &&
            selection.safeForAccess &&
            baseOption.activationCost + selection.activationCost <=
              normalizedCredits,
        )
        .map(
          (selection) =>
            baseOption.baseLink +
            selection.linkDelta +
            normalizedCredits -
            baseOption.activationCost -
            selection.activationCost +
            traceCreditPool,
        ),
    ),
  );
  return {
    availableCredits: normalizedCredits,
    traceCreditPool,
    runnerTraceCapacity,
    baseLinkOptions,
    postBidLinkOptions,
    traceSuccessCancelOptions,
  };
}

export function visibleTraceCreditPool(
  quote: VisibleRunnerTraceSupportQuote | undefined,
  excludeStealthCredits = false,
): number {
  if (!quote) return 0;
  const traceCreditPool = quote.traceCreditSources
    .filter((source) => !excludeStealthCredits || !source.isStealth)
    .reduce(
      (total, source) => total + Math.max(0, Math.floor(source.amount)),
      0,
    );
  if (traceCreditPool > quote.traceCreditPool) {
    throw new Error("Trace-Credit-Quellen uebersteigen den sichtbaren Pool.");
  }
  return traceCreditPool;
}

export function visibleTraceAvoidanceForBaseStrength(
  traceBaseStrength: number,
  support: VisibleRunnerTraceSupport,
): VisibleTraceAvoidanceAssessment {
  const baseStrength = Math.max(0, Math.floor(traceBaseStrength));
  const candidates = support.baseLinkOptions.flatMap((option) =>
    visibleTracePostBidSelections(support.postBidLinkOptions).map(
      (postBidSelection) => {
        const activationCost =
          option.activationCost + postBidSelection.activationCost;
        const effectiveLink = option.baseLink + postBidSelection.linkDelta;
        const traceBidCost = Math.max(0, baseStrength - effectiveLink);
        const traceCreditPoolSpent = Math.min(
          support.traceCreditPool,
          traceBidCost,
        );
        const creditBidCost = traceBidCost - traceCreditPoolSpent;
        const creditCost = activationCost + creditBidCost;
        const affordable =
          activationCost <= support.availableCredits &&
          traceBidCost <=
            support.availableCredits - activationCost + support.traceCreditPool;
        return {
          ...option,
          activationCost,
          safeForAccess: option.safeForAccess && postBidSelection.safeForAccess,
          creditCost,
          traceBidCost,
          affordable,
          traceCreditPoolSpent,
          consumedSourceIds: postBidSelection.consumedSourceIds,
          runnerTraceCapacity:
            effectiveLink +
            Math.max(0, support.availableCredits - activationCost) +
            support.traceCreditPool,
        };
      },
    ),
  );
  const assessment: VisibleTraceAvoidanceAssessment = {};
  const cheapestSafe = cheapestTraceAvoidanceCandidate(
    candidates.filter((candidate) => candidate.safeForAccess),
  );
  const cheapestAffordableSafe = cheapestTraceAvoidanceCandidate(
    candidates.filter(
      (candidate) => candidate.safeForAccess && candidate.affordable,
    ),
  );
  const cheapestUnsafe = cheapestTraceAvoidanceCandidate(
    candidates.filter((candidate) => !candidate.safeForAccess),
  );
  const cheapestAffordableUnsafe = cheapestTraceAvoidanceCandidate(
    candidates.filter(
      (candidate) => !candidate.safeForAccess && candidate.affordable,
    ),
  );
  if (cheapestSafe) assessment.cheapestSafe = cheapestSafe;
  if (cheapestAffordableSafe)
    assessment.cheapestAffordableSafe = cheapestAffordableSafe;
  if (cheapestUnsafe) assessment.cheapestUnsafe = cheapestUnsafe;
  if (cheapestAffordableUnsafe)
    assessment.cheapestAffordableUnsafe = cheapestAffordableUnsafe;
  return assessment;
}

function visibleTracePostBidSelections(
  options: VisibleRunnerTracePostBidLinkOption[],
): Array<{
  linkDelta: number;
  activationCost: number;
  safeForAccess: boolean;
  consumedSourceIds: string[];
}> {
  let selections: Array<{
    linkDelta: number;
    activationCost: number;
    safeForAccess: boolean;
    consumedSourceIds: string[];
  }> = [
    {
      linkDelta: 0,
      activationCost: 0,
      safeForAccess: true,
      consumedSourceIds: [],
    },
  ];
  for (const option of options) {
    selections = [
      ...selections,
      ...selections.map((selection) => ({
        linkDelta: selection.linkDelta + option.linkDelta,
        activationCost: selection.activationCost + option.activationCost,
        safeForAccess: selection.safeForAccess && option.safeForAccess,
        consumedSourceIds:
          option.tapSource || option.trashSource
            ? [...selection.consumedSourceIds, option.sourceCardInstanceId]
            : selection.consumedSourceIds,
      })),
    ];
  }
  return selections;
}

function traceSupportQuoteWithoutConsumedSources(
  quote: VisibleRunnerTraceSupportQuote | undefined,
  consumedSourceIds: Set<string>,
): VisibleRunnerTraceSupportQuote | undefined {
  if (!quote || consumedSourceIds.size === 0) return quote;
  return {
    ...quote,
    postBidLinkOptions: quote.postBidLinkOptions.filter(
      (option) => !consumedSourceIds.has(option.sourceCardInstanceId),
    ),
    traceSuccessCancelOptions: quote.traceSuccessCancelOptions.filter(
      (option) => !consumedSourceIds.has(option.sourceCardInstanceId),
    ),
  };
}

function cheapestTraceSuccessCancel(
  support: VisibleRunnerTraceSupport,
  availableCredits: number,
): VisibleRunnerTraceSuccessCancelOption | undefined {
  return support.traceSuccessCancelOptions
    .filter((option) => option.activationCost <= availableCredits)
    .sort(
      (left, right) =>
        left.activationCost - right.activationCost ||
        left.sourceCardInstanceId.localeCompare(right.sourceCardInstanceId),
    )[0];
}

export function cheapestTraceAvoidanceCandidate(
  candidates: VisibleTraceAvoidanceCandidate[],
): VisibleTraceAvoidanceCandidate | undefined {
  return candidates.sort(
    (a, b) =>
      a.creditCost - b.creditCost ||
      a.activationCost - b.activationCost ||
      b.baseLink - a.baseLink,
  )[0];
}

export function traceBaseStrengthForVisibleSubroutine(
  subroutine: VisibleEffectiveSubroutine,
): number | undefined {
  if (typeof subroutine.traceLimit === "number") {
    return Math.max(0, Math.floor(subroutine.traceLimit));
  }
  return undefined;
}

export function traceSuccessEffectForVisibleSubroutine(
  subroutine: VisibleEffectiveSubroutine,
): TraceSuccessEffect | undefined {
  return subroutine.traceSuccessEffect;
}

export function runPathEffectAlreadyVisibleOnFutureIce(
  effect: RunPathProjectionEffect,
  futureIce: IceCardLike[],
): boolean {
  if ((effect.addsFutureEndTheRunSubroutines ?? 0) > 0) {
    return futureIce.some((ice) =>
      effectiveRunQuoteForIce(ice)?.subroutines.some(
        (subroutine) =>
          subroutine.type === "end_the_run" &&
          subroutine.dynamicSourceKind === "run_duration_additional_subroutine",
      ),
    );
  }
  if ((effect.increasesFutureBreakCostPerSubroutine ?? 0) > 0) {
    return futureIce.some((ice) => {
      const quote = effectiveRunQuoteForIce(ice);
      if (!quote) return false;
      const cost = quote.breakSubroutineAdditionalCostPerSubroutine ?? 0;
      const attributedCostSources =
        quote.breakSubroutineCostSourceDefinitionIds?.length ?? 0;
      return cost > attributedCostSources;
    });
  }
  if ((effect.increasesFutureIceStrength ?? 0) > 0) {
    // A higher effective strength can come from the future ICE's own ability,
    // so it does not prove that this earlier run-duration modifier is already
    // included in the quote.
    return false;
  }
  return false;
}

export function runPathProjectionEffectCanMatter(
  effect: RunPathProjectionEffect,
): boolean {
  return (
    (effect.addsFutureEndTheRunSubroutines ?? 0) > 0 ||
    (effect.increasesFutureBreakCostPerSubroutine ?? 0) > 0 ||
    (effect.increasesFutureIceStrength ?? 0) > 0 ||
    (effect.addsFutureEncounterCost ?? 0) > 0 ||
    effect.preventsFutureBreaking === true ||
    effect.preventsJackOut === true ||
    effect.causesDamageOrProgramTrash === true ||
    (effect.createsRunLockOrActionTax ?? 0) > 0
  );
}

export function hardUnbrokenRunEffectKinds(
  effect: RunPathProjectionEffect,
  futureIceCount: number,
  options: { unavoidableTraceRunLock?: boolean } = {},
): HardUnbrokenRunEffectKind[] {
  const kinds: HardUnbrokenRunEffectKind[] = [];
  if (effect.causesDamageOrProgramTrash === true)
    kinds.push("damage_or_program_trash");
  if (
    (effect.createsRunLockOrActionTax ?? 0) > 0 &&
    !traceRunLockCanBeAvoidedByCurrentCredits(effect, options)
  ) {
    kinds.push("run_lock_or_action_tax");
  }
  if (effect.preventsJackOut === true && futureIceCount > 0)
    kinds.push("jack_out_lock");
  return kinds;
}

export function traceRunLockCanBeAvoidedByCurrentCredits(
  effect: RunPathProjectionEffect,
  options: { unavoidableTraceRunLock?: boolean },
): boolean {
  return (
    (effect.createsRunLockOrActionTax ?? 0) > 0 &&
    options.unavoidableTraceRunLock === false
  );
}

export function unbrokenEffectIsUnavoidableTraceRunLock(
  effect: RunPathProjectionEffect,
  sourceSubroutine: VisibleEffectiveSubroutine,
  remainingCredits: number,
): boolean | undefined {
  if ((effect.createsRunLockOrActionTax ?? 0) <= 0) return undefined;
  if (sourceSubroutine.type !== "initiate_trace") return undefined;
  const traceBaseStrength =
    typeof sourceSubroutine.traceLimit === "number"
      ? Math.max(0, Math.floor(sourceSubroutine.traceLimit))
      : typeof sourceSubroutine.amount === "number"
        ? Math.max(0, Math.floor(sourceSubroutine.amount))
        : undefined;
  if (traceBaseStrength === undefined) return true;
  const runnerVisibleTraceCapacity = Math.max(0, Math.floor(remainingCredits));
  return traceBaseStrength > runnerVisibleTraceCapacity;
}
