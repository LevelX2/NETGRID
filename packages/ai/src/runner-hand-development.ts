import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import type {
  BreakerCapability,
  BreakerCoverageKind,
  DeckCapabilityProfile,
} from "./deck-capabilities";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";
import { RUNTIME_CARDS } from "./ai-hints";
import { runnerDamageThreatAssessment } from "./runner-damage-threat-assessment";
import {
  actionDevelopsPersistentCardNow,
  persistentDevelopmentActionProjection,
} from "./actions/persistent-development-action";
import { randomBreakOrDamageRiskProfileForDefinitionId } from "./actions/risk-action-projection";
import { actionClickCost } from "./runtime/action-cost";
import {
  RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
  RUNNER_PERSISTENT_INSTALL_EVALUATION_SCHEMA_VERSION,
  type EvaluateRunnerHandDevelopmentParams,
  type RunnerHandDevelopmentActivationPrerequisite,
  type RunnerHandDevelopmentAvailability,
  type RunnerHandDevelopmentCurrentNeed,
  type RunnerHandDevelopmentDeferReason,
  type RunnerHandDevelopmentEvaluation,
  type RunnerHandDevelopmentFundingNeed,
  type RunnerHandDevelopmentLiquidityTiming,
  type RunnerHandDevelopmentRole,
  type RunnerHandDevelopmentStrategicFit,
  type RunnerPersistentInstallCapabilityDelta,
  type RunnerPersistentInstallDuplicateRole,
  type RunnerPersistentEngineAssessment,
  type RunnerPersistentEngineCapability,
  type RunnerPersistentEngineConsumptionBlocker,
  type RunnerPersistentEngineKind,
  type RunnerPersistentEngineReadiness,
  type RunnerPersistentDeckReplacementAssessment,
  type RunnerPersistentDeckReplacementStatus,
  type RunnerPersistentInstallEvaluation,
  type RunnerPersistentInstallStackabilityClass,
} from "./runner/hand-development/runner-hand-development-types";

export {
  RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
  RUNNER_PERSISTENT_INSTALL_EVALUATION_SCHEMA_VERSION,
  type EvaluateRunnerHandDevelopmentParams,
  type RunnerHandDevelopmentActivationPrerequisite,
  type RunnerHandDevelopmentAvailability,
  type RunnerHandDevelopmentCurrentNeed,
  type RunnerHandDevelopmentDeferReason,
  type RunnerHandDevelopmentEvaluation,
  type RunnerHandDevelopmentFundingNeed,
  type RunnerHandDevelopmentLiquidityTiming,
  type RunnerHandDevelopmentRole,
  type RunnerHandDevelopmentStrategicFit,
  type RunnerPersistentInstallCapabilityDelta,
  type RunnerPersistentInstallDuplicateRole,
  type RunnerPersistentEngineAssessment,
  type RunnerPersistentEngineCapability,
  type RunnerPersistentEngineConsumptionBlocker,
  type RunnerPersistentEngineKind,
  type RunnerPersistentEngineReadiness,
  type RunnerPersistentDeckReplacementAssessment,
  type RunnerPersistentDeckReplacementStatus,
  type RunnerPersistentInstallEvaluation,
  type RunnerPersistentInstallStackabilityClass,
} from "./runner/hand-development/runner-hand-development-types";

export function runnerHandDevelopmentBreaksProtectedReserve(
  evaluation: RunnerHandDevelopmentEvaluation,
): boolean {
  return (
    evaluation.persistentInstallEvaluation !== undefined &&
    evaluation.persistentInstallEvaluation.reservePenalty <= -900 &&
    evaluation.liquidityTiming !== "immediate"
  );
}

import type {
  CardContext,
  CardSignals,
} from "./runner/hand-development/runner-hand-development-internal-types";
import {
  actionCreditCost,
  actionMatchesCard,
  availabilityPriority,
  breakerVariantAssessment,
  candidateMatchesCard,
  capabilityDeltaForPersistentInstall,
  clampPriority,
  duplicateRoleForPersistentInstall,
  desiredCreditReserveForPersistentEngine,
  fitPriority,
  handBufferPenaltyForPersistentInstall,
  hostableIcebreakerAvailableAfterInstall,
  intentHasPressure,
  looksLikeAccessPayoff,
  looksLikeBankTool,
  looksLikeBreaker,
  looksLikeDefense,
  looksLikeDrawOrSearch,
  looksLikeEconomyTool,
  looksLikeMemorySupport,
  looksLikeRunEvent,
  looksPotentiallyPlayable,
  looksRepeatUseful,
  marginalUtilityScoreForPersistentInstall,
  memoryAvailableFor,
  memoryBlocked,
  minimumCreditFloorForPersistentInstall,
  muPressurePenaltyForPersistentInstall,
  needPriority,
  opportunityPenaltyForPersistentInstall,
  persistentCoverageAlreadyPresent,
  persistentDeckReplacementAssessment,
  persistentFunctionalProfileForCard,
  persistentInstallEvidence,
  persistentEngineAssessmentForInstall,
  persistentInstallRouteBlocked,
  persistentProfilesOverlap,
  reservePenaltyForPersistentInstall,
  roleMatchesStrategicIntent,
  rolePriority,
  runnerNeedsCoverageFromHand,
  signalsForCard,
  sortedUnique,
  stackabilityClassForPersistentInstall,
  visibleOrRuntimeNumber,
  visibleRunnerThreat,
} from "./runner/hand-development/runner-persistent-install-evaluation";
import {
  runnerEffectsProvideDamagePrevention,
  runnerEffectsProvideBreakerCredits,
  runnerEffectsProvideExposeInformation,
  runnerEffectsProvideMultiaccess,
  runnerEffectsProvideNonNoisyBreakerCredits,
  runnerEffectsProvideProgramTrashPrevention,
  runnerEffectsProvideSearch,
  runnerEffectsProvideTagPrevention,
  runnerEffectsProvideTopTrashRecovery,
} from "./runner-canonical-hint-semantics";

