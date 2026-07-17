import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinition,
  type CardDefinitionId,
  type CounterCreditUse,
  type PublicGameEvent,
  type TraceSuccessEffect,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import { traceBaseLinkCardImplementationQuotesForDefinition } from "@netgrid/engine";
import { RUNTIME_CARDS } from "./ai-hints";
import {
  breakerCardBlocksAccessReachability,
  estimateStructuredBreakerCostForIce,
  getStructuredBreakerProfileForCard,
  structuredBreakerProfileCoversIce,
} from "./breaker-ontology-consumer";
import type {
  BreakAssessment,
  BreakSubroutineAbilityLike,
  CreditPaymentProjection,
  HardUnbrokenRunEffectKind,
  IceCardLike,
  KnownRezzedIcePathAssessment,
  MutableRunnerRunPathCreditBudget,
  PumpStrengthAbilityLike,
  RootCardLike,
  RunnerRunPathCreditBudget,
  RunnerRunPathCreditBudgetInput,
  RunPathProjection,
  RunPathProjectionEffect,
  VisibleDeflectorContext,
  VisibleIceRunHazard,
  VisibleIceRunHazardKind,
  VisibleIceRunHazardProjection,
  VisibleIceRunHazardSeverity,
  VisibleTraceSupportSideEffect,
} from "./run-analysis/visible-run-analysis-contracts";

export type {
  KnownRezzedIcePathAssessment,
  RunnerRunPathCreditBudget,
  VisibleDeflectorContext,
  VisibleIceRunHazard,
  VisibleIceRunHazardKind,
  VisibleIceRunHazardSeverity,
} from "./run-analysis/visible-run-analysis-contracts";
import {
  bestAccessPreservingPayment,
  cloneRunnerRunPathCreditBudget,
  normalizeRunnerRunPathCreditBudget,
  projectBreakerCreditPayment,
  projectGeneralCreditPayment,
  spendBreakerCreditsAndApplySideEffects,
  spendGeneralCredits,
} from "./run-analysis/visible-run-credit-budget";
import {
  blockedPathAssessment,
  effectiveIceForQuote,
  effectiveRunQuoteForIce,
  endTheRunSubroutineCount,
  hardUnbrokenEffectBlockedPathAssessment,
  minimumCreditsToBreakEndTheRunSubroutines,
  minimumCreditsToBreakVisibleSubroutines,
  projectIceForRunPathEffects,
  runPathEffectsPreventFutureBreaking,
  runQuoteForIce,
} from "./run-analysis/visible-run-breaker-path";
import {
  hardUnbrokenRunEffectKinds,
  normalizeVisibleCorpBidCapacity,
  pathProjectionEffectsForQuote,
  runPathEffectAlreadyVisibleOnFutureIce,
  runPathProjectionEffectCanMatter,
  unbrokenEffectIsUnavoidableTraceRunLock,
  visibleIceHazardPenalty,
  visibleIceRunHazardsForQuote,
  visibleIceRunHazardSummary,
} from "./run-analysis/visible-run-hazards";

export {
  runnerRunPathCreditBudgetWithVisiblePools,
  visibleRunnerRunPathCreditBudgetForRig,
} from "./run-analysis/visible-run-credit-budget";
export {
  breakerCarriesStrengthAcrossIce,
  canBreakerDefinitionBreakIce,
  cardDefinitionStrength,
  creditsToBreakEndTheRunSubroutinesWithBreaker,
  endTheRunSubroutineCount,
  iceHasEndTheRun,
  minimumCreditsToBreakEndTheRunSubroutines,
} from "./run-analysis/visible-run-breaker-path";

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
  runnerCredits: RunnerRunPathCreditBudgetInput,
  rootCards: RootCardLike[] = [],
  visibleCorpBidCapacity = 0,
  deflectorContext: VisibleDeflectorContext = {},
): KnownRezzedIcePathAssessment {
  return assessKnownRezzedIcePathInternal(
    iceCards,
    rigCards,
    runnerCredits,
    rootCards,
    normalizeVisibleCorpBidCapacity(visibleCorpBidCapacity),
    [],
    { allowBreakingRunPathEffects: true },
    undefined,
    {
      ...deflectorContext,
      visibleCorpCredits:
        deflectorContext.visibleCorpCredits ??
        normalizeVisibleCorpBidCapacity(visibleCorpBidCapacity),
    },
  );
}

