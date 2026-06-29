import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardDefinitionId,
  type PublicGameEvent,
  type TraceSuccessEffect,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import { traceBaseLinkCardImplementationQuotesForDefinition } from "@netgrid/engine";
import { RUNTIME_CARDS } from "./ai-hints";
import { breakerCardBlocksAccessReachability } from "./breaker-ontology-consumer";

type IceCardLike = {
  definitionId?: string;
  rezzed?: boolean;
  known: boolean;
  subtypes?: string[];
  strength?: number;
  effectiveRunQuote?: VisibleEffectiveIceRunQuote;
};
type RootCardLike = { definitionId?: string; rezzed?: boolean; known: boolean };
type RunPathProjectionEffect = NonNullable<
  VisibleEffectiveSubroutine["unbrokenRunEffect"]
>;
type RunPathProjection = {
  effect: RunPathProjectionEffect;
  sourceSubroutine: VisibleEffectiveSubroutine;
};
type HardUnbrokenRunEffectKind =
  | "damage_or_program_trash"
  | "run_lock_or_action_tax"
  | "jack_out_lock";
type BreakAssessment = {
  cost: number;
  breakerInstanceId: string;
  endingStrength: number;
  carriesStrengthAcrossIce: boolean;
};
type VisibleTraceSupportSideEffect = "forces_jack_out_after_encounter";
export type VisibleIceRunHazardKind =
  | "trace_tag"
  | "trace_tag_counter"
  | "trace_counter"
  | "trace_damage"
  | "trace_trash"
  | "trace_run_lock";
export type VisibleIceRunHazardSeverity = "low" | "medium" | "high";
export type VisibleIceRunHazard = {
  kind: VisibleIceRunHazardKind;
  severity: VisibleIceRunHazardSeverity;
  iceIndex: number;
  sourceDefinitionId?: string;
  sourceTitle?: string;
  subroutineId: string;
  traceBaseStrength?: number;
  runnerTraceCapacity: number;
  baseTraceCovered?: boolean;
  visibleCorpBidCapacity?: number;
  visibleCorpMaxTraceCovered?: boolean;
  traceAvoidanceCost?: number;
  visibleCorpMaxTraceAvoidanceCost?: number;
  traceBidCost?: number;
  baseLinkValue?: number;
  baseLinkActivationCost?: number;
  baseLinkSourceDefinitionId?: string;
  baseLinkSourceTitle?: string;
  baseLinkSideEffect?: VisibleTraceSupportSideEffect;
  breakAvoidanceCost?: number;
  minimumAvoidanceCost?: number;
  unavoidable: boolean;
  expectedTags?: number;
  expectedCounters?: number;
  expectedDamage?: number;
  actionTax?: number;
  penalty: number;
  evidence: string[];
};
export type KnownRezzedIcePathAssessment = {
  blocked: boolean;
  visibleBreakCost?: number;
  visibleIceRunHazards?: VisibleIceRunHazard[];
  visibleIceHazardPenalty?: number;
  visibleIceHazardAvoidanceCost?: number;
  creditsAfterAvoidingVisibleIceHazards?: number;
  expectedTagsFromVisibleIce?: number;
  unavoidableVisibleIceHazardCount?: number;
  visibleTraceTagHazardUnavoidable?: boolean;
  canReachAccess: boolean;
  knownPathBlockedByUnbreakableIce: boolean;
  knownPathBlockedByMissingCoverage: boolean;
  knownPathBlockedByEtr: boolean;
  knownPathBlockedByHardUnbrokenEffect?: boolean;
  knownPathBlockedByUnavoidableTraceRunLock?: boolean;
  hardUnbrokenRunEffects?: HardUnbrokenRunEffectKind[];
  creditsAfterPath: number;
  canBreakNextIceButNotFullPath: boolean;
  unpayableIceIndex?: number;
  unbreakableIceIndex?: number;
  unbreakableIceTitle?: string;
  hardUnbrokenEffectIceIndex?: number;
  hardUnbrokenEffectIceTitle?: string;
  missingCoverage?: Array<
    "wall" | "code_gate" | "sentry" | "ap" | "trace" | "unknown_special"
  >;
  hasBypassOrSpecialAccessPlan: boolean;
  reachableAccessReason?: string;
  noAccessReason?:
    | "known_path_unpayable"
    | "known_path_unbreakable"
    | "missing_breaker_coverage"
    | "known_etr_without_breaker"
    | "harmful_unbroken_run_effect";
  creditsSpentBeforeUnpayableIce: number;
  unpayableReason?:
    | "ice_unbreakable"
    | "ice_unaffordable"
    | "later_ice_unaffordable_after_prior_ice_cost";
  assessedKnownIceCount: number;
};

export function runnerKnownPathAssessmentIsCostNoAccess(
  assessment: KnownRezzedIcePathAssessment,
): boolean {
  return (
    assessment.unpayableReason === "ice_unaffordable" ||
    assessment.unpayableReason === "later_ice_unaffordable_after_prior_ice_cost"
  );
}

export function runnerKnownPathAssessmentIsUnbreakableNoAccess(
  assessment: KnownRezzedIcePathAssessment,
): boolean {
  return (
    assessment.unpayableReason === "ice_unbreakable" ||
    assessment.knownPathBlockedByUnbreakableIce === true ||
    assessment.knownPathBlockedByMissingCoverage === true
  );
}

export function runnerKnownPathAssessmentIsKnownNoAccess(
  assessment: KnownRezzedIcePathAssessment,
): boolean {
  return (
    runnerKnownPathAssessmentIsCostNoAccess(assessment) ||
    runnerKnownPathAssessmentIsUnbreakableNoAccess(assessment)
  );
}

const RUN_REMAINDER_STRENGTH_BREAKER_IDS = new Set([
  "onr_v1_030_grubb",
  "onr_v1_039_krash",
]);

export function serverIdFromEvent(event: PublicGameEvent): string | undefined {
  const candidate =
    event.publicPayload.serverId ??
    event.publicPayload.attackedServerId ??
    event.publicPayload.server ??
    event.publicPayload.targetServerId;
  if (typeof candidate === "string") return candidate;
  return undefined;
}