export function evaluateRunnerHandDevelopment(
  params: EvaluateRunnerHandDevelopmentParams,
): RunnerHandDevelopmentEvaluation[] {
  if (params.input.side !== "runner") return [];
  return params.input.playerView.own.gripOrHq
    .filter((card) => card.known !== false)
    .map((card) => evaluateHandCard(params, card))
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.developmentRole.localeCompare(right.developmentRole) ||
        left.cardInstanceId.localeCompare(right.cardInstanceId),
    );
}

export function redactedRunnerHandDevelopmentFacts(
  evaluations: readonly RunnerHandDevelopmentEvaluation[],
): string[] {
  return evaluations
    .slice(0, 10)
    .map((evaluation) =>
      [
        `runner_hand_development:${evaluation.developmentRole}`,
        `availability:${evaluation.availability}`,
        `need:${evaluation.currentNeed}`,
        `liquidity:${evaluation.liquidityTiming}`,
        `fit:${evaluation.strategicFit}`,
        `priority:${evaluation.priority}`,
        ...(evaluation.fundingNeed
          ? [
              `missing_credits:${evaluation.fundingNeed.missingCredits}`,
              `target_credits:${evaluation.fundingNeed.targetCredits}`,
              `funding_reason:${evaluation.fundingNeed.reason}`,
            ]
          : []),
        `defer:${evaluation.deferReason}`,
        ...(evaluation.persistentInstallEvaluation
          ? [
              `stackability:${evaluation.persistentInstallEvaluation.stackabilityClass}`,
              `delta:${evaluation.persistentInstallEvaluation.capabilityDelta}`,
              `duplicate:${evaluation.persistentInstallEvaluation.duplicateRole}`,
              `install_fit:${evaluation.persistentInstallEvaluation.finalInstallFit}`,
            ]
          : []),
      ].join("|"),
    );
}

function evaluateHandCard(
  params: EvaluateRunnerHandDevelopmentParams,
  card: VisibleCard,
): RunnerHandDevelopmentEvaluation {
  const context = buildCardContext(params, card);
  const prospectiveRecoveryInfrastructure =
    doctrineSupportsProspectiveRecoveryInfrastructure(params, context);
  const initialDevelopmentRole = roleForCard(context);
  const initialAvailability = availabilityForCard(
    context,
    initialDevelopmentRole,
  );
  const initialBaseNeed = currentNeedForCard(
    params,
    context,
    initialDevelopmentRole,
  );
  const initialPersistentInstallEvaluation = evaluateRunnerPersistentInstall(
    params,
    context,
    initialDevelopmentRole,
    initialBaseNeed,
  );
  const developmentRole = roleAdjustedByPersistentInstall(
    initialDevelopmentRole,
    initialPersistentInstallEvaluation,
  );
  const availability =
    developmentRole === initialDevelopmentRole
      ? initialAvailability
      : availabilityForCard(context, developmentRole);
  const baseNeed =
    developmentRole === initialDevelopmentRole
      ? initialBaseNeed
      : currentNeedForCard(params, context, developmentRole);
  const persistentInstallEvaluation =
    developmentRole === initialDevelopmentRole
      ? initialPersistentInstallEvaluation
      : evaluateRunnerPersistentInstall(
          params,
          context,
          developmentRole,
          baseNeed,
        );
  const adjustedNeed =
    developmentRole === "draw_or_search_engine" &&
    recoveryOnlySearchHasNoVisibleTarget(params.input, context)
      ? baseNeed
      : currentNeedAdjustedByPersistentInstall(
          baseNeed,
          persistentInstallEvaluation,
        );
  const currentNeed =
    developmentRole === "defense_support" &&
    cardProvidesOnlyNonUrgentHandSizeSupport(params.input, context)
      ? "none"
      : adjustedNeed;
  const strategicFit = strategicFitForCard(
    params.strategicIntent,
    availability,
    developmentRole,
    currentNeed,
    persistentInstallEvaluation,
  );
  const fundingNeed = fundingNeedForCard(
    params.input,
    context,
    availability,
    persistentInstallEvaluation,
  );
  const liquidityTiming = liquidityTimingForCard(context, developmentRole);
  const deferReason = deferReasonForCard(
    availability,
    developmentRole,
    currentNeed,
    liquidityTiming,
    persistentInstallEvaluation,
    fundingNeed,
  );
  const priority = priorityForCard({
    availability,
    developmentRole,
    strategicFit,
    currentNeed,
    ...(persistentInstallEvaluation ? { persistentInstallEvaluation } : {}),
  });
  const activationPrerequisites: RunnerHandDevelopmentActivationPrerequisite[] =
    [
      ...(context.signals.requiresSameTurnAccess
        ? [
            {
              kind: "same_turn_access" as const,
              satisfied: context.sameTurnAccessFollowupAvailable === true,
            },
          ]
        : []),
      ...(context.signals.requiresHostedIcebreaker
        ? [
            {
              kind: "hosted_icebreaker" as const,
              satisfied: context.hostableIcebreakerAvailable === true,
            },
          ]
        : []),
    ];

  return {
    schemaVersion: RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
    cardInstanceId: card.instanceId,
    ...(card.definitionId ? { definitionId: card.definitionId } : {}),
    ...(card.title ? { title: card.title } : {}),
    ...(card.type ? { cardType: card.type } : {}),
    availability,
    developmentRole,
    strategicFit,
    currentNeed,
    liquidityTiming,
    priority,
    ...(fundingNeed ? { fundingNeed } : {}),
    activationPrerequisites,
    deferReason,
    ...(context.legalAction
      ? { legalActionId: context.legalAction.actionId }
      : {}),
    ...(persistentInstallEvaluation ? { persistentInstallEvaluation } : {}),
    evidence: redactedEvidenceForCard({
      context,
      developmentRole,
      availability,
      strategicFit,
      currentNeed,
      liquidityTiming,
      ...(fundingNeed ? { fundingNeed } : {}),
      ...(persistentInstallEvaluation ? { persistentInstallEvaluation } : {}),
    }).concat(
      prospectiveRecoveryInfrastructure
        ? [
            "runner_engine_doctrine:prospective_recovery_infrastructure",
            "runner_engine_owner:runner.develop_board_and_hand",
          ]
        : [],
    ),
  };
}

