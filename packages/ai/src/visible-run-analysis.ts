import { CARD_DEFINITIONS_BY_ID } from "./card-definition-compatibility";
import {
  type CardDefinition,
  type CardDefinitionId,
  type CounterCreditUse,
  type PublicGameEvent,
  type TraceSuccessEffect,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
  type VisibleRunnerTraceSupportQuote,
} from "@netgrid/shared";
import {
  cardImplementationForDefinitionId,
  icebreakerAbilitiesForDefinition,
} from "@netgrid/engine";
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
  VisibleRunBreakerState,
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
  hardUnbrokenEffectBlockedPathAssessment,
  minimumCreditsToBreakEndTheRunSubroutines,
  minimumCreditsToBreakVisibleSubroutines,
  projectIceForRunPathEffects,
  requireEffectiveRunQuoteForKnownRezzedIce,
  runPathEffectsPreventFutureBreaking,
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
import {
  isVisibleHardEndRunSubroutine,
  isVisiblePayEndRunSubroutine,
  isVisibleRunnerCreditLossSubroutine,
  isVisibleSecretSpendEndRunSubroutine,
  secretSpendAccessPaymentForVisibleCorpCredits,
} from "./run-analysis/visible-subroutine-semantics";

export {
  runnerRunPathCreditBudgetWithVisiblePools,
  visibleRunnerRunPathCreditBudgetForRig,
} from "./run-analysis/visible-run-credit-budget";
export {
  breakerCarriesStrengthAcrossIce,
  canBreakerDefinitionBreakIce,
  canVisibleBreakerBreakQuotedSubroutines,
  cardDefinitionStrength,
  creditsToBreakEndTheRunSubroutinesWithBreaker,
  creditsToBreakVisibleSubroutinesWithBreaker,
  endTheRunSubroutineCount,
  iceHasEndTheRun,
  minimumCreditsToBreakEndTheRunSubroutines,
  requireEffectiveRunQuoteForKnownRezzedIce,
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
  const normalizedCorpBidCapacity = normalizeVisibleCorpBidCapacity(
    visibleCorpBidCapacity,
  );
  const context = {
    ...deflectorContext,
    visibleCorpCredits:
      deflectorContext.visibleCorpCredits ?? normalizedCorpBidCapacity,
  };
  const availablePreRunCredits =
    typeof runnerCredits === "number" ? runnerCredits : runnerCredits.credits;
  const candidates = selectableSubtypeRigVariants(
    rigCards,
    context,
    availablePreRunCredits,
  ).flatMap((variant) =>
    (["retained", "trashed"] as const).map((bartmossOutcome) => ({
      bartmossOutcome,
      assessment: assessKnownRezzedIcePathInternal(
        iceCards,
        variant.rigCards,
        runnerCredits,
        rootCards,
        normalizedCorpBidCapacity,
        [],
        {
          allowBreakingRunPathEffects: true,
          bartmossOutcome,
          ...(variant.preRunPreparation
            ? { preRunPreparation: variant.preRunPreparation }
            : {}),
        },
        undefined,
        context,
      ),
    })),
  );
  const best = candidates
    .slice()
    .sort((left, right) =>
      compareKnownPathAssessments(left.assessment, right.assessment),
    )[0]!.assessment;
  const bartmossBranches = candidates.filter(({ assessment }) =>
    assessment.conditionalRiskReasons?.includes(
      "visible_breaker_may_trash_after_pass",
    ),
  );
  if (bartmossBranches.length === 0) return best;
  return {
    ...best,
    postEncounterBreakerBranches: (["retained", "trashed"] as const).map(
      (outcome) => {
        const branch = bartmossBranches.find(
          (candidate) => candidate.bartmossOutcome === outcome,
        )?.assessment;
        return {
          outcome:
            outcome === "retained" ? "breaker_retained" : "breaker_trashed",
          blocked: branch?.blocked ?? true,
          canReachAccess: branch?.canReachAccess ?? false,
        };
      },
    ),
  };
}

