import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinition,
  type CardDefinitionId,
  type CounterCreditUse,
  type TraceSuccessEffect,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import { traceBaseLinkCardImplementationQuotesForDefinition } from "@netgrid/engine";
import { RUNTIME_CARDS } from "../ai-hints";
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
  cardDefinitionStrength,
  effectiveIceForQuote,
  effectiveRunQuoteForIce,
  minimumCreditsToBreakVisibleSubroutines,
  visibleRunCardDefinition,
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
}): VisibleIceRunHazardProjection[] {
  if (!params.quote) return [];
  const hazards: VisibleIceRunHazardProjection[] = [];
  let remainingHazardCredits = Math.max(0, Math.floor(params.availableCredits));
  params.quote.subroutines.forEach((subroutine, subroutineIndex) => {
    if (subroutine.type !== "initiate_trace") return;
    const traceSupport = visibleRunnerTraceSupport(
      params.rigCards,
      remainingHazardCredits,
    );
    const successEffect = traceSuccessEffectForVisibleSubroutine(
      params.quote!,
      subroutine,
      subroutineIndex,
    );
    const baseHazard = visibleIceRunHazardForTraceEffect(successEffect);
    if (!baseHazard) return;
    const traceBaseStrength = traceBaseStrengthForVisibleSubroutine(
      params.quote!,
      subroutine,
      subroutineIndex,
    );
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
    const traceAvoidanceCandidate =
      visibleCorpMaxTraceAvoidance?.cheapestAffordableSafe?.creditCost;
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
        breakAvoidanceCandidate < traceAvoidanceCandidate);
    const unavoidable = minimumAvoidanceCost === undefined;
    const sourceDefinitionId =
      subroutine.sourceDefinitionId ?? params.quote!.iceDefinitionId;
    const sourceTitle =
      subroutine.sourceTitle ??
      visibleRunCardDefinition(sourceDefinitionId)?.title ??
      sourceDefinitionId;
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
        `visible_ice_hazard_source:${sourceTitle}`,
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
  return subroutine.traceBidLimit === undefined
    ? available
    : Math.min(available, Math.max(0, Math.floor(subroutine.traceBidLimit)));
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

type VisibleRunnerTraceSupport = {
  availableCredits: number;
  traceCreditPool: number;
  runnerTraceCapacity: number;
  baseLinkOptions: VisibleRunnerTraceSupportOption[];
};

type VisibleTraceAvoidanceCandidate = VisibleRunnerTraceSupportOption & {
  creditCost: number;
  traceBidCost: number;
  affordable: boolean;
  runnerTraceCapacity: number;
};

type VisibleTraceAvoidanceAssessment = {
  cheapestSafe?: VisibleTraceAvoidanceCandidate;
  cheapestAffordableSafe?: VisibleTraceAvoidanceCandidate;
  cheapestUnsafe?: VisibleTraceAvoidanceCandidate;
  cheapestAffordableUnsafe?: VisibleTraceAvoidanceCandidate;
};

export function visibleRunnerTraceSupport(
  rigCards: VisibleCard[],
  availableCredits: number,
): VisibleRunnerTraceSupport {
  const normalizedCredits = Math.max(0, Math.floor(availableCredits));
  let traceCreditPool = 0;
  const baseLinkOptions: VisibleRunnerTraceSupportOption[] = [
    { baseLink: 0, activationCost: 0, safeForAccess: true },
  ];
  for (const card of rigCards) {
    if (card.known === false) continue;
    const definition = visibleRunCardDefinition(card.definitionId);
    for (const display of card.counterDisplays ?? []) {
      const uses = display.creditPool?.uses ?? [];
      if (uses.includes("increase_link")) {
        traceCreditPool += Math.max(0, Math.floor(display.amount));
      }
    }
    if (
      definition?.mechanics.includes("link_recurring_credit") &&
      definition.recurringCredits !== undefined
    ) {
      traceCreditPool += Math.max(0, Math.floor(definition.recurringCredits));
    }
    if (card.definitionId) {
      const implementationQuotes =
        traceBaseLinkCardImplementationQuotesForDefinition(
          card.definitionId as CardDefinitionId,
        );
      for (const quote of implementationQuotes) {
        const option: VisibleRunnerTraceSupportOption = {
          baseLink: Math.max(0, Math.floor(quote.baseLinkValue)),
          activationCost: Math.max(0, Math.floor(quote.creditCost)),
          safeForAccess: !quote.forcesJackOutAfterEncounter,
          sourceDefinitionId: quote.sourceDefinitionId,
          sourceTitle: quote.label,
        };
        if (quote.forcesJackOutAfterEncounter) {
          option.sideEffect = "forces_jack_out_after_encounter";
        }
        baseLinkOptions.push(option);
      }
      if (implementationQuotes.length > 0) continue;
    }
    const staticIdentityBaseLink =
      card.type === "identity"
        ? Math.max(0, Math.floor(card.baseLink ?? definition?.baseLink ?? 0))
        : 0;
    if (staticIdentityBaseLink > 0) {
      baseLinkOptions.push({
        baseLink: staticIdentityBaseLink,
        activationCost: 0,
        safeForAccess: true,
        ...(card.definitionId ? { sourceDefinitionId: card.definitionId } : {}),
        ...(card.title ? { sourceTitle: card.title } : {}),
      });
    }
  }
  const runnerTraceCapacity = Math.max(
    ...baseLinkOptions
      .filter(
        (option) =>
          option.safeForAccess && option.activationCost <= normalizedCredits,
      )
      .map(
        (option) =>
          option.baseLink +
          normalizedCredits -
          option.activationCost +
          traceCreditPool,
      ),
  );
  return {
    availableCredits: normalizedCredits,
    traceCreditPool,
    runnerTraceCapacity,
    baseLinkOptions,
  };
}

export function visibleTraceAvoidanceForBaseStrength(
  traceBaseStrength: number,
  support: VisibleRunnerTraceSupport,
): VisibleTraceAvoidanceAssessment {
  const baseStrength = Math.max(0, Math.floor(traceBaseStrength));
  const candidates = support.baseLinkOptions.map((option) => {
    const traceBidCost = Math.max(0, baseStrength - option.baseLink);
    const creditBidCost = Math.max(0, traceBidCost - support.traceCreditPool);
    const creditCost = option.activationCost + creditBidCost;
    const affordable =
      option.activationCost <= support.availableCredits &&
      traceBidCost <=
        support.availableCredits -
          option.activationCost +
          support.traceCreditPool;
    return {
      ...option,
      creditCost,
      traceBidCost,
      affordable,
      runnerTraceCapacity:
        option.baseLink +
        Math.max(0, support.availableCredits - option.activationCost) +
        support.traceCreditPool,
    };
  });
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
  quote: VisibleEffectiveIceRunQuote,
  subroutine: VisibleEffectiveSubroutine,
  subroutineIndex: number,
): number | undefined {
  if (typeof subroutine.baseTraceStrength === "number") {
    return Math.max(0, Math.floor(subroutine.baseTraceStrength));
  }
  if (typeof subroutine.amount === "number") {
    return Math.max(0, Math.floor(subroutine.amount));
  }
  const definitionSubroutine = definitionSubroutineForVisibleSubroutine(
    quote,
    subroutine,
    subroutineIndex,
  );
  return definitionSubroutine?.baseTraceStrength === undefined
    ? undefined
    : Math.max(0, Math.floor(definitionSubroutine.baseTraceStrength));
}

export function traceSuccessEffectForVisibleSubroutine(
  quote: VisibleEffectiveIceRunQuote,
  subroutine: VisibleEffectiveSubroutine,
  subroutineIndex: number,
): TraceSuccessEffect | undefined {
  return (
    subroutine.traceSuccessEffect ??
    definitionSubroutineForVisibleSubroutine(quote, subroutine, subroutineIndex)
      ?.traceSuccessEffect
  );
}

export function definitionSubroutineForVisibleSubroutine(
  quote: VisibleEffectiveIceRunQuote,
  subroutine: VisibleEffectiveSubroutine,
  subroutineIndex: number,
): NonNullable<CardDefinition["subroutines"]>[number] | undefined {
  const definition =
    visibleRunCardDefinition(subroutine.sourceDefinitionId) ??
    visibleRunCardDefinition(quote.iceDefinitionId);
  const definitionSubroutines = definition?.subroutines ?? [];
  const byId = definitionSubroutines.find(
    (candidate) => candidate.id === subroutine.id,
  );
  if (byId) return byId;
  const sameType = definitionSubroutines.filter(
    (candidate) => candidate.type === subroutine.type,
  );
  const sameTypeIndex = quote.subroutines
    .slice(0, subroutineIndex)
    .filter((candidate) => candidate.type === subroutine.type).length;
  return (
    sameType[sameTypeIndex] ?? (sameType.length === 1 ? sameType[0] : undefined)
  );
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
    typeof sourceSubroutine.baseTraceStrength === "number"
      ? Math.max(0, Math.floor(sourceSubroutine.baseTraceStrength))
      : typeof sourceSubroutine.amount === "number"
        ? Math.max(0, Math.floor(sourceSubroutine.amount))
        : undefined;
  if (traceBaseStrength === undefined) return true;
  const runnerVisibleTraceCapacity = Math.max(0, Math.floor(remainingCredits));
  return traceBaseStrength > runnerVisibleTraceCapacity;
}