function roleAdjustedByPersistentInstall(
  role: RunnerHandDevelopmentRole,
  evaluation: RunnerPersistentInstallEvaluation | undefined,
): RunnerHandDevelopmentRole {
  if (
    role === "duplicate_or_low_value" &&
    evaluation?.stackabilityClass === "risk_mitigation" &&
    evaluation.capabilityDelta === "risk_reduction" &&
    evaluation.duplicateRole === "useful_backup" &&
    evaluation.finalInstallFit > 0
  ) {
    return "breaker_or_rig_piece";
  }
  return role;
}

function buildCardContext(
  params: EvaluateRunnerHandDevelopmentParams,
  card: VisibleCard,
): CardContext {
  const matchingCandidates = (params.actionCandidates ?? []).filter(
    (candidate) => candidateMatchesCard(candidate, card),
  );
  const legalAction =
    params.input.legalActions.find((action) =>
      actionMatchesCard(action, card),
    ) ??
    matchingCandidates
      .map((candidate) =>
        params.input.legalActions.find(
          (action) => action.actionId === candidate.actionId,
        ),
      )
      .find((action): action is LegalAction => action !== undefined);
  const signals = signalsForCard(card, matchingCandidates);
  const actionCost =
    legalAction !== undefined ? actionCreditCost(legalAction) : undefined;
  const installOrPlayCost =
    actionCost ??
    visibleOrRuntimeNumber(card, "installCost") ??
    visibleOrRuntimeNumber(card, "cost");
  const memoryCost = visibleOrRuntimeNumber(card, "memoryCost");
  const memoryAvailable = memoryAvailableFor(params);
  const duplicateInstalled =
    card.definitionId !== undefined &&
    (params.input.playerView.own.rig ?? []).some(
      (installed) => installed.definitionId === card.definitionId,
    );
  const sameTurnAccessFollowupAvailable = signals.requiresSameTurnAccess
    ? legalAction !== undefined &&
      sameTurnAccessFollowupAvailableAfter(params.input, legalAction)
    : undefined;
  const hostableIcebreakerAvailable = signals.requiresHostedIcebreaker
    ? hostableIcebreakerAvailableAfterInstall(params.input, card, legalAction)
    : undefined;

  return {
    card,
    ...(legalAction ? { legalAction } : {}),
    matchingCandidates,
    signals,
    currentCredits: params.input.playerView.own.credits,
    ...(installOrPlayCost !== undefined ? { installOrPlayCost } : {}),
    ...(memoryCost !== undefined ? { memoryCost } : {}),
    ...(memoryAvailable !== undefined ? { memoryAvailable } : {}),
    duplicateInstalled,
    ...(sameTurnAccessFollowupAvailable !== undefined
      ? { sameTurnAccessFollowupAvailable }
      : {}),
    ...(hostableIcebreakerAvailable !== undefined
      ? { hostableIcebreakerAvailable }
      : {}),
  };
}

function liquidityTimingForCard(
  context: CardContext,
  role: RunnerHandDevelopmentRole,
): RunnerHandDevelopmentLiquidityTiming {
  if (role !== "economy_engine" && role !== "bank_tool") return "none";
  const immediateCreditGain = Math.max(
    0,
    finiteRunnerHandNumber(context.legalAction?.payload?.gainCreditsAmount),
    finiteRunnerHandNumber(context.legalAction?.payload?.gainedCredits),
  );
  if (
    immediateCreditGain > 0 ||
    context.signals.candidateSignals.includes("economy.gain_credit") ||
    context.signals.effectTargets.some((target) =>
      target.includes("immediate_credit"),
    )
  ) {
    return "immediate";
  }
  if (
    context.signals.effectTargets.some(
      (target) =>
        target.includes("installment_credit") ||
        target.includes("turn_start_credit") ||
        target.includes("deferred_credit"),
    )
  ) {
    return "delayed";
  }
  return "none";
}

function finiteRunnerHandNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function roleForCard(context: CardContext): RunnerHandDevelopmentRole {
  const text = context.signals.text;
  if (context.duplicateInstalled && !looksRepeatUseful(text)) {
    return "duplicate_or_low_value";
  }
  if (runnerEffectsProvideBreakerCredits(context.signals.structuredEffects)) {
    return "economy_engine";
  }
  if (looksLikeMemorySupport(context.card, text)) return "memory_support";
  if (looksLikeBreaker(context.card, text)) return "breaker_or_rig_piece";
  if (looksLikeBankTool(text)) return "bank_tool";
  if (looksLikeRunEvent(context.card, context.card.rulesText ?? text))
    return "run_event";
  if (looksLikeEconomyTool(text)) return "economy_engine";
  if (
    runnerEffectsProvideSearch(context.signals.structuredEffects) ||
    runnerEffectsProvideTopTrashRecovery(context.signals.structuredEffects) ||
    looksLikeDrawOrSearch(text)
  )
    return "draw_or_search_engine";
  if (
    runnerEffectsProvideProgramTrashPrevention(
      context.signals.structuredEffects,
    ) ||
    looksLikeDefense(text)
  )
    return "defense_support";
  if (
    runnerEffectsProvideExposeInformation(context.signals.structuredEffects) ||
    runnerEffectsProvideMultiaccess(context.signals.structuredEffects) ||
    looksLikeAccessPayoff(text)
  )
    return "access_payoff";
  if (context.duplicateInstalled) return "duplicate_or_low_value";
  return "unknown";
}

function availabilityForCard(
  context: CardContext,
  role: RunnerHandDevelopmentRole,
): RunnerHandDevelopmentAvailability {
  if (
    context.legalAction &&
    context.signals.requiresSameTurnAccess &&
    context.sameTurnAccessFollowupAvailable !== true
  ) {
    return "timing_blocked";
  }
  if (context.legalAction) return "legal_now";
  if (role === "duplicate_or_low_value" || role === "unknown") {
    return "not_relevant_now";
  }
  if (memoryBlocked(context)) return "missing_mu";
  if (
    context.installOrPlayCost !== undefined &&
    context.installOrPlayCost > 0 &&
    context.installOrPlayCost > context.currentCredits
  ) {
    return "missing_credits";
  }
  if (looksPotentiallyPlayable(context.card, context.signals.text)) {
    return "timing_blocked";
  }
  return "not_relevant_now";
}

function currentNeedForCard(
  params: EvaluateRunnerHandDevelopmentParams,
  context: CardContext,
  role: RunnerHandDevelopmentRole,
): RunnerHandDevelopmentCurrentNeed {
  const intent = params.strategicIntent;
  const setupEngine = new Set(intent?.setupEngine ?? []);
  const credits = params.input.playerView.own.credits;
  const removesCurrentTags = context.matchingCandidates.some(
    (candidate) =>
      candidate.tagEffectProfile?.kind === "remove_tags" &&
      candidate.tagEffectProfile.acuteTagRemoval,
  );
  if (removesCurrentTags) {
    return params.input.playerView.own.tags > 0 ? "acute" : "none";
  }
  if (
    role === "draw_or_search_engine" &&
    recoveryOnlySearchHasNoVisibleTarget(params.input, context) &&
    !doctrineSupportsProspectiveRecoveryInfrastructure(params, context)
  ) {
    return "none";
  }
  if (
    role === "economy_engine" &&
    context.signals.requiresHostedIcebreaker &&
    context.hostableIcebreakerAvailable !== true
  ) {
    return "later";
  }
  if (
    role === "economy_engine" &&
    selfDamageEconomyWouldBreakRequiredHandBuffer(params.input, context)
  ) {
    return "none";
  }
  switch (role) {
    case "memory_support":
      return params.deckCapabilities?.runner?.memoryProfile
        .missingMemoryPressure || context.memoryAvailable === 0
        ? "acute"
        : setupEngine.has("runner.rig_first")
          ? "useful_now"
          : "setup";
    case "breaker_or_rig_piece":
      return runnerNeedsCoverageFromHand(params.deckCapabilities)
        ? "acute"
        : setupEngine.has("runner.rig_first") ||
            setupEngine.has("runner.search_breaker_setup")
          ? "useful_now"
          : "setup";
    case "economy_engine":
    case "bank_tool":
      return credits <= 2
        ? "acute"
        : setupEngine.has("runner.economy_setup_before_pressure")
          ? "useful_now"
          : "setup";
    case "draw_or_search_engine":
      return setupEngine.has("runner.draw_or_search_setup") ||
        setupEngine.has("runner.search_breaker_setup")
        ? "useful_now"
        : "setup";
    case "access_payoff":
      return intentHasPressure(intent) ? "useful_now" : "setup";
    case "run_event":
      return intent?.executionStyle === "runner.run_event_tempo"
        ? "useful_now"
        : intentHasPressure(intent)
          ? "setup"
          : "later";
    case "defense_support":
      return defenseSupportNeed(params.input, context);
    case "duplicate_or_low_value":
    case "unknown":
      return context.legalAction ? "later" : "none";
  }
}

function doctrineSupportsProspectiveRecoveryInfrastructure(
  params: EvaluateRunnerHandDevelopmentParams,
  context: CardContext,
): boolean {
  const definitionId = context.card.definitionId;
  if (
    !definitionId ||
    !params.strategicIntent?.engineLineIds?.includes(
      "runner.engine.consumption_recovery",
    )
  ) {
    return false;
  }
  const provider = params.strategicIntent.engineProviders?.find(
    (entry) =>
      entry.cardId === definitionId &&
      entry.capabilities.includes("runner.recovery.program_or_hardware") &&
      entry.additivity === "redundant_by_default",
  );
  if (!provider) return false;
  const installedProviderIds = new Set(
    (params.input.playerView.own.rig ?? [])
      .map((card) => card.definitionId)
      .filter((entry): entry is string => entry !== undefined),
  );
  return !params.strategicIntent.engineProviders?.some(
    (entry) =>
      entry.capabilities.includes("runner.recovery.program_or_hardware") &&
      installedProviderIds.has(entry.cardId),
  );
}

