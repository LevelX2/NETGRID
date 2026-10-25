import type { PublicHeapBreakerPreparation } from "./corp-public-heap-breaker-preparation";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import {
  type SubroutineDefinition,
  type VisibleCard,
  type VisibleEffectiveIceRunQuote,
  type VisibleEffectiveSubroutine,
} from "@netgrid/shared";
import {
  visibleBreakerEncounterQuote,
  visibleProgramHostInstallVariants,
  visibleFortPassProtection,
} from "@netgrid/engine";
import { AI_HINTS_BY_CARD } from "../catalog-ai-hint-authority";
import { creditsToBreakEndTheRunSubroutinesWithBreaker } from "../visible-run-analysis";
import type {
  BreakAssessment,
  MutableRunnerRunPathCreditBudget,
} from "../run-analysis/visible-run-analysis-contracts";
import {
  cloneRunnerRunPathCreditBudget,
  normalizeRunnerRunPathCreditBudget,
  projectBreakerCreditPayment,
  runnerRunPathCreditBudgetWithVisiblePools,
  spendBreakerCreditsAndApplySideEffects,
} from "../run-analysis/visible-run-credit-budget";

export type ExactProbability = Readonly<{
  numerator: number;
  denominator: number;
}>;

export type ExactProbabilityComparison = -1 | 0 | 1;

/**
 * Compares exact probabilities without floating-point division or unsafe
 * Number cross-products. Undefined means at least one input is invalid.
 */
export function compareExactProbabilities(
  left: ExactProbability,
  right: ExactProbability,
): ExactProbabilityComparison | undefined {
  const normalizedLeft = rationalFromExactProbability(left);
  const normalizedRight = rationalFromExactProbability(right);
  if (!normalizedLeft || !normalizedRight) return undefined;
  return compareRational(normalizedLeft, normalizedRight);
}

export type CorpScoreProtectionRandomBreak = Readonly<{
  iceInstanceId: string;
  iceDefinitionId: string;
  breakerInstanceId: string;
  breakerDefinitionId: string;
  attempts: number;
  successProbabilityPerAttempt: ExactProbability;
  combinedSuccessProbability: ExactProbability;
}>;

type CorpScoreProtectionAssessmentBase = Readonly<{
  maximumRunnerAccessSuccessProbability: ExactProbability;
  protectsScore: boolean;
  evidence: readonly string[];
}>;

export type KnownCorpScoreProtectionAssessment =
  CorpScoreProtectionAssessmentBase &
    Readonly<{
      knowledge: "known";
      runnerAccessSuccessProbability: ExactProbability;
      protectsScore: boolean;
      requiredRandomBreakSuccesses: number;
      randomBreaks: readonly CorpScoreProtectionRandomBreak[];
      runnerCreditsRemainingOnBestAccessPath: number;
    }>;

export type UnknownCorpScoreProtectionAssessment =
  CorpScoreProtectionAssessmentBase &
    Readonly<{
      knowledge: "unknown";
      protectsScore: false;
      unknownReason:
        | "invalid_probability_threshold"
        | "unknown_fort_pass_protection"
        | "invalid_runner_credits"
        | "duplicate_ice_instance"
        | "duplicate_runner_rig_instance"
        | "unknown_rezzed_ice"
        | "unknown_runner_rig_card"
        | "invalid_effective_run_quote"
        | "unsupported_runner_access_effect"
        | "unsupported_public_staged_breaker"
        | "unsupported_breaker_combination"
        | "unsupported_random_break_strategy"
        | "unsupported_access_relevant_ice_effect"
        | "invalid_random_break_probability"
        | "probability_not_safely_representable";
    }>;

export type CorpScoreProtectionAssessment =
  | KnownCorpScoreProtectionAssessment
  | UnknownCorpScoreProtectionAssessment;

/**
 * A concrete PlayerView ICE or a hypothetical definition projection. Static
 * catalog facts may only be used when the caller supplies matching strength
 * and subtypes. Any effective/dynamic ICE state requires an identity-bound
 * effectiveRunQuote.
 */
export type CorpScoreProtectionIceInput = Readonly<{
  instanceId: string;
  known: boolean;
  definitionId?: string;
  rezzed?: boolean;
  strength?: number;
  subtypes?: string[];
  effectiveRunQuote?: VisibleEffectiveIceRunQuote;
}>;

export type CorpScoreProtectionAssessmentInput = Readonly<{
  serverIce: readonly CorpScoreProtectionIceInput[];
  serverRoot?: readonly VisibleCard[];
  runnerRig: readonly VisibleCard[];
  /**
   * Public, engine-derived delayed-install cards. A Corp-side projection may
   * use these only when the corresponding installed delayed-install source,
   * counter cost, memory fit, and Runner credits can all be certified.
   */
  runnerSetAside?: readonly VisibleCard[];
  runnerMemoryUsed?: number;
  runnerMemoryLimit?: number;
  runnerCredits: number;
  runnerCreditPoolHorizon?: "current" | "next_runner_turn";
  /** Independently quoted public recovery routes with absolute remaining cash. */
  runnerPublicPreparedBreakers?: readonly PublicHeapBreakerPreparation[];
  /** Engine-published next-turn basic income after reserving the run action. */
  runnerPreparationCreditClicks?: number;
  maximumRunnerAccessSuccessProbability: ExactProbability;
}>;

/** A sufficient current-resource proof for one quoted subroutine. Optimistic
 * strength, pooled credits and ignored extra costs may prevent certification;
 * they must never turn an affordable or unsupported break into a forced effect.
 */