function assessKnownRezzedIcePathInternal(
  iceCards: IceCardLike[],
  rigCards: VisibleCard[],
  runnerCredits: RunnerRunPathCreditBudgetInput,
  rootCards: RootCardLike[],
  visibleCorpBidCapacity: number,
  initialRunPathEffects: RunPathProjectionEffect[],
  options: { allowBreakingRunPathEffects: boolean },
  initialBreakerStrengths?: Map<string, number>,
  deflectorContext: VisibleDeflectorContext = {},
): KnownRezzedIcePathAssessment {
  const creditBudget = normalizeRunnerRunPathCreditBudget(runnerCredits);
  let visibleBreakCost = 0;
  let creditsAfterAvoidingVisibleIceHazards = creditBudget.credits;
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
    const deflectorCount =
      quote?.subroutines.filter((subroutine) =>
        visibleDeflectorSubroutineCanResolve(subroutine, deflectorContext),
      ).length ?? 0;
    const accessPreservingBreakCount = endTheRunCount + deflectorCount;
    const additionalBreakCostPerSubroutine =
      quote?.breakSubroutineAdditionalCostPerSubroutine ?? 0;
    const encounterTax = activeRunPathEffects.reduce(
      (sum, effect) =>
        sum + Math.max(0, Math.floor(effect.addsFutureEncounterCost ?? 0)),
      0,
    );
    if (encounterTax > 0) {
      const payment = projectGeneralCreditPayment(creditBudget, encounterTax);
      if (!payment.affordable) {
        return blockedPathAssessment(
          visibleBreakCost + encounterTax,
          payment.creditsAfterPath,
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
      spendGeneralCredits(creditBudget, encounterTax);
      creditsAfterAvoidingVisibleIceHazards = creditBudget.credits;
    }
    if (accessPreservingBreakCount > 0) {
      const breakAssessment = runPathEffectsPreventFutureBreaking(
        activeRunPathEffects,
      )
        ? undefined
        : minimumCreditsToBreakEndTheRunSubroutines(
            effectiveIceForQuote(effectiveIce, quote),
            rigCards,
            accessPreservingBreakCount,
            breakerStrengths,
            additionalBreakCostPerSubroutine,
          );
      if (!breakAssessment) {
        return blockedPathAssessment(
          visibleBreakCost,
          creditBudget.credits,
          iceIndex,
          effectiveIce.definitionId,
          effectiveIce.subtypes,
          visibleBreakCost,
          firstKnownIceBreakable,
          assessedKnownIceCount,
          "ice_unbreakable",
        );
      }
      const payment = projectBreakerCreditPayment(
        creditBudget,
        breakAssessment,
      );
      if (!payment.affordable) {
        return blockedPathAssessment(
          visibleBreakCost + breakAssessment.cost,
          payment.creditsAfterPath,
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
      spendBreakerCreditsAndApplySideEffects(creditBudget, breakAssessment);
      creditsAfterAvoidingVisibleIceHazards = creditBudget.credits;
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
      const payment = bestAccessPreservingPayment(
        creditBudget,
        payCost,
        breakAssessment,
      );
      if (!payment.affordable) {
        return blockedPathAssessment(
          visibleBreakCost + payment.cost,
          payment.creditsAfterPath,
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
      visibleBreakCost += payment.cost;
      if (payment.breakAssessment) {
        spendBreakerCreditsAndApplySideEffects(
          creditBudget,
          payment.breakAssessment,
        );
      } else {
        spendGeneralCredits(creditBudget, payment.cost);
      }
      creditsAfterAvoidingVisibleIceHazards = creditBudget.credits;
      firstKnownIceBreakable = true;
      if (payment.breakAssessment?.carriesStrengthAcrossIce) {
        breakerStrengths.set(
          payment.breakAssessment.breakerInstanceId,
          payment.breakAssessment.endingStrength,
        );
      }
    }
    const visibleHazardProjections = visibleIceRunHazardsForQuote({
      quote,
      ice: effectiveIce,
      iceIndex,
      rigCards,
      availableCredits: Math.max(0, creditsAfterAvoidingVisibleIceHazards),
      visibleCorpBidCapacity,
      breakerStrengths,
      additionalBreakCostPerSubroutine,
    });
    const avoidedVisibleHazardSubroutineIds = new Set<string>();
    for (const { hazard, avoidancePayment } of visibleHazardProjections) {
      visibleIceRunHazards.push(hazard);
      if (avoidancePayment) {
        avoidedVisibleHazardSubroutineIds.add(hazard.subroutineId);
      }
      if (avoidancePayment?.kind === "breaker") {
        visibleBreakCost += avoidancePayment.assessment.cost;
        spendBreakerCreditsAndApplySideEffects(
          creditBudget,
          avoidancePayment.assessment,
        );
        if (avoidancePayment.assessment.carriesStrengthAcrossIce) {
          breakerStrengths.set(
            avoidancePayment.assessment.breakerInstanceId,
            avoidancePayment.assessment.endingStrength,
          );
        }
      } else if (avoidancePayment?.kind === "general") {
        visibleBreakCost += avoidancePayment.cost;
        spendGeneralCredits(creditBudget, avoidancePayment.cost);
      }
      creditsAfterAvoidingVisibleIceHazards = creditBudget.credits;
    }
    const futureIce = iceCards.slice(0, Math.max(0, iceIndex));
    const runPathEffects = pathProjectionEffectsForQuote(quote).filter(
      ({ effect, sourceSubroutine }) =>
        !avoidedVisibleHazardSubroutineIds.has(sourceSubroutine.id) &&
        !runPathEffectAlreadyVisibleOnFutureIce(effect, futureIce),
    );
    for (const [
      effectIndex,
      { effect, sourceSubroutine },
    ] of runPathEffects.entries()) {
      const unavoidableTraceRunLock = unbrokenEffectIsUnavoidableTraceRunLock(
        effect,
        sourceSubroutine,
        creditBudget.credits,
      );
      const hardEffectKinds = hardUnbrokenRunEffectKinds(
        effect,
        futureIce.length,
        unavoidableTraceRunLock === undefined
          ? {}
          : { unavoidableTraceRunLock },
      );
      const laterEffectPreventsFutureBreaking = runPathEffects
        .slice(effectIndex + 1)
        .some((entry) => entry.effect.preventsFutureBreaking === true);
      const prioritizeLaterAccessPreservation =
        laterEffectPreventsFutureBreaking &&
        hardEffectKinds.length === 1 &&
        hardEffectKinds[0] === "damage_or_program_trash";
      if (hardEffectKinds.length > 0 && !prioritizeLaterAccessPreservation) {
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
        const payment = breakAssessment
          ? projectBreakerCreditPayment(creditBudget, breakAssessment)
          : undefined;
        if (breakAssessment && payment?.affordable) {
          visibleBreakCost += breakAssessment.cost;
          spendBreakerCreditsAndApplySideEffects(creditBudget, breakAssessment);
          creditsAfterAvoidingVisibleIceHazards = creditBudget.credits;
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
            payment && !payment.affordable
              ? payment.creditsAfterPath
              : creditBudget.credits,
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
      const breakAssessment = options.allowBreakingRunPathEffects
        ? runPathEffectBreakAssessment({
            iceCards,
            iceIndex,
            ice: effectiveIce,
            quote,
            effect,
            activeRunPathEffects,
            rigCards,
            rootCards,
            creditBudget,
            visibleCorpBidCapacity,
            deflectorContext,
            breakerStrengths,
            additionalBreakCostPerSubroutine,
          })
        : undefined;
      if (breakAssessment) {
        visibleBreakCost += breakAssessment.cost;
        spendBreakerCreditsAndApplySideEffects(creditBudget, breakAssessment);
        creditsAfterAvoidingVisibleIceHazards = creditBudget.credits;
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
    creditsAfterPath: creditBudget.credits,
    canBreakNextIceButNotFullPath: false,
    hasBypassOrSpecialAccessPlan: false,
    reachableAccessReason: "known_path_reachable",
    creditsSpentBeforeUnpayableIce: 0,
    assessedKnownIceCount,
  };
}

export function visibleDeflectorSubroutineCanResolve(
  subroutine: VisibleEffectiveSubroutine,
  context: VisibleDeflectorContext = {},
): boolean {
  if (subroutine.type !== "deflect_run") return false;
  const cost = Math.max(0, Math.floor(subroutine.deflectorCost ?? 0));
  if (
    context.visibleCorpCredits !== undefined &&
    context.visibleCorpCredits < cost
  )
    return false;
  if (subroutine.deflectorTarget === "subsidiary_data_fort") {
    return (
      context.visibleRemoteServerCount === undefined ||
      context.visibleRemoteServerCount > 0
    );
  }
  return true;
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
  creditBudget: MutableRunnerRunPathCreditBudget;
  visibleCorpBidCapacity: number;
  deflectorContext: VisibleDeflectorContext;
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
  if (!breakAssessment) return undefined;
  const payment = projectBreakerCreditPayment(
    params.creditBudget,
    breakAssessment,
  );
  if (!payment.affordable) return undefined;

  const futureWithoutEffect = assessKnownRezzedIcePathInternal(
    futureIce,
    params.rigCards,
    cloneRunnerRunPathCreditBudget(params.creditBudget),
    params.rootCards,
    params.visibleCorpBidCapacity,
    params.activeRunPathEffects,
    { allowBreakingRunPathEffects: false },
    new Map(params.breakerStrengths),
    params.deflectorContext,
  );
  const futureWithEffect = assessKnownRezzedIcePathInternal(
    futureIce,
    params.rigCards,
    cloneRunnerRunPathCreditBudget(params.creditBudget),
    params.rootCards,
    params.visibleCorpBidCapacity,
    [...params.activeRunPathEffects, params.effect],
    { allowBreakingRunPathEffects: false },
    new Map(params.breakerStrengths),
    params.deflectorContext,
  );
  const breakerStrengthsAfterBreak = new Map(params.breakerStrengths);
  if (breakAssessment.carriesStrengthAcrossIce) {
    breakerStrengthsAfterBreak.set(
      breakAssessment.breakerInstanceId,
      breakAssessment.endingStrength,
    );
  }
  const budgetAfterBreak = cloneRunnerRunPathCreditBudget(params.creditBudget);
  spendBreakerCreditsAndApplySideEffects(budgetAfterBreak, breakAssessment);
  const futureAfterBreak = assessKnownRezzedIcePathInternal(
    futureIce,
    params.rigCards,
    budgetAfterBreak,
    params.rootCards,
    params.visibleCorpBidCapacity,
    params.activeRunPathEffects,
    { allowBreakingRunPathEffects: false },
    breakerStrengthsAfterBreak,
    params.deflectorContext,
  );
  if (
    !futureAfterBreak.canReachAccess &&
    !runnerKnownPathAssessmentIsCostNoAccess(futureAfterBreak)
  ) {
    return undefined;
  }
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