function defenseSupportNeed(
  input: AiDecisionInput,
  context: CardContext,
): RunnerHandDevelopmentCurrentNeed {
  if (!visibleRunnerThreat(input)) return "none";
  const damage = runnerDamageThreatAssessment(input).flatlineRisk;
  const damagePrevention = runnerEffectsProvideDamagePrevention(
    context.signals.structuredEffects,
  );
  if (damagePrevention) {
    return damage.level === "confirmed" || damage.level === "critical"
      ? "acute"
      : "setup";
  }
  if (cardHasHandSizeSupport(context)) {
    return damage.effectiveMaxHandSize < damage.uncappedRecommendedHandFloor
      ? "useful_now"
      : "none";
  }
  const tagPrevention = runnerEffectsProvideTagPrevention(
    context.signals.structuredEffects,
  );
  if (tagPrevention) {
    return input.playerView.own.tags > 0 ? "none" : "setup";
  }
  return "setup";
}

function cardProvidesOnlyNonUrgentHandSizeSupport(
  input: AiDecisionInput,
  context: CardContext,
): boolean {
  return (
    cardHasHandSizeSupport(context) &&
    defenseSupportNeed(input, context) === "none"
  );
}

function cardHasHandSizeSupport(context: CardContext): boolean {
  return (
    context.signals.effectTargets.some((target) =>
      target.includes("hand_size"),
    ) ||
    context.signals.roles.includes("handlimit") ||
    context.signals.text.includes("hand_size")
  );
}

function selfDamageEconomyWouldBreakRequiredHandBuffer(
  input: AiDecisionInput,
  context: CardContext,
): boolean {
  const selfUnpreventableDamage =
    context.signals.effectTargets.some((target) =>
      target.includes("self_unpreventable_brain_damage"),
    ) ||
    (context.legalAction?.payload?.damageCannotBePrevented === true &&
      context.legalAction.payload.damageType === "core");
  if (!selfUnpreventableDamage) return false;
  const minimumDamage = Math.min(
    ...input.legalActions
      .filter((action) => actionMatchesCard(action, context.card))
      .map((action) => action.payload?.damageAmount)
      .filter(
        (amount): amount is number =>
          typeof amount === "number" && Number.isFinite(amount) && amount > 0,
      ),
  );
  if (!Number.isFinite(minimumDamage)) return true;
  const risk = runnerDamageThreatAssessment(input).flatlineRisk;
  return (
    risk.handCount - minimumDamage < risk.recommendedHandFloor ||
    risk.effectiveMaxHandSize - minimumDamage <
      risk.uncappedRecommendedHandFloor
  );
}

function recoveryOnlySearchHasNoVisibleTarget(
  input: AiDecisionInput,
  context: CardContext,
): boolean {
  const recoveryOnly =
    runnerEffectsProvideTopTrashRecovery(context.signals.structuredEffects) &&
    !context.signals.structuredEffects.some(
      (effect) =>
        effect.kind === "draw" ||
        (effect.kind === "search" && effect.target !== "top_trash_card"),
    );
  if (!recoveryOnly) return false;
  const boundRecoveryTarget =
    typeof context.legalAction?.payload?.targetCardId === "string" ||
    typeof context.legalAction?.payload?.targetCardDefinitionId === "string";
  if (context.card.type === "event" && !boundRecoveryTarget) return true;
  return input.playerView.own.heapOrArchives.length === 0;
}

function currentNeedAdjustedByPersistentInstall(
  currentNeed: RunnerHandDevelopmentCurrentNeed,
  evaluation: RunnerPersistentInstallEvaluation | undefined,
): RunnerHandDevelopmentCurrentNeed {
  if (!evaluation) return currentNeed;
  if (evaluation.engineAssessment.readiness === "blocked") {
    return currentNeed === "acute" ? "later" : "none";
  }
  if (evaluation.finalInstallFit <= -650) {
    if (persistentInstallRouteBlocked(evaluation)) return currentNeed;
    return currentNeed === "acute" ? "later" : "none";
  }
  if (
    currentNeed === "none" &&
    (evaluation.capabilityDelta === "cumulative_capacity" ||
      evaluation.capabilityDelta === "risk_reduction" ||
      evaluation.capabilityDelta === "stable_upgrade") &&
    evaluation.finalInstallFit >= 350
  ) {
    return "useful_now";
  }
  if (currentNeed === "later" && evaluation.finalInstallFit >= 500) {
    return "setup";
  }
  if (
    currentNeed === "none" &&
    evaluation.engineAssessment.readiness === "ready_now" &&
    evaluation.finalInstallFit > 0
  ) {
    return "setup";
  }
  return currentNeed;
}