export function assessKnownRezzedIcePath(
  iceCards: IceCardLike[],
  rigCards: VisibleCard[],
  runnerCredits: number,
  rootCards: RootCardLike[] = [],
  visibleCorpBidCapacity = 0,
): KnownRezzedIcePathAssessment {
  return assessKnownRezzedIcePathInternal(
    iceCards,
    rigCards,
    runnerCredits,
    rootCards,
    normalizeVisibleCorpBidCapacity(visibleCorpBidCapacity),
    [],
    { allowBreakingRunPathEffects: true },
  );
}

function assessKnownRezzedIcePathInternal(
  iceCards: IceCardLike[],
  rigCards: VisibleCard[],
  runnerCredits: number,
  rootCards: RootCardLike[],
  visibleCorpBidCapacity: number,
  initialRunPathEffects: RunPathProjectionEffect[],
  options: { allowBreakingRunPathEffects: boolean },
  initialBreakerStrengths?: Map<string, number>,
): KnownRezzedIcePathAssessment {
  let visibleBreakCost = 0;
  let remainingCredits = runnerCredits;
  let creditsAfterAvoidingVisibleIceHazards = runnerCredits;
  const visibleIceRunHazards: VisibleIceRunHazard[] = [];
  let assessedKnownIceCount = 0;
  let firstKnownIceBreakable = false;
  let activeRunPathEffects = initialRunPathEffects.slice();
  const breakerStrengths = new Map(
    rigCards.map((card) => [card.instanceId, card.strength ?? 0]),
  );
  if (initialBreakerStrengths) {
    for (const [instanceId, strength] of initialBreakerStrengths) {
      breakerStrengths.set(instanceId, strength);
    }
  }
  for (const { ice, iceIndex } of iceCards
    .map((ice, iceIndex) => ({ ice, iceIndex }))
    .reverse()) {
    const iceDefinitionId = ice.definitionId;
    if (!iceDefinitionId || !ice.known || ice.rezzed !== true) continue;
    const effectiveIce = projectIceForRunPathEffects(
      ice,
      activeRunPathEffects,
      iceIndex,
    );
    const pathCostBeforeIce = visibleBreakCost;
    assessedKnownIceCount += 1;
    const quote = runQuoteForIce(effectiveIce, iceIndex);
    const endTheRunCount = quote
      ? quote.subroutines.filter(
          (subroutine) => subroutine.type === "end_the_run",
        ).length
      : endTheRunSubroutineCount(iceDefinitionId);
    const additionalBreakCostPerSubroutine =
      quote?.breakSubroutineAdditionalCostPerSubroutine ?? 0;
    const encounterTax = activeRunPathEffects.reduce(
      (sum, effect) =>
        sum + Math.max(0, Math.floor(effect.addsFutureEncounterCost ?? 0)),
      0,
    );
    if (encounterTax > 0) {
      if (encounterTax > remainingCredits) {
        return blockedPathAssessment(
          visibleBreakCost + encounterTax,
          remainingCredits - encounterTax,
          iceIndex,
          effectiveIce.definitionId,
          effectiveIce.subtypes,
          pathCostBeforeIce,
          firstKnownIceBreakable,
          assessedKnownIceCount,
          pathCostBeforeIce > 0
            ? "later_ice_unaffordable_after_prior_ice_cost"
            : "ice_unaffordable",
        );
      }
      visibleBreakCost += encounterTax;
      remainingCredits -= encounterTax;
      creditsAfterAvoidingVisibleIceHazards -= encounterTax;
    }
    if (endTheRunCount > 0) {
      const breakAssessment = runPathEffectsPreventFutureBreaking(
        activeRunPathEffects,
      )
        ? undefined
        : minimumCreditsToBreakEndTheRunSubroutines(
            effectiveIceForQuote(effectiveIce, quote),
            rigCards,
            endTheRunCount,
            breakerStrengths,
            additionalBreakCostPerSubroutine,
          );
      if (!breakAssessment) {
        return blockedPathAssessment(
          visibleBreakCost,
          remainingCredits,
          iceIndex,
          effectiveIce.definitionId,
          effectiveIce.subtypes,
          visibleBreakCost,
          firstKnownIceBreakable,
          assessedKnownIceCount,
          "ice_unbreakable",
        );
      }
      if (breakAssessment.cost > remainingCredits) {
        return blockedPathAssessment(
          visibleBreakCost + breakAssessment.cost,
          remainingCredits - breakAssessment.cost,
          iceIndex,
          effectiveIce.definitionId,
          effectiveIce.subtypes,
          visibleBreakCost,
          firstKnownIceBreakable,
          assessedKnownIceCount,
          visibleBreakCost > 0
            ? "later_ice_unaffordable_after_prior_ice_cost"
            : "ice_unaffordable",
        );
      }
      visibleBreakCost += breakAssessment.cost;
      remainingCredits -= breakAssessment.cost;
      creditsAfterAvoidingVisibleIceHazards -= breakAssessment.cost;
      firstKnownIceBreakable = true;
      if (breakAssessment.carriesStrengthAcrossIce) {
        breakerStrengths.set(
          breakAssessment.breakerInstanceId,
          breakAssessment.endingStrength,
        );
      }
    }
    const payOrEndSubroutines =
      quote?.subroutines.filter(
        (subroutine) => subroutine.type === "end_the_run_unless_runner_pays",
      ) ?? [];
    for (const subroutine of payOrEndSubroutines) {
      const payCost = Math.max(0, Math.floor(subroutine.amount ?? 0));
      const breakAssessment = runPathEffectsPreventFutureBreaking(
        activeRunPathEffects,
      )
        ? undefined
        : minimumCreditsToBreakEndTheRunSubroutines(
            effectiveIceForQuote(effectiveIce, quote),
            rigCards,
            1,
            breakerStrengths,
            additionalBreakCostPerSubroutine,
          );
      const handlingCost = Math.min(payCost, breakAssessment?.cost ?? payCost);
      if (handlingCost > remainingCredits) {
        return blockedPathAssessment(
          visibleBreakCost + handlingCost,
          remainingCredits - handlingCost,
          iceIndex,
          effectiveIce.definitionId,
          effectiveIce.subtypes,
          pathCostBeforeIce,
          firstKnownIceBreakable,
          assessedKnownIceCount,
          pathCostBeforeIce > 0
            ? "later_ice_unaffordable_after_prior_ice_cost"
            : "ice_unaffordable",
        );
      }
      visibleBreakCost += handlingCost;
      remainingCredits -= handlingCost;
      creditsAfterAvoidingVisibleIceHazards -= handlingCost;
      firstKnownIceBreakable = true;
      if (
        breakAssessment &&
        handlingCost === breakAssessment.cost &&
        breakAssessment.carriesStrengthAcrossIce
      ) {
        breakerStrengths.set(
          breakAssessment.breakerInstanceId,
          breakAssessment.endingStrength,
        );
      }
    }
    const visibleHazards = visibleIceRunHazardsForQuote({
      quote,
      ice: effectiveIce,
      iceIndex,
      rigCards,
      availableCredits: Math.max(0, creditsAfterAvoidingVisibleIceHazards),
      visibleCorpBidCapacity,
      breakerStrengths,
      additionalBreakCostPerSubroutine,
    });
    for (const hazard of visibleHazards) {
      visibleIceRunHazards.push(hazard);
      if (!hazard.unavoidable && hazard.minimumAvoidanceCost !== undefined) {
        creditsAfterAvoidingVisibleIceHazards -= hazard.minimumAvoidanceCost;
      }
    }
    const futureIce = iceCards.slice(0, Math.max(0, iceIndex));
    const runPathEffects = pathProjectionEffectsForQuote(quote).filter(
      ({ effect }) => !runPathEffectAlreadyVisibleOnFutureIce(effect, futureIce),
    );
    for (const { effect, sourceSubroutine } of runPathEffects) {
      const unavoidableTraceRunLock =
        unbrokenEffectIsUnavoidableTraceRunLock(
          effect,
          sourceSubroutine,
          remainingCredits,
        );
      const hardEffectKinds = hardUnbrokenRunEffectKinds(
        effect,
        futureIce.length,
        unavoidableTraceRunLock === undefined
          ? {}
          : { unavoidableTraceRunLock },
      );
      if (hardEffectKinds.length > 0) {
        const breakAssessment =
          options.allowBreakingRunPathEffects &&
          !runPathEffectsPreventFutureBreaking(activeRunPathEffects)
            ? minimumCreditsToBreakEndTheRunSubroutines(
                effectiveIceForQuote(effectiveIce, quote),
                rigCards,
                1,
                breakerStrengths,
                additionalBreakCostPerSubroutine,
              )
            : undefined;
        if (breakAssessment && breakAssessment.cost <= remainingCredits) {
          visibleBreakCost += breakAssessment.cost;
          remainingCredits -= breakAssessment.cost;
          creditsAfterAvoidingVisibleIceHazards -= breakAssessment.cost;
          firstKnownIceBreakable = true;
          if (breakAssessment.carriesStrengthAcrossIce) {
            breakerStrengths.set(
              breakAssessment.breakerInstanceId,
              breakAssessment.endingStrength,
            );
          }
          continue;
        }
        return hardUnbrokenEffectBlockedPathAssessment({
          visibleBreakCost:
            visibleBreakCost + Math.max(0, breakAssessment?.cost ?? 0),
          creditsAfterPath:
            breakAssessment && breakAssessment.cost > remainingCredits
              ? remainingCredits - breakAssessment.cost
              : remainingCredits,
          iceIndex,
          iceDefinitionId: effectiveIce.definitionId,
          iceSubtypes: effectiveIce.subtypes,
          creditsSpentBeforeUnpayableIce: visibleBreakCost,
          firstKnownIceBreakable,
          assessedKnownIceCount,
          effectKinds: hardEffectKinds,
          ...(unavoidableTraceRunLock === undefined
            ? {}
            : { unavoidableTraceRunLock }),
          unpayableReason:
            breakAssessment === undefined
              ? "ice_unbreakable"
              : visibleBreakCost > 0
                ? "later_ice_unaffordable_after_prior_ice_cost"
                : "ice_unaffordable",
        });
      }
      const breakAssessment =
        options.allowBreakingRunPathEffects
          ? runPathEffectBreakAssessment({
              iceCards,
              iceIndex,
              ice: effectiveIce,
              quote,
              effect,
              activeRunPathEffects,
              rigCards,
              rootCards,
              remainingCredits,
              visibleCorpBidCapacity,
              breakerStrengths,
              additionalBreakCostPerSubroutine,
            })
          : undefined;
      if (breakAssessment) {
        visibleBreakCost += breakAssessment.cost;
        remainingCredits -= breakAssessment.cost;
        creditsAfterAvoidingVisibleIceHazards -= breakAssessment.cost;
        firstKnownIceBreakable = true;
        if (breakAssessment.carriesStrengthAcrossIce) {
          breakerStrengths.set(
            breakAssessment.breakerInstanceId,
            breakAssessment.endingStrength,
          );
        }
      } else {
        activeRunPathEffects = [...activeRunPathEffects, effect];
      }
    }
  }
  return {
    blocked: false,
    ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}),
    ...visibleIceRunHazardSummary(
      visibleIceRunHazards,
      creditsAfterAvoidingVisibleIceHazards,
    ),
    canReachAccess: true,
    knownPathBlockedByUnbreakableIce: false,
    knownPathBlockedByMissingCoverage: false,
    knownPathBlockedByEtr: false,
    creditsAfterPath: remainingCredits,
    canBreakNextIceButNotFullPath: false,
    hasBypassOrSpecialAccessPlan: false,
    reachableAccessReason: "known_path_reachable",
    creditsSpentBeforeUnpayableIce: 0,
    assessedKnownIceCount,
  };
}