export function corpVisibleSingleSubroutineIsUnbreakable(params: {
  ice: CorpScoreProtectionIceInput;
  runnerRig: readonly VisibleCard[];
  runnerCredits: number;
}): boolean {
  const { ice, runnerRig, runnerCredits } = params;
  const quote = ice.effectiveRunQuote;
  if (
    !ice.known ||
    !ice.definitionId ||
    !quote ||
    !validEffectiveRunQuote(ice, quote) ||
    quote.subroutines.length !== 1 ||
    (quote.conditionalEncounterEffects?.length ?? 0) > 0 ||
    !nonNegativeSafeInteger(runnerCredits) ||
    runnerRig.some(
      (card) =>
        !validRunnerRigCard(card) ||
        runnerRigCardRequiresUnsupportedAccessProjection(card, [ice]),
    )
  ) {
    return false;
  }
  const budget = runnerRunPathCreditBudgetWithVisiblePools(
    runnerCredits,
    runnerRig,
    { liquidCredits: runnerCredits },
  );
  // All restricted pools and even currently unaffordable support are counted
  // as available. This is an upper bound, not an executable funding promise.
  const available =
    runnerCredits +
    (budget.icebreakerCredits ?? 0) +
    (budget.nonNoisyIcebreakerCredits ?? 0) +
    (budget.killerCredits ?? 0) +
    Object.values(
      budget.hostedIcebreakerCreditsByBreakerInstanceId ?? {},
    ).reduce((sum, credits) => sum + credits, 0) +
    [...new Set(budget.paymentSupportSources?.map((s) => s.cardInstanceId))]
      .map((id) =>
        Math.max(
          0,
          ...budget
            .paymentSupportSources!.filter((s) => s.cardInstanceId === id)
            .map((s) => s.gainCredits - s.creditCost),
        ),
      )
      .reduce((sum, credits) => sum + credits, 0);
  for (const breaker of runnerRig.filter(cardIsIcebreaker)) {
    const definition = CARD_DEFINITIONS_BY_ID[breaker.definitionId!];
    const encounter = visibleBreakerEncounterQuote({
      breakerDefinitionId: breaker.definitionId!,
      breakerInstanceId: breaker.instanceId,
      breakerStrength: Math.max(breaker.strength!, definition!.strength ?? 0),
      ...(breaker.selectedTargetCardId
        ? { selectedTargetCardId: breaker.selectedTargetCardId }
        : {}),
      ...(breaker.selectedSubtype
        ? { selectedSubtype: breaker.selectedSubtype }
        : {}),
      iceDefinitionId: ice.definitionId,
      iceInstanceId: ice.instanceId,
      iceSubtypes: ice.subtypes!,
      subroutines: quote.subroutines,
    });
    if (
      !encounter ||
      encounter.coverageStatus === "requires_selection" ||
      encounter.randomRunStrength ||
      encounter.stateChangesAfterUse.length > 0
    ) {
      return false;
    }
    const breakOptions = encounter.breakOptions.filter((option) =>
      option.breakableSubroutineIndexes.includes(0),
    );
    if (breakOptions.length === 0) continue;
    const breakCost = Math.min(
      ...breakOptions.map((option) => option.creditCost),
    );
    const deficit = Math.max(
      0,
      (quote.encounterStrength ?? quote.effectiveStrength) -
        encounter.effectiveStrength,
    );
    const pumpCost =
      deficit === 0
        ? 0
        : Math.min(
            ...encounter.pumpOptions.map(
              (option) =>
                Math.ceil(deficit / option.strengthGain) * option.creditCost,
            ),
          );
    if (breakCost + pumpCost <= available) return false;
  }
  return true;
}

type Rational = Readonly<{
  numerator: bigint;
  denominator: bigint;
}>;

type RandomBreakChoice = Readonly<{
  iceInstanceId: string;
  iceDefinitionId: string;
  breakerInstanceId: string;
  breakerDefinitionId: string;
  attempts: number;
  successProbabilityPerAttempt: Rational;
  combinedSuccessProbability: Rational;
}>;

type AccessPathState = {
  credits: number;
  creditBudget: MutableRunnerRunPathCreditBudget;
  probability: Rational;
  breakerStrengths: Map<string, number>;
  randomBreaks: RandomBreakChoice[];
  nextEncounterCannotBreak: boolean;
};

type SupportedIce = Readonly<{
  card: CorpScoreProtectionIceInput;
  endTheRunCount: number;
  endTheRunSubroutines: readonly (
    | SubroutineDefinition
    | VisibleEffectiveSubroutine
  )[];
  nextBreakLockSubroutines: readonly (
    | SubroutineDefinition
    | VisibleEffectiveSubroutine
  )[];
  effectiveStrength: number;
  effectiveSubtypes: readonly string[];
  additionalBreakCostPerSubroutine: number;
}>;

type EngineRandomBreakRiskProfile = Readonly<{
  successProbabilityPerAttempt: number;
}>;

type IceReadResult =
  | Readonly<{ knowledge: "known"; ice: SupportedIce }>
  | Readonly<{
      knowledge: "unknown";
      reason:
        | "unknown_rezzed_ice"
        | "invalid_effective_run_quote"
        | "unsupported_access_relevant_ice_effect";
    }>;

const ZERO: Rational = { numerator: 0n, denominator: 1n };
const ONE: Rational = { numerator: 1n, denominator: 1n };
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Assesses whether the currently rezzed (or projected as rezzed) ICE path
 * keeps the Runner's best access-success probability at or below the
 * caller-provided threshold.
 *
 * This deliberately models only direct, visible access prevention. Unknown
 * cards and access-relevant effects outside deterministic ETR breaking fail
 * closed instead of being silently treated as protection.
 */