export function assessEngineCertifiedPostRezIcePath(
  iceCards: VisibleCard[],
  targetServerId: string,
  observedAtStateVersion: number,
  financedPostRezIceInstanceIds: ReadonlySet<string>,
  rigCards: VisibleCard[],
  runnerCredits: RunnerRunPathCreditBudgetInput,
  rootCards: RootCardLike[] = [],
  visibleCorpBidCapacity = 0,
  deflectorContext: VisibleDeflectorContext = {},
): KnownRezzedIcePathAssessment {
  const authoritativePath = iceCards.map((ice): IceCardLike => {
    if (ice.rezzed === true) return ice;
    if (!financedPostRezIceInstanceIds.has(ice.instanceId)) return ice;
    const quote = ice.effectivePostRezRunQuote;
    if (
      quote?.context !== "installed_post_rez" ||
      quote.complete !== true ||
      quote.cardId !== ice.instanceId ||
      quote.iceDefinitionId !== ice.definitionId ||
      quote.targetServerId !== targetServerId ||
      quote.projectedServerId !== targetServerId ||
      quote.expiresAtStateVersion !== observedAtStateVersion ||
      quote.effectiveRunQuote.iceInstanceId !== ice.instanceId ||
      quote.effectiveRunQuote.iceDefinitionId !== ice.definitionId
    ) {
      return ice;
    }
    return {
      ...ice,
      effectiveRunQuote: quote.effectiveRunQuote,
      authoritativePostRezRunProjection: true,
    };
  });
  return assessKnownRezzedIcePath(
    authoritativePath,
    rigCards,
    runnerCredits,
    rootCards,
    visibleCorpBidCapacity,
    deflectorContext,
  );
}

function selectableSubtypeRigVariants(
  rigCards: VisibleCard[],
  context: VisibleDeflectorContext,
  availablePreRunCredits: number,
): Array<{
  rigCards: VisibleCard[];
  preRunPreparation?: NonNullable<
    KnownRezzedIcePathAssessment["preRunPreparation"]
  >;
}> {
  return rigCards.reduce<
    Array<{
      rigCards: VisibleCard[];
      preRunPreparation?: NonNullable<
        KnownRezzedIcePathAssessment["preRunPreparation"]
      >;
    }>
  >(
    (variants, card) => {
      if (!card.definitionId)
        return variants.map((variant) => ({
          ...variant,
          rigCards: [...variant.rigCards, card],
        }));
      if (card.selectedSubtype) {
        const change = cardImplementationForDefinitionId(
          card.definitionId,
        )?.icebreakerSubtypeChange;
        const canPrepareChange =
          change?.timing === "runner_main" &&
          (context.availableRunnerClicks ?? 0) >= change.cost.clicks;
        if (!canPrepareChange) {
          return variants.map((variant) => ({
            ...variant,
            rigCards: [...variant.rigCards, card],
          }));
        }
        return variants.flatMap((variant) => [
          {
            ...variant,
            rigCards: [...variant.rigCards, card],
          },
          ...(availablePreRunCredits >=
            (variant.preRunPreparation?.credits ?? 0) + change.cost.credits &&
          (context.availableRunnerClicks ?? 0) >=
            (variant.preRunPreparation?.clicks ?? 0) + change.cost.clicks
            ? change.choices
                .filter(
                  (selectedSubtype) => selectedSubtype !== card.selectedSubtype,
                )
                .map((selectedSubtype) => ({
                  rigCards: [...variant.rigCards, { ...card, selectedSubtype }],
                  preRunPreparation: {
                    credits:
                      (variant.preRunPreparation?.credits ?? 0) +
                      change.cost.credits,
                    clicks:
                      (variant.preRunPreparation?.clicks ?? 0) +
                      change.cost.clicks,
                    subtypeChanges: [
                      ...(variant.preRunPreparation?.subtypeChanges ?? []),
                      {
                        sourceCardInstanceId: card.instanceId,
                        sourceDefinitionId: card.definitionId!,
                        selectedSubtype,
                      },
                    ],
                  },
                }))
            : []),
        ]);
      }
      const choices = cardImplementationForDefinitionId(
        card.definitionId,
      )?.icebreakerSubtypeChange;
      if (
        choices?.timing !== "during_run" ||
        choices.limit !== "once_until_selected"
      )
        return variants.map((variant) => ({
          ...variant,
          rigCards: [...variant.rigCards, card],
        }));
      return variants.flatMap((variant) =>
        choices.choices.map((selectedSubtype) => ({
          ...variant,
          rigCards: [...variant.rigCards, { ...card, selectedSubtype }],
        })),
      );
    },
    [{ rigCards: [] }],
  );
}