function runPathEffectBreakAssessment(params: {
  iceCards: IceCardLike[];
  iceIndex: number;
  ice: IceCardLike;
  quote: VisibleEffectiveIceRunQuote | undefined;
  effect: RunPathProjectionEffect;
  activeRunPathEffects: RunPathProjectionEffect[];
  rigCards: VisibleCard[];
  rootCards: RootCardLike[];
  remainingCredits: number;
  visibleCorpBidCapacity: number;
  breakerStrengths: Map<string, number>;
  additionalBreakCostPerSubroutine: number;
}): BreakAssessment | undefined {
  if (!runPathProjectionEffectCanMatter(params.effect)) return undefined;
  const futureIce = params.iceCards.slice(0, Math.max(0, params.iceIndex));
  if (futureIce.length <= 0) return undefined;
  const breakAssessment = minimumCreditsToBreakEndTheRunSubroutines(
    effectiveIceForQuote(params.ice, params.quote),
    params.rigCards,
    1,
    params.breakerStrengths,
    params.additionalBreakCostPerSubroutine,
  );
  if (!breakAssessment || breakAssessment.cost > params.remainingCredits)
    return undefined;

  const futureWithoutEffect = assessKnownRezzedIcePathInternal(
    futureIce,
    params.rigCards,
    params.remainingCredits,
    params.rootCards,
    params.visibleCorpBidCapacity,
    params.activeRunPathEffects,
    { allowBreakingRunPathEffects: false },
    new Map(params.breakerStrengths),
  );
  const futureWithEffect = assessKnownRezzedIcePathInternal(
    futureIce,
    params.rigCards,
    params.remainingCredits,
    params.rootCards,
    params.visibleCorpBidCapacity,
    [...params.activeRunPathEffects, params.effect],
    { allowBreakingRunPathEffects: false },
    new Map(params.breakerStrengths),
  );
  const breakerStrengthsAfterBreak = new Map(params.breakerStrengths);
  if (breakAssessment.carriesStrengthAcrossIce) {
    breakerStrengthsAfterBreak.set(
      breakAssessment.breakerInstanceId,
      breakAssessment.endingStrength,
    );
  }
  const futureAfterBreak = assessKnownRezzedIcePathInternal(
    futureIce,
    params.rigCards,
    params.remainingCredits - breakAssessment.cost,
    params.rootCards,
    params.visibleCorpBidCapacity,
    params.activeRunPathEffects,
    { allowBreakingRunPathEffects: false },
    breakerStrengthsAfterBreak,
  );
  if (!futureAfterBreak.canReachAccess) return undefined;
  const effectCreatesNoAccess =
    futureWithoutEffect.canReachAccess &&
    !futureWithEffect.canReachAccess &&
    futureWithEffect.assessedKnownIceCount > 0;
  if (effectCreatesNoAccess) return breakAssessment;
  const futureCostDelta = Math.max(
    0,
    (futureWithEffect.visibleBreakCost ?? 0) -
      (futureWithoutEffect.visibleBreakCost ?? 0),
  );
  return futureCostDelta > breakAssessment.cost ? breakAssessment : undefined;
}