export function assessCorpScoreProtection(
  input: CorpScoreProtectionAssessmentInput,
): CorpScoreProtectionAssessment {
  if ((input.runnerPublicPreparedBreakers?.length ?? 0) > 0) {
    return assessCorpScoreProtectionWithPublicHeapBreakers(input);
  }
  if (input.runnerPreparationCreditClicks !== undefined) {
    const { runnerPreparationCreditClicks, ...currentRun } = input;
    if (!nonNegativeSafeInteger(runnerPreparationCreditClicks)) {
      return unknownAssessment(
        input.maximumRunnerAccessSuccessProbability,
        "invalid_runner_credits",
        ["invalidRunnerPreparationCreditClicks:true"],
      );
    }
    const prepared = assessCorpScoreProtection({
      ...currentRun,
      runnerCredits: input.runnerCredits + runnerPreparationCreditClicks,
    });
    return {
      ...prepared,
      evidence: [
        ...prepared.evidence,
        `runnerPreparationCreditClicks:${runnerPreparationCreditClicks}`,
      ],
    };
  }
  const threshold = rationalFromExactProbability(
    input.maximumRunnerAccessSuccessProbability,
  );
  if (!threshold) {
    return unknownAssessment(
      input.maximumRunnerAccessSuccessProbability,
      "invalid_probability_threshold",
      ["scoreProtectionKnown:false", "invalidProbabilityThreshold:true"],
    );
  }
  if (!Number.isSafeInteger(input.runnerCredits) || input.runnerCredits < 0) {
    return unknownAssessment(
      input.maximumRunnerAccessSuccessProbability,
      "invalid_runner_credits",
      ["scoreProtectionKnown:false", "invalidRunnerCredits:true"],
    );
  }
  const iceInstanceIds = input.serverIce.map((card) => card.instanceId);
  if (
    iceInstanceIds.some((instanceId) => !validIdentifier(instanceId)) ||
    new Set(iceInstanceIds).size !== iceInstanceIds.length
  ) {
    return unknownAssessment(
      input.maximumRunnerAccessSuccessProbability,
      "duplicate_ice_instance",
      ["scoreProtectionKnown:false", "duplicateIceInstance:true"],
    );
  }
  const activeIce = input.serverIce
    .filter((card) => card.rezzed === true)
    .slice()
    .reverse();
  if (activeIce.length === 0) {
    const exactThreshold = exactProbabilityFromRational(threshold);
    if (!exactThreshold) {
      return unknownAssessment(
        input.maximumRunnerAccessSuccessProbability,
        "probability_not_safely_representable",
        [
          "scoreProtectionKnown:false",
          "probabilityNotSafelyRepresentable:true",
        ],
      );
    }
    const accessProbability = { numerator: 1, denominator: 1 } as const;
    const protectsScore = compareRational(ONE, threshold) <= 0;
    return {
      knowledge: "known",
      runnerAccessSuccessProbability: accessProbability,
      maximumRunnerAccessSuccessProbability: exactThreshold,
      protectsScore,
      requiredRandomBreakSuccesses: 0,
      randomBreaks: [],
      runnerCreditsRemainingOnBestAccessPath: input.runnerCredits,
      evidence: [
        "scoreProtectionKnown:true",
        "scoreProtectionScope:visible_direct_access_prevention",
        "rezzedIceCount:0",
        "runnerAccessSuccessProbability:1/1",
        `maximumRunnerAccessSuccessProbability:${exactThreshold.numerator}/${exactThreshold.denominator}`,
        "requiredRandomBreakSuccesses:0",
        `runnerCreditsRemainingOnBestAccessPath:${input.runnerCredits}`,
        `protectsScore:${protectsScore}`,
      ],
    };
  }
  const stagedBreakers = visiblePreparedRunnerBreakerCandidates(input);
  if (stagedBreakers.status === "unknown") {
    return unknownAssessment(
      input.maximumRunnerAccessSuccessProbability,
      "unsupported_public_staged_breaker",
      [
        "scoreProtectionKnown:false",
        "publicStagedBreakerKnown:false",
        `publicStagedBreakerReason:${stagedBreakers.reason}`,
      ],
    );
  }
  if (stagedBreakers.candidates.length > 0) {
    return assessCorpScoreProtectionWithPreparedBreakers(
      input,
      stagedBreakers.candidates,
    );
  }
  const runnerRig = input.runnerRig.filter(
    (card) => !cardIsInactiveConcealedRunnerResource(card),
  );
  const rigInstanceIds = runnerRig.map((card) => card.instanceId);
  if (
    rigInstanceIds.some((instanceId) => !validIdentifier(instanceId)) ||
    new Set(rigInstanceIds).size !== rigInstanceIds.length
  ) {
    return unknownAssessment(
      input.maximumRunnerAccessSuccessProbability,
      "duplicate_runner_rig_instance",
      ["scoreProtectionKnown:false", "duplicateRunnerRigInstance:true"],
    );
  }
  if (
    runnerRig.some((card) =>
      runnerRigCardRequiresUnsupportedAccessProjection(card, activeIce),
    )
  ) {
    return unknownAssessment(
      input.maximumRunnerAccessSuccessProbability,
      "unsupported_runner_access_effect",
      ["scoreProtectionKnown:false", "unsupportedRunnerAccessEffect:true"],
    );
  }
  if (runnerRig.some((card) => !validRunnerRigCard(card))) {
    return unknownAssessment(
      input.maximumRunnerAccessSuccessProbability,
      "unknown_runner_rig_card",
      ["scoreProtectionKnown:false", "unknownRunnerRigCard:true"],
    );
  }
  const supportedIce: SupportedIce[] = [];
  for (const card of activeIce) {
    const readResult = readSupportedIce(card);
    if (readResult.knowledge === "unknown") {
      return unknownAssessment(
        input.maximumRunnerAccessSuccessProbability,
        readResult.reason,
        [
          "scoreProtectionKnown:false",
          `${readResult.reason}:true`,
          `iceInstanceId:${card.instanceId}`,
          ...(card.definitionId
            ? [`iceDefinitionId:${card.definitionId}`]
            : []),
        ],
      );
    }
    supportedIce.push(readResult.ice);
  }

  let states: AccessPathState[] = [
    {
      credits: input.runnerCredits,
      creditBudget: normalizeRunnerRunPathCreditBudget(
        runnerRunPathCreditBudgetWithVisiblePools(
          input.runnerCredits,
          runnerRig,
          { creditPoolHorizon: input.runnerCreditPoolHorizon ?? "current" },
        ),
      ),
      probability: ONE,
      breakerStrengths: new Map(
        runnerRig
          .filter((card) => cardIsIcebreaker(card))
          .map((card) => [card.instanceId, card.strength!]),
      ),
      randomBreaks: [],
      nextEncounterCannotBreak: false,
    },
  ];

  for (const ice of supportedIce) {
    const nextStates: AccessPathState[] = [];
    for (const state of states) {
      // The Engine consumes a pending lock at the next actual rezzed
      // encounter, including non-ETR ICE. Unrezzed skipped ICE is absent here.
      const enteringState = { ...state, nextEncounterCannotBreak: false };
      if (state.nextEncounterCannotBreak) {
        nextStates.push({
          ...enteringState,
          probability: ice.endTheRunCount > 0 ? ZERO : state.probability,
          nextEncounterCannotBreak: ice.nextBreakLockSubroutines.length > 0,
        });
        continue;
      }
      // Either allow this ICE's next-encounter lock, or pay its exact
      // subroutine quote as well as every current hard ETR.
      for (const breakLock of ice.nextBreakLockSubroutines.length > 0
        ? [false, true]
        : [false]) {
        const breakStates = accessPreservingBreakStates({
          state: enteringState,
          ice,
          runnerRig,
          requiredSubroutines: [
            ...ice.endTheRunSubroutines,
            ...(breakLock ? ice.nextBreakLockSubroutines : []),
          ],
        });
        if (breakStates.knowledge === "unknown") {
          return unknownAssessment(
            input.maximumRunnerAccessSuccessProbability,
            breakStates.reason,
            [
              "scoreProtectionKnown:false",
              `${breakStates.reason}:true`,
              `iceInstanceId:${ice.card.instanceId}`,
              `iceDefinitionId:${ice.card.definitionId}`,
            ],
          );
        }
        const branches =
          breakStates.states.length > 0
            ? breakStates.states
            : [{ ...enteringState, probability: ZERO }];
        nextStates.push(
          ...branches.map((branch) => ({
            ...branch,
            nextEncounterCannotBreak:
              !breakLock && ice.nextBreakLockSubroutines.length > 0,
          })),
        );
      }
    }
    states = pruneDominatedStates(nextStates);
  }

  const bestPath = states.reduce((best, candidate) =>
    accessPathIsBetter(candidate, best) ? candidate : best,
  );
  let passProbability = ONE;
  for (const source of input.serverRoot ?? []) {
    if (!source.rezzed) continue;
    const quote = visibleFortPassProtection(source);
    if (!quote.complete) {
      return unknownAssessment(
        input.maximumRunnerAccessSuccessProbability,
        "unknown_fort_pass_protection",
        [`fortPassProtectionUnknown:${source.instanceId}:${quote.reason}`],
      );
    }
    if (quote.kind === "end_run_on_pass") {
      passProbability = multiplyRational(
        passProbability,
        powerRational(
          {
            numerator: BigInt(quote.dieFaces - quote.endingFaces),
            denominator: BigInt(quote.dieFaces),
          },
          supportedIce.length,
        ),
      );
    }
  }
  const protectedPathProbability = multiplyRational(
    bestPath.probability,
    passProbability,
  );
  const accessProbability = exactProbabilityFromRational(
    protectedPathProbability,
  );
  const exactThreshold = exactProbabilityFromRational(threshold);
  if (!accessProbability || !exactThreshold) {
    return unknownAssessment(
      input.maximumRunnerAccessSuccessProbability,
      "probability_not_safely_representable",
      ["scoreProtectionKnown:false", "probabilityNotSafelyRepresentable:true"],
    );
  }
  const randomBreaks = bestPath.randomBreaks.map(exactRandomBreakChoice);
  if (randomBreaks.some((choice) => choice === undefined)) {
    return unknownAssessment(
      input.maximumRunnerAccessSuccessProbability,
      "probability_not_safely_representable",
      ["scoreProtectionKnown:false", "probabilityNotSafelyRepresentable:true"],
    );
  }
  const protectsScore =
    compareRational(protectedPathProbability, threshold) <= 0;
  const requiredRandomBreakSuccesses = requiredRandomBreakSuccessCount(
    bestPath.randomBreaks,
  );

  return {
    knowledge: "known",
    runnerAccessSuccessProbability: accessProbability,
    maximumRunnerAccessSuccessProbability: exactThreshold,
    protectsScore,
    requiredRandomBreakSuccesses,
    randomBreaks: randomBreaks.filter(
      (choice): choice is CorpScoreProtectionRandomBreak =>
        choice !== undefined,
    ),
    runnerCreditsRemainingOnBestAccessPath: bestPath.credits,
    evidence: [
      "scoreProtectionKnown:true",
      "scoreProtectionScope:visible_direct_access_prevention",
      `rezzedIceCount:${supportedIce.length}`,
      `runnerAccessSuccessProbability:${accessProbability.numerator}/${accessProbability.denominator}`,
      `maximumRunnerAccessSuccessProbability:${exactThreshold.numerator}/${exactThreshold.denominator}`,
      `requiredRandomBreakSuccesses:${requiredRandomBreakSuccesses}`,
      `runnerCreditsRemainingOnBestAccessPath:${bestPath.credits}`,
      `protectsScore:${protectsScore}`,
    ],
  };
}