function evaluateRunnerPersistentInstall(
  params: EvaluateRunnerHandDevelopmentParams,
  context: CardContext,
  role: RunnerHandDevelopmentRole,
  currentNeed: RunnerHandDevelopmentCurrentNeed,
): RunnerPersistentInstallEvaluation | undefined {
  const action = context.legalAction;
  if (!action || !actionDevelopsPersistentCardNow(action)) return undefined;
  if (!isPersistentRunnerCard(context.card)) return undefined;

  const profile = persistentFunctionalProfileForCard(
    context.card,
    context.signals.text,
  );
  const installedPersistentCards = (params.input.playerView.own.rig ?? [])
    .filter((card) => card.known !== false)
    .map((card) => ({
      card,
      profile: persistentFunctionalProfileForCard(
        card,
        signalsForCard(card, []).text,
      ),
    }));
  const installedProfiles = installedPersistentCards.map(
    ({ profile: installedProfile }) => installedProfile,
  );
  const existingFunctionalCoverage = sortedUnique(
    installedProfiles.flatMap((installed) => installed.functionalCoverage),
  );
  const newFunctionalCoverage = sortedUnique(
    profile.functionalCoverage.filter(
      (coverage) =>
        !persistentCoverageAlreadyPresent(coverage, existingFunctionalCoverage),
    ),
  );
  const installedSameDefinitionCount = context.card.definitionId
    ? (params.input.playerView.own.rig ?? []).filter(
        (installed) => installed.definitionId === context.card.definitionId,
      ).length
    : 0;
  const installedSameFunctionalGroupCount = installedProfiles.filter(
    (installed) => persistentProfilesOverlap(profile, installed),
  ).length;
  const engineAssessment = persistentEngineAssessmentForInstall({
    params,
    profile,
    installedSameDefinitionCount,
    installedSameFunctionalGroupCount,
  });
  const replacementAssessment = persistentDeckReplacementAssessment({
    candidateCard: context.card,
    candidateProfile: profile,
    installed: installedPersistentCards,
  });
  const installedSameRandomBreakProfileCount =
    profile.randomBreakOrDamageProfileId
      ? installedProfiles.filter(
          (installed) =>
            installed.randomBreakOrDamageProfileId ===
            profile.randomBreakOrDamageProfileId,
        ).length
      : 0;
  const breakerVariant = breakerVariantAssessment(
    params,
    context.card,
    profile,
  );
  const stackabilityClass = stackabilityClassForPersistentInstall(
    params,
    profile,
    installedProfiles,
    installedSameDefinitionCount,
    installedSameFunctionalGroupCount,
  );
  const capabilityDelta = capabilityDeltaForPersistentInstall({
    params,
    profile,
    installedProfiles,
    existingFunctionalCoverage,
    newFunctionalCoverage,
    stackabilityClass,
    installedSameDefinitionCount,
    installedSameFunctionalGroupCount,
    currentNeed,
    breakerVariant,
  });
  const duplicateRole = duplicateRoleForPersistentInstall({
    params,
    profile,
    installedProfiles,
    capabilityDelta,
    installedSameDefinitionCount,
    installedSameFunctionalGroupCount,
    currentNeed,
    breakerVariant,
  });
  const installCost = Math.max(
    0,
    context.installOrPlayCost ?? actionCreditCost(action) ?? 0,
  );
  const engineNeedsProtectedReserve =
    engineAssessment.readiness === "ready_now" ||
    engineAssessment.readiness === "setup";
  const protectedCreditReserve = engineNeedsProtectedReserve
    ? desiredCreditReserveForPersistentEngine(params.input)
    : undefined;
  const safeInstallTargetCredits =
    protectedCreditReserve !== undefined
      ? installCost + protectedCreditReserve
      : undefined;
  const creditsAfterInstall = params.input.playerView.own.credits - installCost;
  const handAfterInstall = Math.max(
    0,
    params.input.playerView.own.gripOrHq.length - 1,
  );
  const memoryCost = context.memoryCost;
  const memoryAfterInstall =
    context.memoryAvailable !== undefined && memoryCost !== undefined
      ? context.memoryAvailable - memoryCost
      : undefined;
  const marginalUtilityScore = marginalUtilityScoreForPersistentInstall({
    params,
    profile,
    capabilityDelta,
    duplicateRole,
    installedSameFunctionalGroupCount,
    currentNeed,
  });
  const opportunityPenalty = opportunityPenaltyForPersistentInstall({
    profile,
    capabilityDelta,
    duplicateRole,
    installCost,
    newFunctionalCoverage,
  });
  const reservePenalty = reservePenaltyForPersistentInstall({
    params,
    profile,
    installCost,
    creditsAfterInstall,
  });
  const handBufferPenalty = handBufferPenaltyForPersistentInstall({
    params,
    profile,
    handAfterInstall,
    duplicateRole,
  });
  const muPressurePenalty = muPressurePenaltyForPersistentInstall({
    card: context.card,
    ...(memoryAfterInstall !== undefined ? { memoryAfterInstall } : {}),
  });
  const displacementPenalty =
    (action.payload?.runnerProgramTrashBeforeInstall === true ? -1200 : 0) +
    (replacementAssessment.status === "blocked_unvalued_loss" ? -1600 : 0);
  const finalInstallFit =
    marginalUtilityScore +
    opportunityPenalty +
    reservePenalty +
    handBufferPenalty +
    muPressurePenalty +
    displacementPenalty;

  return {
    schemaVersion: RUNNER_PERSISTENT_INSTALL_EVALUATION_SCHEMA_VERSION,
    actionId: action.actionId,
    ...(context.card.definitionId ? { cardId: context.card.definitionId } : {}),
    ...(context.card.title ? { title: context.card.title } : {}),
    ...(context.card.type ? { cardType: context.card.type } : {}),
    installCost,
    creditsAfterInstall,
    handAfterInstall,
    ...(memoryCost !== undefined ? { memoryCost } : {}),
    ...(memoryAfterInstall !== undefined ? { memoryAfterInstall } : {}),
    ...(protectedCreditReserve !== undefined ? { protectedCreditReserve } : {}),
    ...(safeInstallTargetCredits !== undefined
      ? { safeInstallTargetCredits }
      : {}),
    installedSameDefinitionCount,
    installedSameFunctionalGroupCount,
    engineAssessment,
    replacementAssessment,
    existingFunctionalCoverage,
    newFunctionalCoverage,
    capabilityDelta,
    stackabilityClass,
    duplicateRole,
    marginalUtilityScore,
    opportunityPenalty,
    reservePenalty,
    handBufferPenalty,
    muPressurePenalty,
    displacementPenalty,
    finalInstallFit,
    evidence: persistentInstallEvidence({
      profile,
      engineAssessment,
      replacementAssessment,
      capabilityDelta,
      stackabilityClass,
      duplicateRole,
      installedSameDefinitionCount,
      installedSameFunctionalGroupCount,
      newFunctionalCoverage,
      installCost,
      creditsAfterInstall,
      handAfterInstall,
      ...(memoryAfterInstall !== undefined ? { memoryAfterInstall } : {}),
      ...(protectedCreditReserve !== undefined
        ? { protectedCreditReserve }
        : {}),
      ...(safeInstallTargetCredits !== undefined
        ? { safeInstallTargetCredits }
        : {}),
      marginalUtilityScore,
      opportunityPenalty,
      reservePenalty,
      handBufferPenalty,
      muPressurePenalty,
      displacementPenalty,
      finalInstallFit,
      role,
      installedSameRandomBreakProfileCount,
      breakerVariantEvidence: breakerVariant.evidence,
    }),
  };
}