function pathProjectionEffectsForQuote(
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

function visibleIceRunHazardSummary(
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

function visibleIceRunHazardsForQuote(params: {
  quote: VisibleEffectiveIceRunQuote | undefined;
  ice: IceCardLike;
  iceIndex: number;
  rigCards: VisibleCard[];
  availableCredits: number;
  visibleCorpBidCapacity: number;
  breakerStrengths: Map<string, number>;
  additionalBreakCostPerSubroutine: number;
}): VisibleIceRunHazard[] {
  if (!params.quote) return [];
  const hazards: VisibleIceRunHazard[] = [];
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
        : visibleTraceAvoidanceForBaseStrength(
            traceBaseStrength,
            traceSupport,
          );
    const visibleCorpBidCapacity = Math.max(
      0,
      Math.floor(params.visibleCorpBidCapacity),
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
    const baseLinkEvidenceSource =
      guaranteedTraceAvoidance?.baseLink
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
    hazards.push({
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
          ? [`visible_trace_base_link_source:${baseLinkEvidenceSource.sourceTitle}`]
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
    });
    if (!unavoidable && minimumAvoidanceCost !== undefined) {
      remainingHazardCredits -= minimumAvoidanceCost;
      if (
        usesBreakAvoidance &&
        breakAssessment?.carriesStrengthAcrossIce === true
      ) {
        params.breakerStrengths.set(
          breakAssessment.breakerInstanceId,
          breakAssessment.endingStrength,
        );
      }
    }
  });
  return hazards;
}

function visibleIceRunHazardForTraceEffect(
  effect: TraceSuccessEffect | undefined,
): Omit<
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
> | undefined {
  if (!effect || effect.type === "none") return undefined;
  switch (effect.type) {
    case "add_tag":
      return {
        kind: "trace_tag",
        severity: "high",
        expectedTags: Math.max(1, Math.floor(effect.amount)),
      };
    case "add_tags_by_trace_margin_over_runner_link":
      return {
        kind: "trace_tag",
        severity: "high",
        expectedTags: 1,
      };
    case "add_tag_and_counter":
      return {
        kind: "trace_tag_counter",
        severity: "high",
        expectedTags: Math.max(1, Math.floor(effect.tagAmount)),
        expectedCounters: Math.max(1, Math.floor(effect.amount)),
      };
    case "add_counter":
      return {
        kind: "trace_counter",
        severity: "medium",
        expectedCounters: Math.max(1, Math.floor(effect.amount)),
      };
    case "net_damage":
      return {
        kind: "trace_damage",
        severity: effect.amount >= 3 ? "high" : "medium",
        expectedDamage: Math.max(1, Math.floor(effect.amount)),
      };
    case "end_run_and_run_lock":
      return {
        kind: "trace_run_lock",
        severity: "high",
        actionTax: Math.max(1, Math.floor(effect.amount)),
      };
    case "end_run_trash_program_and_run_lock":
      return {
        kind: "trace_trash",
        severity: "high",
        actionTax: Math.max(1, Math.floor(effect.amount)),
      };
    case "end_run_trash_hardware_and_unpreventable_meat_damage":
      return {
        kind: "trace_damage",
        severity: "high",
        expectedDamage: 2,
      };
    case "trash_runner_resource_and_add_tag":
      return {
        kind: "trace_trash",
        severity: "high",
        expectedTags: 1,
      };
  }
}

function visibleIceHazardPenalty(
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

function normalizeVisibleCorpBidCapacity(value: number): number {
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

function visibleRunnerTraceSupport(
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
        ...(card.definitionId
          ? { sourceDefinitionId: card.definitionId }
          : {}),
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

function visibleTraceAvoidanceForBaseStrength(
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
        support.availableCredits - option.activationCost +
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

function cheapestTraceAvoidanceCandidate(
  candidates: VisibleTraceAvoidanceCandidate[],
): VisibleTraceAvoidanceCandidate | undefined {
  return candidates.sort(
    (a, b) =>
      a.creditCost - b.creditCost ||
      a.activationCost - b.activationCost ||
      b.baseLink - a.baseLink,
  )[0];
}

function traceBaseStrengthForVisibleSubroutine(
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

function traceSuccessEffectForVisibleSubroutine(
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

function definitionSubroutineForVisibleSubroutine(
  quote: VisibleEffectiveIceRunQuote,
  subroutine: VisibleEffectiveSubroutine,
  subroutineIndex: number,
):
  | NonNullable<CardDefinition["subroutines"]>[number]
  | undefined {
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
  return sameType[sameTypeIndex] ?? (sameType.length === 1 ? sameType[0] : undefined);
}

function runPathEffectAlreadyVisibleOnFutureIce(
  effect: RunPathProjectionEffect,
  futureIce: IceCardLike[],
): boolean {
  if ((effect.addsFutureEndTheRunSubroutines ?? 0) > 0) {
    return futureIce.some((ice) =>
      effectiveRunQuoteForIce(ice)?.subroutines.some(
        (subroutine) =>
          subroutine.type === "end_the_run" &&
          subroutine.dynamicSourceKind ===
            "run_duration_additional_subroutine",
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
    return futureIce.some((ice) => {
      const quote = effectiveRunQuoteForIce(ice);
      if (!quote || !ice.definitionId) return false;
      return quote.effectiveStrength > cardDefinitionStrength(ice.definitionId);
    });
  }
  return false;
}

function runPathProjectionEffectCanMatter(
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

function hardUnbrokenRunEffectKinds(
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

function traceRunLockCanBeAvoidedByCurrentCredits(
  effect: RunPathProjectionEffect,
  options: { unavoidableTraceRunLock?: boolean },
): boolean {
  return (
    (effect.createsRunLockOrActionTax ?? 0) > 0 &&
    options.unavoidableTraceRunLock === false
  );
}

function unbrokenEffectIsUnavoidableTraceRunLock(
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

function projectIceForRunPathEffects(
  ice: IceCardLike,
  effects: RunPathProjectionEffect[],
  iceIndex: number,
): IceCardLike {
  if (
    effects.length === 0 ||
    !ice.definitionId ||
    !ice.known ||
    ice.rezzed !== true
  )
    return ice;
  const quote = effectiveRunQuoteForIce(ice);
  const baseQuote: VisibleEffectiveIceRunQuote = quote ?? {
    iceInstanceId: `visible_path.${ice.definitionId}.${iceIndex}`,
    iceDefinitionId: ice.definitionId,
    effectiveStrength: ice.strength ?? cardDefinitionStrength(ice.definitionId),
    subroutines:
      DEMO_CARDS_BY_ID[ice.definitionId]?.subroutines?.map((subroutine) => ({
        id: subroutine.id,
        type: subroutine.type,
        ...(subroutine.amount !== undefined
          ? { amount: subroutine.amount }
          : {}),
        ...(subroutine.baseTraceStrength !== undefined
          ? { baseTraceStrength: subroutine.baseTraceStrength }
          : {}),
        ...(subroutine.traceSuccessEffect
          ? { traceSuccessEffect: subroutine.traceSuccessEffect }
          : {}),
        ...(subroutine.breakTags
          ? { breakTags: subroutine.breakTags.slice() }
          : {}),
      })) ?? [],
  };
  let effectiveStrength = baseQuote.effectiveStrength;
  let breakSubroutineAdditionalCostPerSubroutine =
    baseQuote.breakSubroutineAdditionalCostPerSubroutine ?? 0;
  const subroutines = baseQuote.subroutines.map((subroutine) => ({
    ...subroutine,
  }));
  for (const effect of effects) {
    const addedEndTheRun = Math.max(
      0,
      Math.floor(effect.addsFutureEndTheRunSubroutines ?? 0),
    );
    for (let index = 0; index < addedEndTheRun; index += 1) {
      subroutines.push({
        id: `visible_projection.future_end_the_run.${iceIndex}.${index + 1}`,
        type: "end_the_run",
      });
    }
    effectiveStrength += Math.max(
      0,
      Math.floor(effect.increasesFutureIceStrength ?? 0),
    );
    breakSubroutineAdditionalCostPerSubroutine += Math.max(
      0,
      Math.floor(effect.increasesFutureBreakCostPerSubroutine ?? 0),
    );
  }
  return {
    ...ice,
    strength: effectiveStrength,
    effectiveRunQuote: {
      ...baseQuote,
      effectiveStrength,
      subroutines,
      ...(breakSubroutineAdditionalCostPerSubroutine > 0
        ? { breakSubroutineAdditionalCostPerSubroutine }
        : {}),
    },
  };
}

function runPathEffectsPreventFutureBreaking(
  effects: RunPathProjectionEffect[],
): boolean {
  return effects.some((effect) => effect.preventsFutureBreaking === true);
}

function blockedPathAssessment(
  visibleBreakCost: number,
  creditsAfterPath: number,
  unpayableIceIndex: number,
  unpayableIceDefinitionId: string | undefined,
  unpayableIceSubtypes: string[] | undefined,
  creditsSpentBeforeUnpayableIce: number,
  firstKnownIceBreakable: boolean,
  assessedKnownIceCount: number,
  unpayableReason: NonNullable<KnownRezzedIcePathAssessment["unpayableReason"]>,
): KnownRezzedIcePathAssessment {
  const missingCoverage =
    unpayableReason === "ice_unbreakable"
      ? missingCoverageForIceSubtypes(unpayableIceSubtypes ?? [])
      : undefined;
  const unbreakable = unpayableReason === "ice_unbreakable";
  return {
    blocked: true,
    ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}),
    canReachAccess: false,
    knownPathBlockedByUnbreakableIce: unbreakable,
    knownPathBlockedByMissingCoverage: unbreakable,
    knownPathBlockedByEtr: true,
    creditsAfterPath,
    canBreakNextIceButNotFullPath:
      firstKnownIceBreakable &&
      creditsSpentBeforeUnpayableIce > 0 &&
      unpayableReason === "later_ice_unaffordable_after_prior_ice_cost",
    unpayableIceIndex,
    ...(unbreakable ? { unbreakableIceIndex: unpayableIceIndex } : {}),
    ...(unbreakable && unpayableIceDefinitionId
      ? {
          unbreakableIceTitle:
            visibleRunCardDefinition(unpayableIceDefinitionId)?.title ??
            unpayableIceDefinitionId,
        }
      : {}),
    ...(missingCoverage && missingCoverage.length > 0
      ? { missingCoverage }
      : {}),
    hasBypassOrSpecialAccessPlan: false,
    noAccessReason: unbreakable
      ? missingCoverage && missingCoverage.length > 0
        ? "missing_breaker_coverage"
        : "known_etr_without_breaker"
      : "known_path_unpayable",
    creditsSpentBeforeUnpayableIce,
    assessedKnownIceCount,
    unpayableReason,
  };
}

function hardUnbrokenEffectBlockedPathAssessment(params: {
  visibleBreakCost: number;
  creditsAfterPath: number;
  iceIndex: number;
  iceDefinitionId: string | undefined;
  iceSubtypes: string[] | undefined;
  creditsSpentBeforeUnpayableIce: number;
  firstKnownIceBreakable: boolean;
  assessedKnownIceCount: number;
  effectKinds: HardUnbrokenRunEffectKind[];
  unavoidableTraceRunLock?: boolean;
  unpayableReason: NonNullable<KnownRezzedIcePathAssessment["unpayableReason"]>;
}): KnownRezzedIcePathAssessment {
  const unbreakable = params.unpayableReason === "ice_unbreakable";
  const missingCoverage = unbreakable
    ? missingCoverageForIceSubtypes(params.iceSubtypes ?? [])
    : undefined;
  const title = params.iceDefinitionId
    ? visibleRunCardDefinition(params.iceDefinitionId)?.title ??
      params.iceDefinitionId
    : undefined;
  return {
    blocked: true,
    ...(params.visibleBreakCost > 0
      ? { visibleBreakCost: params.visibleBreakCost }
      : {}),
    canReachAccess: false,
    knownPathBlockedByUnbreakableIce: unbreakable,
    knownPathBlockedByMissingCoverage:
      unbreakable && Boolean(missingCoverage?.length),
    knownPathBlockedByEtr: false,
    knownPathBlockedByHardUnbrokenEffect: true,
    ...(params.unavoidableTraceRunLock
      ? { knownPathBlockedByUnavoidableTraceRunLock: true }
      : {}),
    hardUnbrokenRunEffects: [...new Set(params.effectKinds)].sort(),
    creditsAfterPath: params.creditsAfterPath,
    canBreakNextIceButNotFullPath:
      params.firstKnownIceBreakable &&
      params.creditsSpentBeforeUnpayableIce > 0 &&
      params.unpayableReason === "later_ice_unaffordable_after_prior_ice_cost",
    unpayableIceIndex: params.iceIndex,
    ...(unbreakable ? { unbreakableIceIndex: params.iceIndex } : {}),
    ...(unbreakable && title ? { unbreakableIceTitle: title } : {}),
    hardUnbrokenEffectIceIndex: params.iceIndex,
    ...(title ? { hardUnbrokenEffectIceTitle: title } : {}),
    ...(missingCoverage && missingCoverage.length > 0
      ? { missingCoverage }
      : {}),
    hasBypassOrSpecialAccessPlan: false,
    noAccessReason: "harmful_unbroken_run_effect",
    creditsSpentBeforeUnpayableIce: params.creditsSpentBeforeUnpayableIce,
    unpayableReason: params.unpayableReason,
    assessedKnownIceCount: params.assessedKnownIceCount,
  };
}

function missingCoverageForIceSubtypes(
  subtypes: string[],
): NonNullable<KnownRezzedIcePathAssessment["missingCoverage"]> {
  const normalized = new Set(subtypes.map(subtypeKey));
  const coverage: NonNullable<KnownRezzedIcePathAssessment["missingCoverage"]> =
    [];
  if (normalized.has("wall")) coverage.push("wall");
  if (normalized.has("code_gate")) coverage.push("code_gate");
  if (normalized.has("sentry")) coverage.push("sentry");
  if (
    normalized.has("ap") ||
    normalized.has("black_ice") ||
    normalized.has("killer")
  )
    coverage.push("ap");
  if (normalized.has("trace")) coverage.push("trace");
  if (coverage.length === 0) coverage.push("unknown_special");
  return [...new Set(coverage)].sort();
}

function effectiveRunQuoteForIce(
  ice: IceCardLike,
): VisibleEffectiveIceRunQuote | undefined {
  const quote = ice.effectiveRunQuote;
  if (!quote || quote.iceDefinitionId !== ice.definitionId) return undefined;
  return quote;
}

function runQuoteForIce(
  ice: IceCardLike,
  iceIndex: number,
): VisibleEffectiveIceRunQuote | undefined {
  const quote = effectiveRunQuoteForIce(ice);
  if (quote) return quoteWithFallbackUnbrokenRunEffects(quote);
  if (!ice.definitionId) return undefined;
  const definition = visibleRunCardDefinition(ice.definitionId);
  if (!definition || definition.type !== "ice") return undefined;
  return {
    iceInstanceId: `visible_path.${ice.definitionId}.${iceIndex}`,
    iceDefinitionId: ice.definitionId,
    effectiveStrength: ice.strength ?? cardDefinitionStrength(ice.definitionId),
    subroutines:
      definition.subroutines?.map((subroutine) =>
        visibleSubroutineWithFallbackUnbrokenRunEffect({
          id: subroutine.id,
          type: subroutine.type,
          ...(subroutine.amount !== undefined
            ? { amount: subroutine.amount }
            : {}),
          ...(subroutine.baseTraceStrength !== undefined
            ? { baseTraceStrength: subroutine.baseTraceStrength }
            : {}),
          ...(subroutine.traceSuccessEffect
            ? { traceSuccessEffect: subroutine.traceSuccessEffect }
            : {}),
          ...(subroutine.breakTags
            ? { breakTags: subroutine.breakTags.slice() }
            : {}),
        }),
      ) ?? [],
  };
}

function quoteWithFallbackUnbrokenRunEffects(
  quote: VisibleEffectiveIceRunQuote,
): VisibleEffectiveIceRunQuote {
  return {
    ...quote,
    subroutines: quote.subroutines.map(
      visibleSubroutineWithFallbackUnbrokenRunEffect,
    ),
  };
}

function visibleSubroutineWithFallbackUnbrokenRunEffect(
  subroutine: VisibleEffectiveSubroutine,
): VisibleEffectiveSubroutine {
  const unbrokenRunEffect =
    subroutine.unbrokenRunEffect ??
    fallbackUnbrokenRunEffectForSubroutine(subroutine);
  return unbrokenRunEffect ? { ...subroutine, unbrokenRunEffect } : subroutine;
}

function fallbackUnbrokenRunEffectForSubroutine(subroutine: {
  type: VisibleEffectiveSubroutine["type"];
  amount?: number;
  traceSuccessEffect?: TraceSuccessEffect;
}): RunPathProjectionEffect | undefined {
  const amount = Math.max(0, Math.floor(subroutine.amount ?? 0));
  const traceEffect =
    subroutine.type === "initiate_trace"
      ? fallbackUnbrokenRunEffectForTraceSuccess(subroutine.traceSuccessEffect)
      : undefined;
  if (traceEffect) return traceEffect;
  switch (subroutine.type) {
    case "set_run_future_end_the_run_subroutine":
      return { addsFutureEndTheRunSubroutines: 1 };
    case "set_run_break_subroutine_cost_modifier":
      return amount > 0
        ? { increasesFutureBreakCostPerSubroutine: amount }
        : undefined;
    case "set_run_future_strength_bonus":
      return amount > 0 ? { increasesFutureIceStrength: amount } : undefined;
    case "set_next_encounter_no_break_subroutines":
      return { preventsFutureBreaking: true };
    case "set_run_encounter_tax":
      return amount > 0 ? { addsFutureEncounterCost: amount } : undefined;
    case "set_run_jack_out_lock":
    case "set_next_encounter_lock":
      return { preventsJackOut: true };
    case "set_next_encounter_unless_fully_break_damage":
    case "set_run_pass_rezzed_ice_program_trash":
    case "set_run_active_ice_program_trash":
    case "do_damage":
    case "trash_installed_program":
    case "trash_installed_program_unless_runner_pays":
      return { causesDamageOrProgramTrash: true };
    case "set_runner_run_lock_actions":
      return { createsRunLockOrActionTax: Math.max(1, amount) };
    case "set_runner_forgo_next_action":
      return { createsRunLockOrActionTax: 1 };
    default:
      return undefined;
  }
}

function fallbackUnbrokenRunEffectForTraceSuccess(
  effect: TraceSuccessEffect | undefined,
): RunPathProjectionEffect | undefined {
  if (!effect || effect.type === "none") return undefined;
  switch (effect.type) {
    case "end_run_and_run_lock":
      return { createsRunLockOrActionTax: Math.max(1, effect.amount) };
    case "end_run_trash_program_and_run_lock":
      return { createsRunLockOrActionTax: Math.max(1, effect.amount) };
    default:
      return undefined;
  }
}

function effectiveIceForQuote(
  ice: IceCardLike,
  quote: VisibleEffectiveIceRunQuote | undefined,
): IceCardLike {
  return quote ? { ...ice, strength: quote.effectiveStrength } : ice;
}

function minimumCreditsToBreakVisibleSubroutines(
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  rigCards: VisibleCard[],
  targetSubroutines: readonly VisibleEffectiveSubroutine[],
  breakerStrengths: Map<string, number>,
  additionalBreakCostPerSubroutine = 0,
): BreakAssessment | undefined {
  const costs = rigCards
    .map((card) =>
      creditsToBreakVisibleSubroutinesWithBreaker(
        card,
        ice,
        targetSubroutines,
        breakerStrengths.get(card.instanceId),
        additionalBreakCostPerSubroutine,
      ),
    )
    .filter((cost): cost is BreakAssessment => cost !== undefined)
    .sort(
      (left, right) =>
        left.cost - right.cost ||
        left.breakerInstanceId.localeCompare(right.breakerInstanceId),
    );
  return costs[0];
}

function creditsToBreakVisibleSubroutinesWithBreaker(
  breakerCard: VisibleCard,
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  targetSubroutines: readonly VisibleEffectiveSubroutine[],
  currentBreakerStrength = breakerCard.strength ??
    cardDefinitionStrength(breakerCard.definitionId),
  additionalBreakCostPerSubroutine = 0,
): BreakAssessment | undefined {
  if (
    targetSubroutines.length <= 0 ||
    !breakerCard.known ||
    !breakerCard.definitionId ||
    !ice.definitionId
  )
    return undefined;
  if (breakerCardBlocksAccessReachability(breakerCard.definitionId)) {
    return undefined;
  }
  const breakerDefinition = visibleRunCardDefinition(breakerCard.definitionId);
  const iceDefinition = visibleRunCardDefinition(ice.definitionId);
  if (
    !breakerDefinition ||
    !iceDefinition ||
    !hasSubtype(breakerDefinition.subtypes, "icebreaker")
  )
    return undefined;
  const iceSubtypes = ice.subtypes ?? iceDefinition.subtypes;
  const targetBreakTags = targetSubroutines.map(breakTagsForSubroutine);
  const breakAbility = breakerDefinition.abilities?.find((ability) => {
    if (ability.type !== "break_subroutine") return false;
    if (ability.iceSubtype && !hasSubtype(iceSubtypes, ability.iceSubtype)) {
      return false;
    }
    const abilityBreakTags = ability.subroutineBreakTags ?? [];
    if (abilityBreakTags.length === 0) return true;
    return targetBreakTags.every((tags) =>
      abilityBreakTags.some((tag) => tags.includes(subtypeKey(tag))),
    );
  });
  if (!breakAbility) return undefined;
  const iceStrength = ice.strength ?? iceDefinition.strength ?? 0;
  const pumpAbility = breakerDefinition.abilities?.find(
    (ability) => ability.type === "pump_strength",
  );
  let pumpCost = 0;
  let endingStrength = currentBreakerStrength;
  if (endingStrength < iceStrength) {
    if (!pumpAbility || (pumpAbility.amount ?? 0) <= 0) return undefined;
    const requiredPumps = Math.ceil(
      (iceStrength - endingStrength) / Math.max(1, pumpAbility.amount ?? 1),
    );
    pumpCost = requiredPumps * (pumpAbility.cost.credits ?? 0);
    endingStrength += requiredPumps * Math.max(1, pumpAbility.amount ?? 1);
  }
  const breakCount = Math.max(1, breakAbility.count ?? 1);
  const breakUses = Math.ceil(targetSubroutines.length / breakCount);
  return {
    cost:
      pumpCost +
      breakUses * (breakAbility.cost.credits ?? 0) +
      targetSubroutines.length *
        Math.max(0, additionalBreakCostPerSubroutine),
    breakerInstanceId: breakerCard.instanceId,
    endingStrength,
    carriesStrengthAcrossIce:
      breakerCarriesStrengthAcrossIce(breakerDefinition),
  };
}

function breakTagsForSubroutine(
  subroutine: VisibleEffectiveSubroutine,
): string[] {
  const tags = new Set((subroutine.breakTags ?? []).map(subtypeKey));
  if (subroutine.type === "initiate_trace") tags.add("trace");
  if (subroutine.type === "end_the_run") tags.add("end_the_run");
  if (subroutine.type === "do_damage") tags.add("damage");
  return [...tags];
}

export function minimumCreditsToBreakEndTheRunSubroutines(
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  rigCards: VisibleCard[],
  endTheRunCount: number,
  breakerStrengths: Map<string, number>,
  additionalBreakCostPerSubroutine = 0,
): BreakAssessment | undefined {
  const costs = rigCards
    .map((card) =>
      creditsToBreakEndTheRunSubroutinesWithBreaker(
        card,
        ice,
        endTheRunCount,
        breakerStrengths.get(card.instanceId),
        additionalBreakCostPerSubroutine,
      ),
    )
    .filter((cost): cost is BreakAssessment => cost !== undefined)
    .sort(
      (left, right) =>
        left.cost - right.cost ||
        left.breakerInstanceId.localeCompare(right.breakerInstanceId),
    );
  return costs[0];
}

export function creditsToBreakEndTheRunSubroutinesWithBreaker(
  breakerCard: VisibleCard,
  ice: { definitionId?: string; subtypes?: string[]; strength?: number },
  endTheRunCount: number,
  currentBreakerStrength = breakerCard.strength ??
    cardDefinitionStrength(breakerCard.definitionId),
  additionalBreakCostPerSubroutine = 0,
): BreakAssessment | undefined {
  if (!breakerCard.known || !breakerCard.definitionId || !ice.definitionId)
    return undefined;
  if (breakerCardBlocksAccessReachability(breakerCard.definitionId)) {
    return undefined;
  }
  const breakerDefinition = visibleRunCardDefinition(breakerCard.definitionId);
  const iceDefinition = visibleRunCardDefinition(ice.definitionId);
  if (
    !breakerDefinition ||
    !iceDefinition ||
    !hasSubtype(breakerDefinition.subtypes, "icebreaker")
  )
    return undefined;
  const iceSubtypes = ice.subtypes ?? iceDefinition.subtypes;
  const breakAbility = breakerDefinition.abilities?.find(
    (ability) =>
      ability.type === "break_subroutine" &&
      (!ability.iceSubtype || hasSubtype(iceSubtypes, ability.iceSubtype)),
  );
  if (!breakAbility) return undefined;
  const iceStrength = ice.strength ?? iceDefinition.strength ?? 0;
  const pumpAbility = breakerDefinition.abilities?.find(
    (ability) => ability.type === "pump_strength",
  );
  let pumpCost = 0;
  let endingStrength = currentBreakerStrength;
  if (endingStrength < iceStrength) {
    if (!pumpAbility || (pumpAbility.amount ?? 0) <= 0) return undefined;
    const requiredPumps = Math.ceil(
      (iceStrength - endingStrength) / Math.max(1, pumpAbility.amount ?? 1),
    );
    pumpCost = requiredPumps * (pumpAbility.cost.credits ?? 0);
    endingStrength += requiredPumps * Math.max(1, pumpAbility.amount ?? 1);
  }
  const breakCount = Math.max(1, breakAbility.count ?? 1);
  const breakUses = Math.ceil(endTheRunCount / breakCount);
  return {
    cost:
      pumpCost +
      breakUses * (breakAbility.cost.credits ?? 0) +
      endTheRunCount * Math.max(0, additionalBreakCostPerSubroutine),
    breakerInstanceId: breakerCard.instanceId,
    endingStrength,
    carriesStrengthAcrossIce:
      breakerCarriesStrengthAcrossIce(breakerDefinition),
  };
}

export function endTheRunSubroutineCount(iceDefinitionId: string): number {
  return (
    visibleRunCardDefinition(iceDefinitionId)?.subroutines?.filter(
      (subroutine) => subroutine.type === "end_the_run",
    ).length ?? 0
  );
}

export function canBreakerDefinitionBreakIce(
  breakerDefinitionId: string,
  iceDefinitionId: string,
): boolean {
  if (breakerCardBlocksAccessReachability(breakerDefinitionId)) return false;
  const breakerDefinition = visibleRunCardDefinition(breakerDefinitionId);
  const iceDefinition = visibleRunCardDefinition(iceDefinitionId);
  if (!breakerDefinition || !iceDefinition) return false;
  return Boolean(
    breakerDefinition.abilities?.some(
      (ability) =>
        ability.type === "break_subroutine" &&
        (!ability.iceSubtype ||
          hasSubtype(iceDefinition.subtypes, ability.iceSubtype)),
    ),
  );
}

export function iceHasEndTheRun(iceDefinitionId: string): boolean {
  return endTheRunSubroutineCount(iceDefinitionId) > 0;
}

export function cardDefinitionStrength(
  definitionId: string | undefined,
): number {
  if (!definitionId) return 0;
  return (
    visibleRunCardDefinition(definitionId)?.strength ??
    RUNTIME_CARDS[definitionId]?.numeric.strength ??
    0
  );
}

function visibleRunCardDefinition(
  definitionId: string | undefined,
): CardDefinition | undefined {
  if (!definitionId) return undefined;
  const directDefinition = DEMO_CARDS_BY_ID[definitionId];
  if (directDefinition) return directDefinition;
  const runtimeEngineId = RUNTIME_CARDS[definitionId]?.engineCardId;
  return runtimeEngineId ? DEMO_CARDS_BY_ID[runtimeEngineId] : undefined;
}

export function breakerCarriesStrengthAcrossIce(
  definition: CardDefinition,
): boolean {
  return (
    RUN_REMAINDER_STRENGTH_BREAKER_IDS.has(definition.id) ||
    (definition.mechanics ?? []).includes("run_remainder_strength_bonus")
  );
}

function hasSubtype(subtypes: string[], expectedSubtype: string): boolean {
  const expected = subtypeKey(expectedSubtype);
  return subtypes.some((subtype) => subtypeKey(subtype) === expected);
}

function subtypeKey(subtype: string): string {
  return subtype
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}