function readSupportedIce(card: CorpScoreProtectionIceInput): IceReadResult {
  if (!card.known || !card.definitionId || !validIdentifier(card.instanceId)) {
    return { knowledge: "unknown", reason: "unknown_rezzed_ice" };
  }
  const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
  const visibleType = (card as CorpScoreProtectionIceInput & { type?: string })
    .type;
  const visibleOwner = (
    card as CorpScoreProtectionIceInput & { owner?: string }
  ).owner;
  if (
    !definition ||
    definition.type !== "ice" ||
    (visibleType !== undefined && visibleType !== "ice") ||
    (visibleOwner !== undefined && visibleOwner !== "corp")
  ) {
    return { knowledge: "unknown", reason: "unknown_rezzed_ice" };
  }
  const quote = card.effectiveRunQuote;
  if (quote && !validEffectiveRunQuote(card, quote)) {
    return { knowledge: "unknown", reason: "invalid_effective_run_quote" };
  }
  if (!quote && !matchesStaticCatalogIceFacts(card, definition)) {
    return { knowledge: "unknown", reason: "unknown_rezzed_ice" };
  }
  if ((quote?.conditionalEncounterEffects?.length ?? 0) > 0) {
    return {
      knowledge: "unknown",
      reason: "unsupported_access_relevant_ice_effect",
    };
  }
  const subroutines: readonly (
    | SubroutineDefinition
    | VisibleEffectiveSubroutine
  )[] = quote?.subroutines ?? definition.subroutines ?? [];
  if (
    subroutines.some((subroutine) => !validSubroutineIdentity(subroutine)) ||
    new Set(subroutines.map((subroutine) => subroutine.id)).size !==
      subroutines.length ||
    subroutines.some((subroutine) => !supportedSubroutine(subroutine)) ||
    catalogMechanicsContradictDirectSubroutines(
      definition.mechanics,
      subroutines,
    )
  ) {
    return {
      knowledge: "unknown",
      reason: "unsupported_access_relevant_ice_effect",
    };
  }
  return {
    knowledge: "known",
    ice: {
      card,
      endTheRunCount: subroutines.filter(isHardEndTheRunSubroutine).length,
      endTheRunSubroutines: subroutines.filter(isHardEndTheRunSubroutine),
      nextBreakLockSubroutines: subroutines.filter(isNextEncounterBreakLock),
      effectiveStrength:
        quote?.encounterStrength ?? quote?.effectiveStrength ?? card.strength!,
      effectiveSubtypes: card.subtypes!,
      additionalBreakCostPerSubroutine:
        quote?.breakSubroutineAdditionalCostPerSubroutine ?? 0,
    },
  };
}

function validEffectiveRunQuote(
  card: CorpScoreProtectionIceInput,
  quote: VisibleEffectiveIceRunQuote,
): boolean {
  return (
    quote.iceInstanceId === card.instanceId &&
    quote.iceDefinitionId === card.definitionId &&
    nonNegativeSafeInteger(quote.effectiveStrength) &&
    (quote.encounterStrength === undefined ||
      nonNegativeSafeInteger(quote.encounterStrength)) &&
    (quote.breakSubroutineAdditionalCostPerSubroutine === undefined ||
      nonNegativeSafeInteger(
        quote.breakSubroutineAdditionalCostPerSubroutine,
      )) &&
    Array.isArray(quote.subroutines) &&
    Array.isArray(card.subtypes) &&
    card.subtypes.every(validSubtype)
  );
}

function matchesStaticCatalogIceFacts(
  card: CorpScoreProtectionIceInput,
  definition: (typeof CARD_DEFINITIONS_BY_ID)[string],
): boolean {
  return (
    nonNegativeSafeInteger(card.strength) &&
    nonNegativeSafeInteger(definition.strength) &&
    card.strength === definition.strength &&
    Array.isArray(card.subtypes) &&
    card.subtypes.every(validSubtype) &&
    sameCanonicalStrings(card.subtypes, definition.subtypes)
  );
}

function validSubroutineIdentity(
  subroutine: SubroutineDefinition | VisibleEffectiveSubroutine,
): boolean {
  return validIdentifier(subroutine.id);
}

function catalogMechanicsContradictDirectSubroutines(
  mechanics: readonly string[],
  subroutines: readonly (SubroutineDefinition | VisibleEffectiveSubroutine)[],
): boolean {
  const directCanEndRun = subroutines.some(
    (subroutine) =>
      isHardEndTheRunSubroutine(subroutine) ||
      (subroutine.type === "initiate_trace" &&
        subroutine.traceSuccessEffect !== undefined &&
        (subroutine.traceSuccessEffect.type === "end_run_and_run_lock" ||
          subroutine.traceSuccessEffect.type ===
            "end_run_trash_program_and_run_lock")),
  );
  return mechanics.includes("end_the_run") && !directCanEndRun;
}

function supportedSubroutine(
  subroutine: SubroutineDefinition | VisibleEffectiveSubroutine,
): boolean {
  if (
    isHardEndTheRunSubroutine(subroutine) ||
    isNextEncounterBreakLock(subroutine)
  )
    return true;
  if (subroutine.type === "initiate_trace") {
    const effect = subroutine.traceSuccessEffect;
    if (effect === undefined) return false;
    return (
      effect.type === "none" ||
      // Like a direct damage subroutine, trace damage supplies no guaranteed
      // access prevention in this conservative direct-access model.
      effect.type === "net_damage" ||
      effect.type === "add_tag" ||
      effect.type === "add_counter" ||
      effect.type === "add_tag_and_counter" ||
      effect.type === "add_tags_by_trace_margin_over_runner_link" ||
      effect.type === "trash_runner_resource_and_add_tag"
    );
  }
  return CONSERVATIVE_NON_ACCESS_PREVENTING_SUBROUTINE_TYPES.has(
    subroutine.type,
  );
}

/**
 * These known Corp effects can be ignored safely by the access-probability
 * model: doing so assumes the Runner still accesses with no tax or damage
 * reduction. A separate defense-effect classifier may value their public
 * encounter impact, but this exact model never invents access prevention.
 */