function strategicFitForCard(
  intent: RunnerStrategicIntentProfile | undefined,
  availability: RunnerHandDevelopmentAvailability,
  role: RunnerHandDevelopmentRole,
  currentNeed: RunnerHandDevelopmentCurrentNeed,
  persistentInstallEvaluation?: RunnerPersistentInstallEvaluation,
): RunnerHandDevelopmentStrategicFit {
  if (
    persistentInstallEvaluation &&
    persistentInstallEvaluation.finalInstallFit <= -650
  ) {
    return "weak";
  }
  if (availability === "missing_credits" || availability === "missing_mu") {
    return currentNeed === "acute" || currentNeed === "useful_now"
      ? "blocked"
      : "medium";
  }
  if (role === "duplicate_or_low_value" || role === "unknown") return "weak";
  if (currentNeed === "none") return "weak";
  if (roleMatchesStrategicIntent(role, intent)) return "strong";
  if (currentNeed === "acute" || currentNeed === "useful_now") return "strong";
  if (currentNeed === "setup") return "medium";
  return "weak";
}

function fundingNeedForCard(
  input: AiDecisionInput,
  context: CardContext,
  availability: RunnerHandDevelopmentAvailability,
  persistentInstallEvaluation?: RunnerPersistentInstallEvaluation,
): RunnerHandDevelopmentFundingNeed | undefined {
  const installOrPlayCost = context.installOrPlayCost;
  if (installOrPlayCost === undefined) return undefined;
  const safeInstallTargetCredits =
    persistentInstallEvaluation?.safeInstallTargetCredits;
  const hardFloorTargetCredits =
    persistentInstallEvaluation !== undefined &&
    persistentInstallEvaluation.reservePenalty <= -900
      ? installOrPlayCost + minimumCreditFloorForPersistentInstall(input)
      : undefined;
  const targetCredits = Math.max(
    installOrPlayCost,
    safeInstallTargetCredits ?? 0,
    hardFloorTargetCredits ?? 0,
  );
  if (
    availability !== "missing_credits" &&
    input.playerView.own.credits >= targetCredits
  ) {
    return undefined;
  }
  return {
    installOrPlayCost,
    targetCredits,
    missingCredits: Math.max(0, targetCredits - input.playerView.own.credits),
    reason:
      availability === "missing_credits"
        ? "cannot_pay"
        : desiredCreditReserveForPersistentEngine(input) >= 6
          ? "would_break_run_reserve"
          : "would_break_floor",
  };
}

function deferReasonForCard(
  availability: RunnerHandDevelopmentAvailability,
  role: RunnerHandDevelopmentRole,
  currentNeed: RunnerHandDevelopmentCurrentNeed,
  liquidityTiming: RunnerHandDevelopmentLiquidityTiming,
  persistentInstallEvaluation?: RunnerPersistentInstallEvaluation,
  fundingNeed?: RunnerHandDevelopmentFundingNeed,
): RunnerHandDevelopmentDeferReason {
  if (persistentInstallEvaluation?.duplicateRole === "redundant_duplicate") {
    return "duplicate";
  }
  if (
    persistentInstallEvaluation?.replacementAssessment.status ===
    "blocked_unvalued_loss"
  ) {
    return "replacement_conflict";
  }
  if (
    availability === "legal_now" &&
    fundingNeed !== undefined &&
    fundingNeed.reason !== "cannot_pay" &&
    liquidityTiming !== "immediate"
  ) {
    return "preserve_credit_floor";
  }
  if (
    persistentInstallEvaluation &&
    persistentInstallEvaluation.reservePenalty <= -900 &&
    liquidityTiming !== "immediate"
  ) {
    return "preserve_credit_floor";
  }
  if (
    persistentInstallEvaluation &&
    persistentInstallEvaluation.finalInstallFit <= 0
  ) {
    if (
      persistentInstallEvaluation.displacementPenalty < 0 ||
      persistentInstallEvaluation.muPressurePenalty < 0
    ) {
      return "missing_mu";
    }
    if (
      availability === "legal_now" &&
      (currentNeed === "acute" || currentNeed === "useful_now") &&
      persistentInstallEvaluation.finalInstallFit === 0
    ) {
      return "none";
    }
    return "stronger_override";
  }
  if (role === "duplicate_or_low_value") return "duplicate";
  if (availability === "missing_credits") return "missing_credits";
  if (availability === "missing_mu") return "missing_mu";
  if (availability === "timing_blocked") return "timing";
  if (currentNeed === "none") return "no_current_need";
  return "none";
}