function compareKnownPathAssessments(
  left: KnownRezzedIcePathAssessment,
  right: KnownRezzedIcePathAssessment,
): number {
  return (
    Number(right.canReachAccess) - Number(left.canReachAccess) ||
    (left.visibleBreakCost ?? 0) - (right.visibleBreakCost ?? 0) ||
    right.creditsAfterPath - left.creditsAfterPath
  );
}

function assessKnownRezzedIcePathInternal(
  iceCards: IceCardLike[],
  rigCards: VisibleCard[],
  runnerCredits: RunnerRunPathCreditBudgetInput,
  rootCards: RootCardLike[],
  visibleCorpBidCapacity: number,
  initialRunPathEffects: RunPathProjectionEffect[],
  options: {
    allowBreakingRunPathEffects: boolean;
    bartmossOutcome?: "retained" | "trashed";
    preRunPreparation?: KnownRezzedIcePathAssessment["preRunPreparation"];
  },
  initialBreakerStrengths?: Map<string, number>,
  deflectorContext: VisibleDeflectorContext = {},
): KnownRezzedIcePathAssessment {
  const creditBudget = normalizeRunnerRunPathCreditBudget(runnerCredits);
  const preRunPreparation = options.preRunPreparation;
  if (preRunPreparation && creditBudget.credits < preRunPreparation.credits) {
    return blockedPathAssessment(
      preRunPreparation.credits,
      creditBudget.credits - preRunPreparation.credits,
      0,
      undefined,
      undefined,
      0,
      false,
      0,
      "ice_unaffordable",
    );
  }
  if (preRunPreparation) creditBudget.credits -= preRunPreparation.credits;
  let visibleBreakCost = preRunPreparation?.credits ?? 0;
  let futureClicksLost = 0;
  let creditsAfterAvoidingVisibleIceHazards = creditBudget.credits;
  const visibleIceRunHazards: VisibleIceRunHazard[] = [];
  let assessedKnownIceCount = 0;
  let firstKnownIceBreakable = false;
  let activeRunPathEffects = initialRunPathEffects.slice();
  const conditionalAccessReasons = new Set<string>();
  const conditionalRiskReasons = new Set<string>();
  let visibleCorpCreditsThroughPath = visibleCorpBidCapacity;
  let netOrCoreDamagePreventionRemaining =
    deflectorContext.netOrCoreDamagePreventionRemaining ?? 0;
  let runDamagePreventionRemaining =
    deflectorContext.runDamagePreventionRemaining ?? 0;
  let runnerTraceSupportQuote = deflectorContext.runnerTraceSupportQuote
    ? cloneVisibleRunnerTraceSupportQuote(
        deflectorContext.runnerTraceSupportQuote,
      )
    : undefined;
  const breakersAtRiskOfBeingTrashed = new Set<string>();
  const breakerState: VisibleRunBreakerState = {
    strengthByBreakerInstanceId: new Map(
      rigCards.map((card) => [
        card.instanceId,
        visibleBreakerStrengthForTargetServer(
          card,
          deflectorContext.targetServerId,
        ),
      ]),
    ),
    pendingFreeBreaks: [],
  };
  const breakerStrengths = breakerState.strengthByBreakerInstanceId;
  if (initialBreakerStrengths) {
    for (const [instanceId, strength] of initialBreakerStrengths) {
      breakerStrengths.set(instanceId, strength);
    }
  }
  for (const { ice, iceIndex } of iceCards
    .map((ice, iceIndex) => ({ ice, iceIndex }))
    .reverse()) {
    const iceDefinitionId = ice.definitionId;
    if (
      !iceDefinitionId ||
      !ice.known ||
      (ice.rezzed !== true && ice.authoritativePostRezRunProjection !== true)
    )
      continue;
    const rigCardsForEncounter = rigCards.filter(
      (card) =>
        !breakersAtRiskOfBeingTrashed.has(card.instanceId) &&
        !(
          deflectorContext.prohibitNoisyIcebreakers === true &&
          card.subtypes?.includes("noisy")
        ),
    );
    requireEffectiveRunQuoteForKnownRezzedIce(ice);
    const effectiveIce = projectIceForRunPathEffects(
      ice,
      activeRunPathEffects,
      iceIndex,
    );
    if (!effectiveIce.subtypes?.includes("sentry")) {
      breakerState.pendingFreeBreaks = [];
    }
    const pathCostBeforeIce = visibleBreakCost;
    assessedKnownIceCount += 1;
    const quote = requireEffectiveRunQuoteForKnownRezzedIce(effectiveIce);
    if (!quote) continue;
    for (const effect of quote.conditionalEncounterEffects ?? []) {
      if (
        effect.kind === "corp_paid_add_end_the_run_subroutine" &&
        visibleCorpCreditsThroughPath >= effect.creditCost
      ) {
        conditionalAccessReasons.add("visible_corp_paid_encounter_etr");
      }
      if (effect.kind === "random_strength_or_derez_auto_pass") {
        conditionalAccessReasons.add("visible_random_encounter_strength");
      }
    }
    for (const subroutine of quote.subroutines) {
      if (subroutine.type === "random_damage") {
        conditionalRiskReasons.add("visible_random_damage");
      }
      if (subroutine.type === "rewind_run_to_rezzed_ice_by_die") {
        conditionalAccessReasons.add("visible_random_rewind");
      }
    }
    const endTheRunCount = quote.subroutines.filter(
      isVisibleHardEndRunSubroutine,
    ).length;
    const deflectorCount =
      quote.subroutines.filter((subroutine) =>
        visibleDeflectorSubroutineCanResolve(subroutine, deflectorContext),
      ).length ?? 0;
    const accessPreservingBreakCount = endTheRunCount + deflectorCount;
    const additionalBreakCostPerSubroutine =
      quote.breakSubroutineAdditionalCostPerSubroutine ?? 0;
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
    for (const subroutine of quote.subroutines) {
      if (!isVisibleRunnerCreditLossSubroutine(subroutine)) continue;
      const lossAmount = Math.min(
        creditBudget.credits,
        Math.max(0, Math.floor(subroutine.amount ?? 0)),
      );
      if (lossAmount <= 0) continue;
      const breakAssessment = minimumCreditsToBreakVisibleSubroutines(
        effectiveIceForQuote(effectiveIce, quote),
        rigCardsForEncounter,
        [subroutine],
        breakerStrengths,
        additionalBreakCostPerSubroutine,
      );
      const breakPayment = breakAssessment
        ? projectBreakerCreditPayment(creditBudget, breakAssessment)
        : undefined;
      if (
        breakAssessment &&
        breakPayment?.affordable &&
        breakAssessment.cost < lossAmount
      ) {
        visibleBreakCost += breakAssessment.cost;
        futureClicksLost += breakAssessment.futureClicksLost ?? 0;
        spendBreakerCreditsAndApplySideEffects(creditBudget, breakAssessment);
        firstKnownIceBreakable = true;
        if (breakAssessment.carriesStrengthAcrossIce) {
          breakerStrengths.set(
            breakAssessment.breakerInstanceId,
            breakAssessment.endingStrength,
          );
        }
      } else {
        visibleBreakCost += lossAmount;
        spendGeneralCredits(creditBudget, lossAmount);
      }
      creditsAfterAvoidingVisibleIceHazards = creditBudget.credits;
    }
    if (accessPreservingBreakCount > 0) {
      const breakAssessment = runPathEffectsPreventFutureBreaking(
        activeRunPathEffects,
      )
        ? undefined
        : minimumCreditsToBreakEndTheRunSubroutines(
            effectiveIceForQuote(effectiveIce, quote),
            rigCardsForEncounter,
            accessPreservingBreakCount,
            breakerStrengths,
            additionalBreakCostPerSubroutine,
            breakerState.pendingFreeBreaks,
            quote?.subroutines.filter(
              (subroutine) =>
                isVisibleHardEndRunSubroutine(subroutine) ||
                visibleDeflectorSubroutineCanResolve(
                  subroutine,
                  deflectorContext,
                ),
            ),
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
      if (breakAssessment.conditionalAccessReason)
        conditionalAccessReasons.add(breakAssessment.conditionalAccessReason);
      if (breakAssessment.conditionalRiskReason)
        conditionalRiskReasons.add(breakAssessment.conditionalRiskReason);
      futureClicksLost += breakAssessment.futureClicksLost ?? 0;
      spendBreakerCreditsAndApplySideEffects(creditBudget, breakAssessment);
      advanceVisibleRunBreakerState(
        breakerState,
        breakAssessment,
        (quote?.subroutines.length ?? 0) === accessPreservingBreakCount,
      );
      if (
        breakAssessment.conditionalRiskReason &&
        options.bartmossOutcome !== "retained"
      ) {
        breakersAtRiskOfBeingTrashed.add(breakAssessment.breakerInstanceId);
      }
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
      quote?.subroutines.filter(isVisiblePayEndRunSubroutine) ?? [];
    for (const subroutine of payOrEndSubroutines) {
      const payCost = Math.max(0, Math.floor(subroutine.amount ?? 0));
      const breakAssessment = runPathEffectsPreventFutureBreaking(
        activeRunPathEffects,
      )
        ? undefined
        : minimumCreditsToBreakEndTheRunSubroutines(
            effectiveIceForQuote(effectiveIce, quote),
            rigCardsForEncounter,
            1,
            breakerStrengths,
            additionalBreakCostPerSubroutine,
            breakerState.pendingFreeBreaks,
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
        futureClicksLost += payment.breakAssessment.futureClicksLost ?? 0;
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
    const secretSpendEndRunSubroutines =
      quote?.subroutines.filter(isVisibleSecretSpendEndRunSubroutine) ?? [];
    for (const subroutine of secretSpendEndRunSubroutines) {
      const payCost = secretSpendAccessPaymentForVisibleCorpCredits(
        visibleCorpCreditsThroughPath,
      );
      const breakAssessment = runPathEffectsPreventFutureBreaking(
        activeRunPathEffects,
      )
        ? undefined
        : minimumCreditsToBreakVisibleSubroutines(
            effectiveIceForQuote(effectiveIce, quote),
            rigCardsForEncounter,
            [subroutine],
            breakerStrengths,
            additionalBreakCostPerSubroutine,
            breakerState.pendingFreeBreaks,
          );
      if (payCost === undefined) {
        const breakPayment = breakAssessment
          ? projectBreakerCreditPayment(creditBudget, breakAssessment)
          : undefined;
        if (breakAssessment && breakPayment?.affordable) {
          visibleBreakCost += breakAssessment.cost;
          futureClicksLost += breakAssessment.futureClicksLost ?? 0;
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
        conditionalAccessReasons.add("visible_secret_spend_end_run");
        continue;
      }
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
        futureClicksLost += payment.breakAssessment.futureClicksLost ?? 0;
        spendBreakerCreditsAndApplySideEffects(
          creditBudget,
          payment.breakAssessment,
        );
        if (payment.breakAssessment.carriesStrengthAcrossIce) {
          breakerStrengths.set(
            payment.breakAssessment.breakerInstanceId,
            payment.breakAssessment.endingStrength,
          );
        }
      } else {
        spendGeneralCredits(creditBudget, payment.cost);
      }
      creditsAfterAvoidingVisibleIceHazards = creditBudget.credits;
      firstKnownIceBreakable = true;
    }
    const visibleHazardProjections = visibleIceRunHazardsForQuote({
      quote,
      ice: effectiveIce,
      iceIndex,
      rigCards,
      availableCredits: Math.max(0, creditsAfterAvoidingVisibleIceHazards),
      visibleCorpBidCapacity: visibleCorpCreditsThroughPath,
      breakerStrengths,
      additionalBreakCostPerSubroutine,
      ...(runnerTraceSupportQuote ? { runnerTraceSupportQuote } : {}),
      ...(deflectorContext.runTraceLinkBonus !== undefined
        ? { runTraceLinkBonus: deflectorContext.runTraceLinkBonus }
        : {}),
      ...(deflectorContext.excludeStealthTraceCredits
        ? { excludeStealthTraceCredits: true }
        : {}),
    });
    const avoidedVisibleHazardSubroutineIds = new Set<string>();
    for (const projection of visibleHazardProjections) {
      const { avoidancePayment } = projection;
      const hazard = applyVisibleDamagePrevention(
        projection.hazard,
        netOrCoreDamagePreventionRemaining,
        runDamagePreventionRemaining,
      );
      netOrCoreDamagePreventionRemaining -=
        hazard.freeDamagePreventionApplied ?? 0;
      runDamagePreventionRemaining -= hazard.runDamagePreventionApplied ?? 0;
      visibleIceRunHazards.push(hazard);
      if (avoidancePayment) {
        avoidedVisibleHazardSubroutineIds.add(hazard.subroutineId);
      }
      if (avoidancePayment?.kind === "breaker") {
        visibleBreakCost += avoidancePayment.assessment.cost;
        futureClicksLost += avoidancePayment.assessment.futureClicksLost ?? 0;
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
      if (projection.traceCreditPoolSpent && runnerTraceSupportQuote) {
        runnerTraceSupportQuote = spendVisibleTraceCreditPool(
          runnerTraceSupportQuote,
          projection.traceCreditPoolSpent,
          deflectorContext.excludeStealthTraceCredits === true,
        );
      }
      if (
        projection.traceSupportSourceIdsConsumed?.length &&
        runnerTraceSupportQuote
      ) {
        runnerTraceSupportQuote = consumeVisibleTraceSupportSources(
          runnerTraceSupportQuote,
          projection.traceSupportSourceIdsConsumed,
        );
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
      const matchingTraceHazard = visibleHazardProjections.find(
        ({ hazard }) => hazard.subroutineId === sourceSubroutine.id,
      )?.hazard;
      const unavoidableTraceRunLock = matchingTraceHazard?.preventsAccess
        ? matchingTraceHazard.unavoidable
        : unbrokenEffectIsUnavoidableTraceRunLock(
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
                rigCardsForEncounter,
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
          futureClicksLost += breakAssessment.futureClicksLost ?? 0;
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
        const blockedAssessment = hardUnbrokenEffectBlockedPathAssessment({
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
        return {
          ...blockedAssessment,
          ...visibleIceRunHazardSummary(
            visibleIceRunHazards,
            creditsAfterAvoidingVisibleIceHazards,
          ),
        };
      }
      const breakAssessment = options.allowBreakingRunPathEffects
        ? runPathEffectBreakAssessment({
            iceCards,
            iceIndex,
            ice: effectiveIce,
            quote,
            effect,
            sourceSubroutine,
            activeRunPathEffects,
            rigCards,
            rootCards,
            creditBudget,
            visibleCorpBidCapacity: visibleCorpCreditsThroughPath,
            deflectorContext,
            breakerStrengths,
            additionalBreakCostPerSubroutine,
          })
        : undefined;
      if (breakAssessment) {
        visibleBreakCost += breakAssessment.cost;
        futureClicksLost += breakAssessment.futureClicksLost ?? 0;
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
    visibleCorpCreditsThroughPath += (quote?.subroutines ?? [])
      .filter((subroutine) => subroutine.type === "corp_gain_credit")
      .reduce(
        (sum, subroutine) =>
          sum + Math.max(0, Math.floor(subroutine.amount ?? 0)),
        0,
      );
  }
  return {
    blocked: false,
    ...(visibleBreakCost > 0 ? { visibleBreakCost } : {}),
    ...(futureClicksLost > 0 ? { futureClicksLost } : {}),
    ...(preRunPreparation ? { preRunPreparation } : {}),
    ...(conditionalAccessReasons.size > 0
      ? { conditionalAccessReasons: [...conditionalAccessReasons].sort() }
      : {}),
    ...(conditionalRiskReasons.size > 0
      ? { conditionalRiskReasons: [...conditionalRiskReasons].sort() }
      : {}),
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

function cloneVisibleRunnerTraceSupportQuote(
  quote: VisibleRunnerTraceSupportQuote,
): VisibleRunnerTraceSupportQuote {
  return {
    traceCreditPool: quote.traceCreditPool,
    traceCreditSources: quote.traceCreditSources.map((source) => ({
      ...source,
    })),
    baseLinkOptions: quote.baseLinkOptions.map((option) => ({ ...option })),
    postBidLinkOptions: quote.postBidLinkOptions.map((option) => ({
      ...option,
    })),
    traceSuccessCancelOptions: quote.traceSuccessCancelOptions.map(
      (option) => ({
        ...option,
      }),
    ),
  };
}

function spendVisibleTraceCreditPool(
  quote: VisibleRunnerTraceSupportQuote,
  amount: number,
  excludeStealthCredits: boolean,
): VisibleRunnerTraceSupportQuote {
  let remaining = Math.max(0, Math.floor(amount));
  const traceCreditSources = quote.traceCreditSources.map((source) => {
    if (remaining <= 0 || (excludeStealthCredits && source.isStealth)) {
      return source;
    }
    const spent = Math.min(Math.max(0, Math.floor(source.amount)), remaining);
    remaining -= spent;
    return { ...source, amount: source.amount - spent };
  });
  if (remaining > 0) {
    throw new Error("Trace-Credit-Payment uebersteigt die sichtbaren Quellen.");
  }
  return {
    ...quote,
    traceCreditPool: Math.max(0, quote.traceCreditPool - amount),
    traceCreditSources,
  };
}

function consumeVisibleTraceSupportSources(
  quote: VisibleRunnerTraceSupportQuote,
  sourceIds: string[],
): VisibleRunnerTraceSupportQuote {
  const consumed = new Set(sourceIds);
  return {
    ...quote,
    postBidLinkOptions: quote.postBidLinkOptions.filter(
      (option) => !consumed.has(option.sourceCardInstanceId),
    ),
    traceSuccessCancelOptions: quote.traceSuccessCancelOptions.filter(
      (option) => !consumed.has(option.sourceCardInstanceId),
    ),
  };
}

function visibleBreakerStrengthForTargetServer(
  card: VisibleCard,
  targetServerId: string | undefined,
): number {
  const strength = card.strength ?? 0;
  if (
    !targetServerId ||
    !card.selectedServerId ||
    card.selectedServerId === targetServerId ||
    !card.definitionId
  )
    return strength;
  const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
  if (!definition) return strength;
  const hasLastServerBoundCounters = icebreakerAbilitiesForDefinition(
    definition,
  ).some((ability) =>
    ability.onSuccessfulBreakEffects?.some(
      (effect) => effect.kind === "mark_run_end_source_counter_award",
    ),
  );
  if (!hasLastServerBoundCounters) return strength;
  return Math.max(0, strength - Math.max(0, card.counters?.power ?? 0));
}

function applyVisibleDamagePrevention(
  hazard: VisibleIceRunHazard,
  remainingNetOrCorePrevention: number,
  remainingRunPrevention: number,
): VisibleIceRunHazard {
  if (!hazard.expectedDamage || hazard.effectType !== "net_damage")
    return hazard;
  const freeApplied = Math.min(
    Math.max(0, Math.floor(remainingNetOrCorePrevention)),
    hazard.expectedDamage,
  );
  const runApplied = Math.min(
    Math.max(0, Math.floor(remainingRunPrevention)),
    hazard.expectedDamage - freeApplied,
  );
  const applied = freeApplied + runApplied;
  if (applied <= 0) return hazard;
  return {
    ...hazard,
    expectedDamage: hazard.expectedDamage - applied,
    damagePreventionApplied: applied,
    ...(freeApplied > 0 ? { freeDamagePreventionApplied: freeApplied } : {}),
    ...(runApplied > 0 ? { runDamagePreventionApplied: runApplied } : {}),
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

function advanceVisibleRunBreakerState(
  state: VisibleRunBreakerState,
  assessment: BreakAssessment,
  fullyBrokeEncounteredIce: boolean,
): void {
  if (assessment.consumedPendingFreeBreak) {
    const sourceBreakerInstanceId =
      assessment.consumedPendingFreeBreakSourceBreakerInstanceId;
    if (!sourceBreakerInstanceId) {
      throw new Error("Verbrauchter Free-Break hat keine Quellbreaker-ID.");
    }
    const pendingIndex = state.pendingFreeBreaks.findIndex(
      (entry) => entry.sourceBreakerInstanceId === sourceBreakerInstanceId,
    );
    if (pendingIndex < 0) {
      throw new Error(
        "Verbrauchter Free-Break ist im Run-State nicht vorhanden.",
      );
    }
    state.pendingFreeBreaks.splice(pendingIndex, 1);
  }
  if (!fullyBrokeEncounteredIce) return;
  for (const change of assessment.stateChangesAfterUse ?? []) {
    if (change.kind !== "set_pending_free_break") continue;
    state.pendingFreeBreaks = [
      ...state.pendingFreeBreaks.filter(
        (entry) =>
          entry.sourceBreakerInstanceId !== assessment.breakerInstanceId,
      ),
      {
        sourceBreakerInstanceId: assessment.breakerInstanceId,
        iceSubtype: change.iceSubtype,
        remainingUses: change.remainingUses,
        mustBeNextEncounteredIce: change.mustBeNextEncounteredIce,
      },
    ];
  }
}

function runPathEffectBreakAssessment(params: {
  iceCards: IceCardLike[];
  iceIndex: number;
  ice: IceCardLike;
  quote: VisibleEffectiveIceRunQuote | undefined;
  effect: RunPathProjectionEffect;
  sourceSubroutine: VisibleEffectiveSubroutine;
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
    [],
    [params.sourceSubroutine],
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