const CONSERVATIVE_NON_ACCESS_PREVENTING_SUBROUTINE_TYPES = new Set<
  SubroutineDefinition["type"]
>([
  "corp_gain_credit",
  "end_the_run_unless_runner_pays",
  "runner_lose_credits",
  "give_runner_tag",
  "do_damage",
  "random_damage",
  "trash_installed_program",
  "trash_installed_program_unless_runner_pays",
  "set_run_encounter_tax",
  "set_run_break_subroutine_cost_modifier",
  "set_run_future_strength_bonus",
  "set_next_encounter_unless_fully_break_damage",
  "set_run_jack_out_lock",
  "set_runner_run_lock_actions",
  "set_runner_forgo_next_action",
  "end_the_run_and_runner_forgoes_next_action",
  "set_run_jack_out_additional_cost",
  "set_run_pass_rezzed_ice_program_trash",
  "rewind_run_to_rezzed_ice_by_die",
]);

function isHardEndTheRunSubroutine(
  subroutine: SubroutineDefinition | VisibleEffectiveSubroutine,
): boolean {
  return (
    subroutine.type === "end_the_run" ||
    subroutine.type === "end_the_run_and_trash_source_at_end_of_turn" ||
    subroutine.type === "end_the_run_and_runner_forgoes_next_action"
  );
}

function isNextEncounterBreakLock(
  subroutine: SubroutineDefinition | VisibleEffectiveSubroutine,
): boolean {
  return (
    subroutine.type === "set_next_encounter_lock" ||
    subroutine.type === "set_next_encounter_no_break_subroutines"
  );
}

function accessPreservingBreakStates(params: {
  state: AccessPathState;
  ice: SupportedIce;
  runnerRig: readonly VisibleCard[];
  requiredSubroutines: readonly (
    | SubroutineDefinition
    | VisibleEffectiveSubroutine
  )[];
}):
  | Readonly<{ knowledge: "known"; states: AccessPathState[] }>
  | Readonly<{
      knowledge: "unknown";
      reason:
        | "invalid_random_break_probability"
        | "unsupported_breaker_combination"
        | "unsupported_random_break_strategy";
    }> {
  if (params.requiredSubroutines.length === 0) {
    return { knowledge: "known", states: [params.state] };
  }
  const breakOptions: Array<
    Readonly<{
      assessment: BreakAssessment;
      riskProfile: EngineRandomBreakRiskProfile | undefined;
    }>
  > = [];
  const effectiveIce = {
    ...params.ice.card,
    strength: params.ice.effectiveStrength,
    subtypes: params.ice.effectiveSubtypes.slice(),
  };
  for (const breaker of params.runnerRig) {
    const assessment = creditsToBreakEndTheRunSubroutinesWithBreaker(
      breaker,
      effectiveIce,
      params.requiredSubroutines.length,
      params.state.breakerStrengths.get(breaker.instanceId),
      params.ice.additionalBreakCostPerSubroutine,
      params.requiredSubroutines,
      true,
    );
    if (
      !assessment ||
      !Number.isSafeInteger(assessment.cost) ||
      assessment.cost < 0 ||
      !projectBreakerCreditPayment(params.state.creditBudget, assessment)
        .affordable
    ) {
      continue;
    }
    breakOptions.push({
      assessment,
      riskProfile: randomBreakRiskProfileForEncounter({
        breaker,
        ice: params.ice,
        requiredSubroutines: params.requiredSubroutines,
        breakerStrength:
          params.state.breakerStrengths.get(breaker.instanceId) ??
          breaker.strength ??
          0,
      }),
    });
  }

  const randomOptions = breakOptions.filter(
    (
      option,
    ): option is Readonly<{
      assessment: BreakAssessment;
      riskProfile: EngineRandomBreakRiskProfile;
    }> => option.riskProfile !== undefined,
  );
  const hasMultipleIndependentRandomOptions = randomOptions.length > 1;
  const hasDominatingFreeDeterministicFullBreak = breakOptions.some(
    (option) =>
      option.assessment.cost === 0 && option.riskProfile === undefined,
  );
  if (params.requiredSubroutines.length > 1) {
    const partialBreakerOptions = params.runnerRig
      .map((breaker) =>
        creditsToBreakEndTheRunSubroutinesWithBreaker(
          breaker,
          effectiveIce,
          1,
          params.state.breakerStrengths.get(breaker.instanceId),
          params.ice.additionalBreakCostPerSubroutine,
          params.requiredSubroutines,
          true,
        ),
      )
      .filter(
        (assessment): assessment is BreakAssessment =>
          assessment !== undefined &&
          Number.isSafeInteger(assessment.cost) &&
          assessment.cost >= 0 &&
          projectBreakerCreditPayment(params.state.creditBudget, assessment)
            .affordable,
      );
    if (
      new Set(
        partialBreakerOptions.map((assessment) => assessment.breakerInstanceId),
      ).size > 1 &&
      !hasDominatingFreeDeterministicFullBreak &&
      !hasMultipleIndependentRandomOptions
    ) {
      return {
        knowledge: "unknown",
        reason: "unsupported_breaker_combination",
      };
    }
  }
  if (
    params.requiredSubroutines.length > 1 &&
    breakOptions.length > 1 &&
    randomOptions.length > 0 &&
    !hasMultipleIndependentRandomOptions &&
    !hasDominatingFreeDeterministicFullBreak
  ) {
    return {
      knowledge: "unknown",
      reason: "unsupported_random_break_strategy",
    };
  }

  const states: AccessPathState[] = [];
  for (const { assessment, riskProfile } of breakOptions) {
    if (riskProfile) continue;
    const nextCreditBudget = cloneRunnerRunPathCreditBudget(
      params.state.creditBudget,
    );
    spendBreakerCreditsAndApplySideEffects(nextCreditBudget, assessment);
    const nextStrengths = new Map(params.state.breakerStrengths);
    if (assessment.carriesStrengthAcrossIce) {
      nextStrengths.set(
        assessment.breakerInstanceId,
        assessment.endingStrength,
      );
    }
    states.push({
      nextEncounterCannotBreak: params.state.nextEncounterCannotBreak,
      credits: nextCreditBudget.credits,
      creditBudget: nextCreditBudget,
      probability: params.state.probability,
      breakerStrengths: nextStrengths,
      randomBreaks: params.state.randomBreaks,
    });
  }
  if (randomOptions.length > 0) {
    const randomState = independentlyCombinedRandomBreakState({
      state: params.state,
      ice: params.ice,
      requiredSubroutineCount: params.requiredSubroutines.length,
      randomOptions,
    });
    if (randomState.knowledge === "unknown") return randomState;
    states.push(randomState.state);
  }
  return { knowledge: "known", states };
}