function priorityForCard(params: {
  availability: RunnerHandDevelopmentAvailability;
  developmentRole: RunnerHandDevelopmentRole;
  strategicFit: RunnerHandDevelopmentStrategicFit;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  persistentInstallEvaluation?: RunnerPersistentInstallEvaluation;
}): number {
  const installFitPriority =
    params.persistentInstallEvaluation !== undefined
      ? Math.round(params.persistentInstallEvaluation.finalInstallFit / 3)
      : 0;
  return clampPriority(
    rolePriority(params.developmentRole) +
      availabilityPriority(params.availability) +
      fitPriority(params.strategicFit) +
      needPriority(params.currentNeed) +
      installFitPriority,
  );
}

function redactedEvidenceForCard(params: {
  context: CardContext;
  developmentRole: RunnerHandDevelopmentRole;
  availability: RunnerHandDevelopmentAvailability;
  strategicFit: RunnerHandDevelopmentStrategicFit;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  liquidityTiming: RunnerHandDevelopmentLiquidityTiming;
  fundingNeed?: RunnerHandDevelopmentFundingNeed;
  persistentInstallEvaluation?: RunnerPersistentInstallEvaluation;
}): string[] {
  const persistent = params.persistentInstallEvaluation;
  return [
    "source:own_runner_hand",
    `card_type:${params.context.card.type ?? "unknown"}`,
    `hand_role:${params.developmentRole}`,
    `availability:${params.availability}`,
    `strategic_fit:${params.strategicFit}`,
    `current_need:${params.currentNeed}`,
    `liquidity_timing:${params.liquidityTiming}`,
    `legal_action_present:${params.context.legalAction !== undefined}`,
    `matching_action_candidates:${params.context.matchingCandidates.length}`,
    `duplicate_installed:${params.context.duplicateInstalled}`,
    ...(runnerEffectsProvideBreakerCredits(
      params.context.signals.structuredEffects,
    )
      ? ["breaker_recurring_economy"]
      : []),
    ...(params.context.signals.requiresSameTurnAccess
      ? [
          "same_turn_access_required:true",
          `same_turn_access_followup_available:${params.context.sameTurnAccessFollowupAvailable === true}`,
        ]
      : []),
    ...(params.context.signals.requiresHostedIcebreaker
      ? [
          "hosted_icebreaker_required:true",
          `hostable_icebreaker_available:${params.context.hostableIcebreakerAvailable === true}`,
        ]
      : []),
    ...(params.context.memoryAvailable !== undefined
      ? [`memory_available:${params.context.memoryAvailable}`]
      : []),
    ...(params.context.memoryCost !== undefined
      ? [`memory_cost:${params.context.memoryCost}`]
      : []),
    ...(params.fundingNeed
      ? [
          `funding_install_or_play_cost:${params.fundingNeed.installOrPlayCost}`,
          `funding_target_credits:${params.fundingNeed.targetCredits}`,
          `funding_missing_credits:${params.fundingNeed.missingCredits}`,
          `funding_reason:${params.fundingNeed.reason}`,
        ]
      : []),
    ...(persistent
      ? [
          "persistent_install_evaluation:true",
          `stackability_class:${persistent.stackabilityClass}`,
          `capability_delta:${persistent.capabilityDelta}`,
          `duplicate_role:${persistent.duplicateRole}`,
          `persistent_engine_kind:${persistent.engineAssessment.kind}`,
          `persistent_engine_readiness:${persistent.engineAssessment.readiness}`,
          `deck_replacement_status:${persistent.replacementAssessment.status}`,
          `installed_same_definition_count:${persistent.installedSameDefinitionCount}`,
          `installed_same_functional_group_count:${persistent.installedSameFunctionalGroupCount}`,
          `marginal_utility_score:${persistent.marginalUtilityScore}`,
          `opportunity_penalty:${persistent.opportunityPenalty}`,
          `reserve_penalty:${persistent.reservePenalty}`,
          `hand_buffer_penalty:${persistent.handBufferPenalty}`,
          `mu_pressure_penalty:${persistent.muPressurePenalty}`,
          `displacement_penalty:${persistent.displacementPenalty}`,
          `final_install_fit:${persistent.finalInstallFit}`,
          ...persistent.evidence.slice(0, 12),
        ]
      : []),
  ];
}

function sameTurnAccessFollowupAvailableAfter(
  input: AiDecisionInput,
  preparationAction: LegalAction,
): boolean {
  const remainingClicks =
    input.playerView.own.clicks - actionClickCost(preparationAction);
  if (remainingClicks <= 0) return false;
  const remainingCredits =
    input.playerView.own.credits - (actionCreditCost(preparationAction) ?? 0);
  return input.legalActions.some(
    (action) =>
      action.actionId !== preparationAction.actionId &&
      actionCanInitiateRunnerAccess(action) &&
      actionClickCost(action) <= remainingClicks &&
      (actionCreditCost(action) ?? 0) <= remainingCredits,
  );
}

function actionCanInitiateRunnerAccess(action: LegalAction): boolean {
  return (
    action.side === "runner" &&
    (action.type === "start_run" ||
      action.payload?.runnerEventRun === true ||
      action.payload?.effectKind === "run")
  );
}

function isPersistentRunnerCard(card: VisibleCard): boolean {
  return (
    card.type === "program" ||
    card.type === "hardware" ||
    card.type === "resource"
  );
}