function randomBreakRiskProfileForEncounter(params: {
  breaker: VisibleCard;
  ice: SupportedIce;
  breakerStrength: number;
  requiredSubroutines: readonly (
    | SubroutineDefinition
    | VisibleEffectiveSubroutine
  )[];
}): EngineRandomBreakRiskProfile | undefined {
  if (!params.breaker.definitionId || !params.ice.card.definitionId)
    return undefined;
  const quote = visibleBreakerEncounterQuote({
    breakerDefinitionId: params.breaker.definitionId,
    breakerInstanceId: params.breaker.instanceId,
    breakerStrength: params.breakerStrength,
    ...(params.breaker.selectedTargetCardId
      ? { selectedTargetCardId: params.breaker.selectedTargetCardId }
      : {}),
    ...(params.breaker.selectedSubtype
      ? { selectedSubtype: params.breaker.selectedSubtype }
      : {}),
    ...(params.breaker.randomRunStrengthState
      ? { randomRunStrengthState: params.breaker.randomRunStrengthState }
      : {}),
    iceDefinitionId: params.ice.card.definitionId,
    iceInstanceId: params.ice.card.instanceId,
    iceSubtypes: params.ice.effectiveSubtypes,
    subroutines: params.requiredSubroutines,
  });
  const randomAttempt = quote?.breakOptions
    .flatMap((option) => option.consequences)
    .find((consequence) => consequence.kind === "random_break_attempt");
  return randomAttempt
    ? { successProbabilityPerAttempt: randomAttempt.successProbability }
    : undefined;
}

function independentlyCombinedRandomBreakState(params: {
  state: AccessPathState;
  ice: SupportedIce;
  requiredSubroutineCount: number;
  randomOptions: readonly Readonly<{
    assessment: BreakAssessment;
    riskProfile: EngineRandomBreakRiskProfile;
  }>[];
}):
  | Readonly<{ knowledge: "known"; state: AccessPathState }>
  | Readonly<{
      knowledge: "unknown";
      reason:
        | "invalid_random_break_probability"
        | "unsupported_random_break_strategy";
    }> {
  if (params.randomOptions.some((option) => option.assessment.cost !== 0)) {
    return {
      knowledge: "unknown",
      reason: "unsupported_random_break_strategy",
    };
  }
  const choices: RandomBreakChoice[] = [];
  let allAttemptsFail = ONE;
  const nextStrengths = new Map(params.state.breakerStrengths);
  for (const { assessment, riskProfile } of params.randomOptions) {
    const perAttempt = rationalFromUnitIntervalNumber(
      riskProfile.successProbabilityPerAttempt,
    );
    if (!perAttempt) {
      return {
        knowledge: "unknown",
        reason: "invalid_random_break_probability",
      };
    }
    allAttemptsFail = multiplyRational(
      allAttemptsFail,
      subtractRational(ONE, perAttempt),
    );
    if (assessment.carriesStrengthAcrossIce) {
      nextStrengths.set(
        assessment.breakerInstanceId,
        assessment.endingStrength,
      );
    }
    choices.push({
      iceInstanceId: params.ice.card.instanceId,
      iceDefinitionId: params.ice.card.definitionId!,
      breakerInstanceId: assessment.breakerInstanceId,
      breakerDefinitionId: assessment.breakerDefinitionId,
      attempts: params.requiredSubroutineCount,
      successProbabilityPerAttempt: perAttempt,
      combinedSuccessProbability: powerRational(
        perAttempt,
        params.requiredSubroutineCount,
      ),
    });
  }
  const successPerSubroutine = subtractRational(ONE, allAttemptsFail);
  const combined = powerRational(
    successPerSubroutine,
    params.requiredSubroutineCount,
  );
  return {
    knowledge: "known",
    state: {
      nextEncounterCannotBreak: params.state.nextEncounterCannotBreak,
      credits: params.state.credits,
      creditBudget: cloneRunnerRunPathCreditBudget(params.state.creditBudget),
      probability: multiplyRational(params.state.probability, combined),
      breakerStrengths: nextStrengths,
      randomBreaks: [...params.state.randomBreaks, ...choices],
    },
  };
}

function pruneDominatedStates(
  states: readonly AccessPathState[],
): AccessPathState[] {
  const bestByResources = new Map<string, AccessPathState>();
  for (const state of states) {
    const strengthKey = [...state.breakerStrengths.entries()]
      .sort(([left], [right]) => compareCanonicalStrings(left, right))
      .map(([instanceId, strength]) => `${instanceId}:${strength}`)
      .join(",");
    const budgetKey = [
      state.creditBudget.credits,
      state.creditBudget.icebreakerCredits,
      state.creditBudget.nonNoisyIcebreakerCredits,
      state.creditBudget.nonStealthNonNoisyIcebreakerCredits,
      state.creditBudget.killerCredits,
      state.creditBudget.stealthNonNoisyIcebreakerCredits,
      ...Object.entries(
        state.creditBudget.hostedIcebreakerCreditsByBreakerInstanceId,
      )
        .sort(([left], [right]) => compareCanonicalStrings(left, right))
        .map(
          ([breakerInstanceId, credits]) => `${breakerInstanceId}:${credits}`,
        ),
    ].join(",");
    const key = `${budgetKey}|${strengthKey}|${state.nextEncounterCannotBreak}`;
    const current = bestByResources.get(key);
    if (!current || accessPathIsBetter(state, current)) {
      bestByResources.set(key, state);
    }
  }
  return [...bestByResources.values()];
}

function accessPathIsBetter(
  candidate: AccessPathState,
  current: AccessPathState,
): boolean {
  const probabilityComparison = compareRational(
    candidate.probability,
    current.probability,
  );
  if (probabilityComparison !== 0) return probabilityComparison > 0;
  return candidate.credits > current.credits;
}

function requiredRandomBreakSuccessCount(
  choices: readonly RandomBreakChoice[],
): number {
  const attemptsByIceInstanceId = new Map<string, number>();
  for (const choice of choices) {
    attemptsByIceInstanceId.set(
      choice.iceInstanceId,
      Math.max(
        attemptsByIceInstanceId.get(choice.iceInstanceId) ?? 0,
        choice.attempts,
      ),
    );
  }
  return [...attemptsByIceInstanceId.values()].reduce(
    (sum, attempts) => sum + attempts,
    0,
  );
}

function validRunnerRigCard(card: VisibleCard): boolean {
  if (
    card.known !== true ||
    !validIdentifier(card.instanceId) ||
    !card.definitionId
  ) {
    return false;
  }
  const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
  if (
    !definition ||
    definition.side !== "runner" ||
    (card.owner !== undefined && card.owner !== "runner") ||
    (card.type !== undefined && card.type !== definition.type) ||
    !Array.isArray(card.subtypes) ||
    !card.subtypes.every(validSubtype) ||
    (card.strength !== undefined && !nonNegativeSafeInteger(card.strength)) ||
    (card.counterDisplays ?? []).some(
      (display) => !nonNegativeSafeInteger(display.amount),
    )
  ) {
    return false;
  }
  if (!cardIsIcebreaker(card)) return true;
  if (card.type !== "program" || !nonNegativeSafeInteger(card.strength)) {
    return false;
  }
  return true;
}

function cardIsIcebreaker(card: VisibleCard): boolean {
  const definition = card.definitionId
    ? CARD_DEFINITIONS_BY_ID[card.definitionId]
    : undefined;
  return Boolean(
    definition?.subtypes.some(
      (subtype) => subtypeKey(subtype) === "icebreaker",
    ),
  );
}

function runnerRigCardRequiresUnsupportedAccessProjection(
  card: VisibleCard,
  activeIce: readonly CorpScoreProtectionIceInput[],
): boolean {
  if (!card.definitionId) return false;
  const definition = CARD_DEFINITIONS_BY_ID[card.definitionId];
  if (!definition) return false;
  const hint = AI_HINTS_BY_CARD.get(card.definitionId);
  const strengthModifiers = cardSpecPlanningCardByDefinitionId(
    card.definitionId,
  )?.planning.engine.modifiers?.filter(
    (modifier) => modifier.kind === "ice_strength",
  );
  const strengthIsQuoted =
    (strengthModifiers?.length ?? 0) > 0 &&
    strengthModifiers!.every(
      (modifier) =>
        modifier.activeWhile === "installed" &&
        modifier.sourceZone === "runner_installed" &&
        modifier.visibility === "public",
    ) &&
    activeIce.every(
      (ice) =>
        ice.effectiveRunQuote !== undefined &&
        validEffectiveRunQuote(ice, ice.effectiveRunQuote) &&
        nonNegativeSafeInteger(ice.effectiveRunQuote.encounterStrength),
    );
  return (
    (hint?.functionSignals?.includes("ice.strength_modifier") === true &&
      !strengthIsQuoted) ||
    hint?.requiredMechanics?.includes("run_start_random_strength_bonus") ===
      true ||
    definition.mechanics.some(
      (mechanic) =>
        mechanic === "encounter_ice" ||
        mechanic === "bypass_ice" ||
        mechanic === "corp_bypass_payment" ||
        mechanic === "run_spending_cap" ||
        mechanic === "run_flow" ||
        mechanic === "run_modifier" ||
        (mechanic.includes("ice_strength_modifier") && !strengthIsQuoted),
    )
  );
}

function cardIsInactiveConcealedRunnerResource(card: VisibleCard): boolean {
  return (
    card.known === false &&
    card.concealed === true &&
    card.hiddenRunnerResource === true &&
    card.type === "resource" &&
    card.rezzed === false
  );
}

function subtypeKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function validSubtype(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function sameCanonicalStrings(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) return false;
  const normalizedLeft = left.map(subtypeKey).sort(compareCanonicalStrings);
  const normalizedRight = right.map(subtypeKey).sort(compareCanonicalStrings);
  return normalizedLeft.every(
    (value, index) => value === normalizedRight[index],
  );
}

function compareCanonicalStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function rationalFromExactProbability(
  probability: ExactProbability,
): Rational | undefined {
  if (
    !Number.isSafeInteger(probability.numerator) ||
    !Number.isSafeInteger(probability.denominator) ||
    probability.numerator < 0 ||
    probability.denominator <= 0 ||
    probability.numerator > probability.denominator
  ) {
    return undefined;
  }
  return normalizeRational(
    BigInt(probability.numerator),
    BigInt(probability.denominator),
  );
}

function rationalFromUnitIntervalNumber(value: number): Rational | undefined {
  if (!Number.isFinite(value) || value < 0 || value > 1) return undefined;
  const match = value
    .toString()
    .toLowerCase()
    .match(/^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/);
  if (!match) return undefined;
  const fractionDigits = match[2] ?? "";
  const exponent = Number.parseInt(match[3] ?? "0", 10);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 100) {
    return undefined;
  }
  const digits = BigInt(`${match[1]}${fractionDigits}`);
  const scale = fractionDigits.length - exponent;
  const numerator = scale < 0 ? digits * 10n ** BigInt(-scale) : digits;
  const denominator = scale > 0 ? 10n ** BigInt(scale) : 1n;
  const result = normalizeRational(numerator, denominator);
  return compareRational(result, ONE) <= 0 ? result : undefined;
}

function powerRational(value: Rational, exponent: number): Rational {
  let result = ONE;
  for (let index = 0; index < exponent; index += 1) {
    result = multiplyRational(result, value);
  }
  return result;
}

function multiplyRational(left: Rational, right: Rational): Rational {
  return normalizeRational(
    left.numerator * right.numerator,
    left.denominator * right.denominator,
  );
}

function subtractRational(left: Rational, right: Rational): Rational {
  return normalizeRational(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function compareRational(
  left: Rational,
  right: Rational,
): ExactProbabilityComparison {
  const difference =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function normalizeRational(numerator: bigint, denominator: bigint): Rational {
  if (numerator === 0n) return ZERO;
  const divisor = greatestCommonDivisor(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < 0n ? -left : left;
  let b = right < 0n ? -right : right;
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function exactProbabilityFromRational(
  probability: Rational,
): ExactProbability | undefined {
  if (
    probability.numerator > MAX_SAFE_BIGINT ||
    probability.denominator > MAX_SAFE_BIGINT
  ) {
    return undefined;
  }
  return {
    numerator: Number(probability.numerator),
    denominator: Number(probability.denominator),
  };
}

function exactRandomBreakChoice(
  choice: RandomBreakChoice,
): CorpScoreProtectionRandomBreak | undefined {
  const perAttempt = exactProbabilityFromRational(
    choice.successProbabilityPerAttempt,
  );
  const combined = exactProbabilityFromRational(
    choice.combinedSuccessProbability,
  );
  if (!perAttempt || !combined) return undefined;
  return {
    iceInstanceId: choice.iceInstanceId,
    iceDefinitionId: choice.iceDefinitionId,
    breakerInstanceId: choice.breakerInstanceId,
    breakerDefinitionId: choice.breakerDefinitionId,
    attempts: choice.attempts,
    successProbabilityPerAttempt: perAttempt,
    combinedSuccessProbability: combined,
  };
}

type PreparedRunnerBreakerCandidate = Readonly<{
  card: VisibleCard;
  installCreditCost: number;
  evidence: readonly string[];
}>;

type PreparedRunnerBreakerCandidateRead =
  | Readonly<{
      status: "known";
      candidates: readonly PreparedRunnerBreakerCandidate[];
    }>
  | Readonly<{
      status: "unknown";
      reason:
        | "invalid_set_aside_card"
        | "invalid_shell_counter"
        | "invalid_runner_memory"
        | "staged_breaker_memory_unknown";
    }>;

/**
 * Models only a public, Engine-materialized delayed install. It deliberately
 * requires the installed source, public Shell counters, memory facts, and the
 * resulting paid counter-removal credits instead of reconstructing a threat
 * from historic events or card-name heuristics.
 */
export function visiblePreparedRunnerBreakerCandidates(
  input: CorpScoreProtectionAssessmentInput,
): PreparedRunnerBreakerCandidateRead {
  const setAside = input.runnerSetAside;
  if (setAside === undefined) return { status: "known", candidates: [] };

  const setAsideIds = setAside.map((card) => card.instanceId);
  if (
    setAsideIds.some((instanceId) => !validIdentifier(instanceId)) ||
    new Set(setAsideIds).size !== setAsideIds.length
  ) {
    return { status: "unknown", reason: "invalid_set_aside_card" };
  }

  const automaticRemovals = input.runnerRig.filter((card) => {
    if (
      card.known !== true ||
      card.type !== "resource" ||
      card.owner !== "runner" ||
      !card.definitionId
    ) {
      return false;
    }
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    return Boolean(
      hint?.side === "runner" &&
      hint.cardType === "resource" &&
      hint.requiredMechanics?.includes(
        "delayed_install_with_counter_countdown",
      ) &&
      hint.effects?.some(
        (effect) =>
          effect.kind === "install" &&
          effect.scope === "runner" &&
          effect.timing === "persistent" &&
          effect.resource === "cards" &&
          effect.target === "setup.install_countdown" &&
          effect.repeatable === true,
      ),
    );
  }).length;
  if (automaticRemovals === 0) return { status: "known", candidates: [] };

  const candidates: PreparedRunnerBreakerCandidate[] = [];
  for (const card of setAside) {
    const shellCounters = card.counters?.shell;
    if (shellCounters === undefined) continue;
    if (!nonNegativeSafeInteger(shellCounters)) {
      return { status: "unknown", reason: "invalid_shell_counter" };
    }
    if (shellCounters === 0 || !cardIsIcebreaker(card)) continue;
    if (
      !validRunnerRigCard(card) ||
      input.runnerRig.some(
        (installedCard) => installedCard.instanceId === card.instanceId,
      )
    ) {
      return { status: "unknown", reason: "invalid_set_aside_card" };
    }
    if (
      !nonNegativeSafeInteger(input.runnerMemoryUsed) ||
      !nonNegativeSafeInteger(input.runnerMemoryLimit) ||
      input.runnerMemoryUsed > input.runnerMemoryLimit
    ) {
      return { status: "unknown", reason: "invalid_runner_memory" };
    }
    if (!nonNegativeSafeInteger(card.memoryCost)) {
      return { status: "unknown", reason: "staged_breaker_memory_unknown" };
    }
    const hosted = visibleProgramHostInstallVariants(card, input.runnerRig);
    if (!hosted.complete)
      return { status: "unknown", reason: "staged_breaker_memory_unknown" };
    const installVariants = [
      ...(input.runnerMemoryUsed + card.memoryCost <= input.runnerMemoryLimit
        ? [card]
        : []),
      ...hosted.cards,
    ];
    const startTurnRemovals = Math.min(shellCounters, automaticRemovals);
    const installCreditCost = shellCounters - startTurnRemovals;
    if (installCreditCost > input.runnerCredits) continue;
    for (const installedCard of installVariants)
      candidates.push({
        card: installedCard,
        installCreditCost,
        evidence: [
          "publicStagedBreaker:true",
          `publicStagedBreakerInstanceId:${card.instanceId}`,
          `publicStagedBreakerDefinitionId:${card.definitionId}`,
          `publicStagedBreakerShellCounters:${shellCounters}`,
          `publicStagedBreakerStartTurnRemovals:${startTurnRemovals}`,
          `publicStagedBreakerPaidCounterRemovals:${installCreditCost}`,
          `publicStagedBreakerInstallCreditCost:${installCreditCost}`,
          "publicStagedBreakerMemoryFits:true",
          ...(installedCard.hostedOn
            ? [`publicStagedBreakerHost:${installedCard.hostedOn}`]
            : []),
          "publicStagedBreakerImmediateInstall:true",
        ],
      });
  }
  return { status: "known", candidates };
}

/** Compare independent preparation routes; never add basic income twice or
 * spend restricted breaker pools on recovery and installation. */
function assessCorpScoreProtectionWithPublicHeapBreakers(
  input: CorpScoreProtectionAssessmentInput,
): CorpScoreProtectionAssessment {
  const { runnerPublicPreparedBreakers: candidates, ...baseInput } = input;
  if (input.runnerCreditPoolHorizon !== "next_runner_turn") {
    return unknownAssessment(
      input.maximumRunnerAccessSuccessProbability,
      "unsupported_public_staged_breaker",
      ["publicHeapPreparationRequiresNextRunnerTurn:true"],
    );
  }
  const base = assessCorpScoreProtection(baseInput);
  if (base.knowledge === "unknown") return base;
  let best = base;
  let selectedEvidence: readonly string[] = [];
  const {
    runnerPreparationCreditClicks: _income,
    runnerSetAside: _setAside,
    runnerMemoryUsed: _memoryUsed,
    runnerMemoryLimit: _memoryLimit,
    ...recoveredInput
  } = baseInput;
  void _income;
  void _setAside;
  void _memoryUsed;
  void _memoryLimit;
  for (const candidate of candidates!) {
    const assessment = assessCorpScoreProtection({
      ...recoveredInput,
      runnerRig: [...input.runnerRig, candidate.card],
      runnerCredits: candidate.remainingGeneralCredits,
    });
    if (assessment.knowledge === "unknown") return assessment;
    if (scoreProtectionAssessmentIsMoreDangerous(assessment, best)) {
      best = assessment;
      selectedEvidence = candidate.evidence;
    }
  }
  return {
    ...best,
    evidence: [
      ...best.evidence,
      "publicHeapBreakerCandidateCount:" + candidates!.length,
      ...selectedEvidence,
    ],
  };
}

function assessCorpScoreProtectionWithPreparedBreakers(
  input: CorpScoreProtectionAssessmentInput,
  candidates: readonly PreparedRunnerBreakerCandidate[],
): CorpScoreProtectionAssessment {
  const {
    runnerSetAside: _runnerSetAside,
    runnerMemoryUsed: _runnerMemoryUsed,
    runnerMemoryLimit: _runnerMemoryLimit,
    ...baseInput
  } = input;
  void _runnerSetAside;
  void _runnerMemoryUsed;
  void _runnerMemoryLimit;

  const base = assessCorpScoreProtection(baseInput);
  const assessments: Array<
    Readonly<{
      assessment: KnownCorpScoreProtectionAssessment;
      stagedEvidence: readonly string[];
    }>
  > = [];
  if (base.knowledge === "known") {
    assessments.push({ assessment: base, stagedEvidence: [] });
  } else {
    return base;
  }

  for (const candidate of candidates) {
    const assessment = assessCorpScoreProtection({
      ...baseInput,
      runnerRig: [...input.runnerRig, candidate.card],
      runnerCredits: input.runnerCredits - candidate.installCreditCost,
    });
    if (assessment.knowledge === "unknown") return assessment;
    assessments.push({
      assessment,
      stagedEvidence: candidate.evidence,
    });
  }
  const selected = assessments.reduce((best, candidate) =>
    scoreProtectionAssessmentIsMoreDangerous(
      candidate.assessment,
      best.assessment,
    )
      ? candidate
      : best,
  );
  return {
    ...selected.assessment,
    evidence: [
      ...selected.assessment.evidence,
      `publicStagedBreakerCandidateCount:${candidates.length}`,
      ...selected.stagedEvidence,
    ],
  };
}

function scoreProtectionAssessmentIsMoreDangerous(
  candidate: KnownCorpScoreProtectionAssessment,
  current: KnownCorpScoreProtectionAssessment,
): boolean {
  const probabilityComparison = compareExactProbabilities(
    candidate.runnerAccessSuccessProbability,
    current.runnerAccessSuccessProbability,
  );
  if (probabilityComparison === undefined) return false;
  if (probabilityComparison !== 0) return probabilityComparison > 0;
  return (
    candidate.runnerCreditsRemainingOnBestAccessPath >
    current.runnerCreditsRemainingOnBestAccessPath
  );
}

function unknownAssessment(
  threshold: ExactProbability,
  unknownReason: UnknownCorpScoreProtectionAssessment["unknownReason"],
  evidence: readonly string[],
): UnknownCorpScoreProtectionAssessment {
  return {
    knowledge: "unknown",
    maximumRunnerAccessSuccessProbability: threshold,
    protectsScore: false,
    unknownReason,
    evidence,
  };
}
