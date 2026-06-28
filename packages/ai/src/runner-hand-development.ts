import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import type {
  BreakerCoverageKind,
  DeckCapabilityProfile,
} from "./deck-capabilities";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";
import { CARD_ROLES_BY_CARD, RUNTIME_CARDS, createAiHintsByCard } from "./ai-hints";

export const RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION =
  "runner-hand-development-evaluation-v1" as const;
export const RUNNER_PERSISTENT_INSTALL_EVALUATION_SCHEMA_VERSION =
  "runner-persistent-install-evaluation-v1" as const;

export type RunnerHandDevelopmentAvailability =
  | "legal_now"
  | "missing_credits"
  | "missing_mu"
  | "timing_blocked"
  | "not_relevant_now";

export type RunnerHandDevelopmentRole =
  | "access_payoff"
  | "breaker_or_rig_piece"
  | "memory_support"
  | "economy_engine"
  | "bank_tool"
  | "draw_or_search_engine"
  | "defense_support"
  | "run_event"
  | "duplicate_or_low_value"
  | "unknown";

export type RunnerHandDevelopmentStrategicFit =
  | "strong"
  | "medium"
  | "weak"
  | "blocked";

export type RunnerHandDevelopmentCurrentNeed =
  | "acute"
  | "useful_now"
  | "setup"
  | "later"
  | "none";

export type RunnerHandDevelopmentDeferReason =
  | "none"
  | "missing_credits"
  | "missing_mu"
  | "no_current_need"
  | "duplicate"
  | "timing"
  | "preserve_credit_floor"
  | "stronger_override";

export type RunnerHandDevelopmentFundingNeed = {
  installOrPlayCost: number;
  missingCredits: number;
  reason: "cannot_pay" | "would_break_floor" | "would_break_run_reserve";
};

export type RunnerPersistentInstallCapabilityDelta =
  | "none"
  | "backup_only"
  | "new_coverage"
  | "stable_upgrade"
  | "cost_upgrade"
  | "risk_reduction"
  | "cumulative_capacity"
  | "synergy_support";

export type RunnerPersistentInstallStackabilityClass =
  | "absolute_non_stackable"
  | "replacement_upgrade"
  | "backup_redundancy"
  | "cumulative_capacity"
  | "action_bank_parallel"
  | "synergy_support"
  | "risk_mitigation"
  | "unknown";

export type RunnerPersistentInstallDuplicateRole =
  | "none"
  | "useful_backup"
  | "redundant_duplicate"
  | "emergency_redundancy";

export type RunnerPersistentInstallEvaluation = {
  schemaVersion: typeof RUNNER_PERSISTENT_INSTALL_EVALUATION_SCHEMA_VERSION;
  actionId: string;
  cardId?: string;
  title?: string;
  cardType?: VisibleCard["type"];
  installCost: number;
  creditsAfterInstall: number;
  handAfterInstall: number;
  memoryCost?: number;
  memoryAfterInstall?: number;
  installedSameDefinitionCount: number;
  installedSameFunctionalGroupCount: number;
  existingFunctionalCoverage: string[];
  newFunctionalCoverage: string[];
  capabilityDelta: RunnerPersistentInstallCapabilityDelta;
  stackabilityClass: RunnerPersistentInstallStackabilityClass;
  duplicateRole: RunnerPersistentInstallDuplicateRole;
  marginalUtilityScore: number;
  opportunityPenalty: number;
  reservePenalty: number;
  handBufferPenalty: number;
  muPressurePenalty: number;
  displacementPenalty: number;
  finalInstallFit: number;
  evidence: string[];
};

export type RunnerHandDevelopmentEvaluation = {
  schemaVersion: typeof RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION;
  cardInstanceId: string;
  definitionId?: string;
  title?: string;
  cardType?: VisibleCard["type"];
  availability: RunnerHandDevelopmentAvailability;
  developmentRole: RunnerHandDevelopmentRole;
  strategicFit: RunnerHandDevelopmentStrategicFit;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  priority: number;
  fundingNeed?: RunnerHandDevelopmentFundingNeed;
  deferReason: RunnerHandDevelopmentDeferReason;
  legalActionId?: string;
  persistentInstallEvaluation?: RunnerPersistentInstallEvaluation;
  evidence: string[];
};

export type EvaluateRunnerHandDevelopmentParams = {
  input: AiDecisionInput;
  strategicIntent?: RunnerStrategicIntentProfile;
  deckCapabilities?: DeckCapabilityProfile;
  actionCandidates?: readonly ActionSemanticCandidate[];
};

type CardSignals = {
  text: string;
  roles: string[];
  planRoles: string[];
  candidateSignals: string[];
};

type CardContext = {
  card: VisibleCard;
  legalAction?: LegalAction;
  matchingCandidates: ActionSemanticCandidate[];
  signals: CardSignals;
  currentCredits: number;
  installOrPlayCost?: number;
  memoryCost?: number;
  memoryAvailable?: number;
  duplicateInstalled: boolean;
};

type PersistentFunctionalProfile = {
  functionalCoverage: string[];
  primaryGroups: string[];
  nonAdditiveUtilityFamilies: string[];
  breakerCoverage: BreakerCoverageKind[];
  riskyBreaker: boolean;
  damagePrevention: boolean;
  handSizeSupport: boolean;
  memorySupport: boolean;
  bankTool: boolean;
  accessSupport: boolean;
  searchSupport: boolean;
  actionGatedUtility: boolean;
  absoluteNonStackable: boolean;
};

const AI_HINTS = createAiHintsByCard();

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
  return evaluations.slice(0, 10).map((evaluation) =>
    [
      `runner_hand_development:${evaluation.developmentRole}`,
      `availability:${evaluation.availability}`,
      `need:${evaluation.currentNeed}`,
      `fit:${evaluation.strategicFit}`,
      `priority:${evaluation.priority}`,
      ...(evaluation.fundingNeed
        ? [`missing_credits:${evaluation.fundingNeed.missingCredits}`]
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
  const developmentRole = roleForCard(context);
  const availability = availabilityForCard(context, developmentRole);
  const baseNeed = currentNeedForCard(params, context, developmentRole);
  const persistentInstallEvaluation = evaluateRunnerPersistentInstall(
    params,
    context,
    developmentRole,
    baseNeed,
  );
  const currentNeed = currentNeedAdjustedByPersistentInstall(
    baseNeed,
    persistentInstallEvaluation,
  );
  const strategicFit = strategicFitForCard(
    params.strategicIntent,
    availability,
    developmentRole,
    currentNeed,
    persistentInstallEvaluation,
  );
  const fundingNeed = fundingNeedForCard(params.input, context, availability);
  const deferReason = deferReasonForCard(
    availability,
    developmentRole,
    currentNeed,
    persistentInstallEvaluation,
  );
  const priority = priorityForCard({
    availability,
    developmentRole,
    strategicFit,
    currentNeed,
    ...(persistentInstallEvaluation ? { persistentInstallEvaluation } : {}),
  });

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
    priority,
    ...(fundingNeed ? { fundingNeed } : {}),
    deferReason,
    ...(context.legalAction ? { legalActionId: context.legalAction.actionId } : {}),
    ...(persistentInstallEvaluation ? { persistentInstallEvaluation } : {}),
    evidence: redactedEvidenceForCard({
      context,
      developmentRole,
      availability,
      strategicFit,
      currentNeed,
      ...(fundingNeed ? { fundingNeed } : {}),
      ...(persistentInstallEvaluation ? { persistentInstallEvaluation } : {}),
    }),
  };
}

function buildCardContext(
  params: EvaluateRunnerHandDevelopmentParams,
  card: VisibleCard,
): CardContext {
  const matchingCandidates = (params.actionCandidates ?? []).filter((candidate) =>
    candidateMatchesCard(candidate, card),
  );
  const legalAction =
    params.input.legalActions.find((action) => actionMatchesCard(action, card)) ??
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
    actionCost ?? visibleOrRuntimeNumber(card, "installCost") ??
    visibleOrRuntimeNumber(card, "cost");
  const memoryCost = visibleOrRuntimeNumber(card, "memoryCost");
  const memoryAvailable = memoryAvailableFor(params);
  const duplicateInstalled = card.definitionId !== undefined &&
    (params.input.playerView.own.rig ?? []).some(
      (installed) => installed.definitionId === card.definitionId,
    );

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
  };
}

function signalsForCard(
  card: VisibleCard,
  candidates: readonly ActionSemanticCandidate[],
): CardSignals {
  const definition = card.definitionId ? runtimeDefinition(card.definitionId) : undefined;
  const hint = card.definitionId ? AI_HINTS.get(card.definitionId) : undefined;
  const roleRecord = card.definitionId
    ? CARD_ROLES_BY_CARD.get(card.definitionId)
    : undefined;
  const roles = sortedUnique([
    ...(roleRecord?.roles ?? []),
    ...(hint?.roles ?? []),
  ]);
  const planRoles = sortedUnique([...(hint?.planRoles ?? [])]);
  const hintSignals = hint ? structuredHintSignals(hint) : [];
  const candidateSignals = sortedUnique(
    candidates.flatMap((candidate) => [
      candidate.semanticActionType,
      ...candidate.cardContextSignals,
      ...candidate.actionTacticSignals,
      ...candidate.strategySupport.map((support) => support.role),
      ...candidate.strategySupport.map((support) => support.strategyId),
    ]),
  );
  const text = [
    card.title,
    card.definitionId,
    card.type,
    ...(card.subtypes ?? []),
    card.rulesText,
    definition?.title,
    definition?.type,
    ...(definition?.subtypes ?? []),
    definition?.text,
    ...roles,
    ...planRoles,
    ...hintSignals,
    ...candidateSignals,
  ]
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ")
    .toLowerCase();
  return { text, roles, planRoles, candidateSignals };
}

function roleForCard(context: CardContext): RunnerHandDevelopmentRole {
  const text = context.signals.text;
  if (context.duplicateInstalled && !looksRepeatUseful(text)) {
    return "duplicate_or_low_value";
  }
  if (looksLikeMemorySupport(context.card, text)) return "memory_support";
  if (looksLikeBreaker(context.card, text)) return "breaker_or_rig_piece";
  if (looksLikeBankTool(text)) return "bank_tool";
  if (looksLikeEconomyTool(text)) return "economy_engine";
  if (looksLikeDrawOrSearch(text)) return "draw_or_search_engine";
  if (looksLikeDefense(text)) return "defense_support";
  if (looksLikeAccessPayoff(text)) return "access_payoff";
  if (looksLikeRunEvent(context.card, text)) return "run_event";
  if (context.duplicateInstalled) return "duplicate_or_low_value";
  return "unknown";
}

function availabilityForCard(
  context: CardContext,
  role: RunnerHandDevelopmentRole,
): RunnerHandDevelopmentAvailability {
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
  const credits = params.input.playerView.own.credits;
  switch (role) {
    case "memory_support":
      return params.deckCapabilities?.runner?.memoryProfile.missingMemoryPressure ||
        context.memoryAvailable === 0
        ? "acute"
        : intent?.setupEngine.includes("runner.rig_first") === true
          ? "useful_now"
          : "setup";
    case "breaker_or_rig_piece":
      return runnerNeedsCoverageFromHand(params.deckCapabilities)
        ? "acute"
        : intent?.setupEngine.includes("runner.rig_first") === true ||
            intent?.setupEngine.includes("runner.search_breaker_setup") === true
          ? "useful_now"
          : "setup";
    case "economy_engine":
    case "bank_tool":
      return credits <= 2
        ? "acute"
        : intent?.setupEngine.includes("runner.economy_setup_before_pressure") === true
          ? "useful_now"
          : "setup";
    case "draw_or_search_engine":
      return intent?.setupEngine.includes("runner.draw_or_search_setup") === true ||
        intent?.setupEngine.includes("runner.search_breaker_setup") === true
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
      return visibleRunnerThreat(params.input) ? "acute" : "none";
    case "duplicate_or_low_value":
    case "unknown":
      return context.legalAction ? "later" : "none";
  }
}

function currentNeedAdjustedByPersistentInstall(
  currentNeed: RunnerHandDevelopmentCurrentNeed,
  evaluation: RunnerPersistentInstallEvaluation | undefined,
): RunnerHandDevelopmentCurrentNeed {
  if (!evaluation) return currentNeed;
  if (evaluation.finalInstallFit <= -650) {
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
  if (
    currentNeed === "later" &&
    evaluation.finalInstallFit >= 500
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
  if (!action || action.type !== "install_card") return undefined;
  if (!isPersistentRunnerCard(context.card)) return undefined;

  const profile = persistentFunctionalProfileForCard(
    context.card,
    context.signals.text,
  );
  const installedProfiles = (params.input.playerView.own.rig ?? [])
    .filter((card) => card.known !== false)
    .map((card) =>
      persistentFunctionalProfileForCard(
        card,
        signalsForCard(card, []).text,
      ),
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
  });
  const duplicateRole = duplicateRoleForPersistentInstall({
    params,
    profile,
    installedProfiles,
    capabilityDelta,
    installedSameDefinitionCount,
    installedSameFunctionalGroupCount,
    currentNeed,
  });
  const installCost = Math.max(0, context.installOrPlayCost ?? actionCreditCost(action) ?? 0);
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
    action.payload?.runnerProgramTrashBeforeInstall === true ? -1200 : 0;
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
    installedSameDefinitionCount,
    installedSameFunctionalGroupCount,
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
      marginalUtilityScore,
      opportunityPenalty,
      reservePenalty,
      handBufferPenalty,
      muPressurePenalty,
      displacementPenalty,
      finalInstallFit,
      role,
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
): RunnerHandDevelopmentFundingNeed | undefined {
  if (availability !== "missing_credits") return undefined;
  const installOrPlayCost = context.installOrPlayCost;
  if (installOrPlayCost === undefined) return undefined;
  return {
    installOrPlayCost,
    missingCredits: Math.max(0, installOrPlayCost - input.playerView.own.credits),
    reason: "cannot_pay",
  };
}

function deferReasonForCard(
  availability: RunnerHandDevelopmentAvailability,
  role: RunnerHandDevelopmentRole,
  currentNeed: RunnerHandDevelopmentCurrentNeed,
  persistentInstallEvaluation?: RunnerPersistentInstallEvaluation,
): RunnerHandDevelopmentDeferReason {
  if (
    persistentInstallEvaluation?.duplicateRole === "redundant_duplicate"
  ) {
    return "duplicate";
  }
  if (
    persistentInstallEvaluation &&
    persistentInstallEvaluation.reservePenalty <= -900 &&
    persistentInstallEvaluation.finalInstallFit <= 0
  ) {
    return "preserve_credit_floor";
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
    `legal_action_present:${params.context.legalAction !== undefined}`,
    `matching_action_candidates:${params.context.matchingCandidates.length}`,
    `duplicate_installed:${params.context.duplicateInstalled}`,
    ...(params.context.memoryAvailable !== undefined
      ? [`memory_available:${params.context.memoryAvailable}`]
      : []),
    ...(params.context.memoryCost !== undefined
      ? [`memory_cost:${params.context.memoryCost}`]
      : []),
    ...(params.fundingNeed
      ? [
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

function isPersistentRunnerCard(card: VisibleCard): boolean {
  return (
    card.type === "program" ||
    card.type === "hardware" ||
    card.type === "resource"
  );
}

function persistentFunctionalProfileForCard(
  card: VisibleCard,
  text: string,
): PersistentFunctionalProfile {
  const breakerCoverage = breakerCoverageForPersistentCard(card, text);
  const riskyBreaker =
    breakerCoverage.length > 0 &&
    runnerHandTextHasRiskyBreakerSignal(text);
  const damagePrevention =
    runnerHandTextHasDamagePreventionSignal(text);
  const handSizeSupport =
    runnerHandTextHasHandSizeSignal(text);
  const memorySupport = looksLikeMemorySupport(card, text);
  const bankTool = looksLikeBankTool(text);
  const accessSupport = looksLikeAccessPayoff(text);
  const searchSupport = looksLikeDrawOrSearch(text);
  const nonAdditiveUtilityFamilies =
    nonAdditiveUtilityFamiliesForPersistentCard(card, text);
  const actionGatedUtility = nonAdditiveUtilityFamilies.length > 0;
  const absoluteNonStackable =
    runnerHandTextHasAbsoluteLinkSignal(text) &&
    !runnerHandTextHasTemporaryCounterSignal(text);
  const functionalCoverage = sortedUnique([
    ...breakerCoverage.map((coverage) => `breaker:${coverage}`),
    ...nonAdditiveUtilityFamilies,
    ...(memorySupport ? ["memory"] : []),
    ...(damagePrevention ? ["damage_prevention"] : []),
    ...(handSizeSupport ? ["hand_size"] : []),
    ...(bankTool ? ["bank_tool"] : []),
    ...(accessSupport ? ["access_support"] : []),
    ...(searchSupport ? ["search_support"] : []),
    ...(absoluteNonStackable ? ["absolute_link"] : []),
  ]);
  const primaryGroups = functionalCoverage.length > 0
    ? functionalCoverage
    : [`type:${card.type ?? "unknown"}`];
  return {
    functionalCoverage,
    primaryGroups,
    nonAdditiveUtilityFamilies,
    breakerCoverage,
    riskyBreaker,
    damagePrevention,
    handSizeSupport,
    memorySupport,
    bankTool,
    accessSupport,
    searchSupport,
    actionGatedUtility,
    absoluteNonStackable,
  };
}

function runnerHandTextHasRiskyBreakerSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["blink", "random", "roll"]) ||
    runnerHandTokensIncludePhrase(tokens, ["self", "damage"]) ||
    runnerHandTokensIncludeInOrder(tokens, "suffer", "damage") ||
    runnerHandTokensIncludeInOrder(tokens, "take", "damage") ||
    runnerHandTokensIncludeInOrder(tokens, "do", "damage")
  );
}

function runnerHandTextHasDamagePreventionSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeInOrder(tokens, "prevent", "damage") ||
    runnerHandTokensIncludePhrase(tokens, ["damage", "prevention"]) ||
    runnerHandTokensIncludeInOrder(tokens, "avoid", "damage")
  );
}

function runnerHandTextHasHandSizeSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["hand", "size"]) ||
    runnerHandTokensIncludePhrase(tokens, ["max", "hand"]) ||
    runnerHandTokensIncludePhrase(tokens, ["maximum", "hand"]) ||
    runnerHandTokensIncludePhrase(tokens, ["hand", "limit"]) ||
    runnerHandTokensIncludePhrase(tokens, ["grip", "size"])
  );
}

function runnerHandTextHasAbsoluteLinkSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["base", "link"]) ||
    runnerHandTokensIncludePhrase(tokens, ["link", "strength"]) ||
    runnerHandTokensIncludeInOrder(tokens, "gain", "link") ||
    runnerHandTokensIncludeNumberBefore(tokens, "link")
  );
}

function runnerHandTextHasTemporaryCounterSignal(text: string): boolean {
  return runnerHandTokensIncludeAny(runnerHandTextTokens(text), [
    "counter",
    "temporary",
    "recurring",
    "stored",
  ]);
}

function runnerHandTextHasBreakerSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, [
      "breaker",
      "icebreaker",
      "fracter",
      "decoder",
      "killer",
    ]) || runnerHandTokensIncludeInOrder(tokens, "break", "subroutine")
  );
}

function runnerHandTextHasMemorySupportSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["memory", "mu"]) ||
    runnerHandTokensIncludePhrase(tokens, ["memory", "support"]) ||
    runnerHandTokensIncludePhrase(tokens, ["mem", "chip"])
  );
}

function runnerHandTextHasBankToolSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["broker", "bank"]) ||
    runnerHandTokensIncludePhrase(tokens, ["bank", "tool"]) ||
    runnerHandTokensIncludePhrase(tokens, ["stored", "credits"]) ||
    runnerHandTokensIncludePhrase(tokens, ["counter", "bank"]) ||
    runnerHandTokensIncludePhrase(tokens, ["temporary", "resource", "bank"])
  );
}

function runnerHandTextHasEconomyToolSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, [
      "economy",
      "credit",
      "credits",
      "bits",
      "loan",
      "savings",
    ]) || runnerHandTokensIncludeInOrder(tokens, "gain", "credit")
  );
}

function runnerHandTextHasDrawOrSearchSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["search", "draw", "tutor"]) ||
    runnerHandTokensIncludePhrase(tokens, ["draw", "or", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "draw"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "search"])
  );
}

function runnerHandTextHasDefenseSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, ["defense", "tag", "link"]) ||
    runnerHandTokensIncludeInOrder(tokens, "prevent", "damage") ||
    runnerHandTokensIncludePhrase(tokens, ["damage", "prevention"]) ||
    runnerHandTokensIncludePhrase(tokens, ["net", "damage"]) ||
    runnerHandTokensIncludePhrase(tokens, ["meat", "damage"]) ||
    runnerHandTokensIncludeInOrder(tokens, "remove", "tag") ||
    runnerHandTokensIncludePhrase(tokens, ["hand", "size"])
  );
}

function runnerHandTextHasAccessPayoffSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, [
      "multiaccess",
      "interface",
      "access",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, ["access", "payoff"]) ||
    runnerHandTokensIncludePhrase(tokens, ["r", "d"]) ||
    runnerHandTokensIncludePhrase(tokens, ["rd", "pressure"]) ||
    runnerHandTokensIncludePhrase(tokens, ["hq", "pressure"]) ||
    runnerHandTokensIncludePhrase(tokens, ["trash", "support"]) ||
    runnerHandTokensIncludePhrase(tokens, ["remote", "contest"])
  );
}

function runnerHandTextHasRunEventSignal(text: string): boolean {
  return runnerHandTokensIncludeAny(runnerHandTextTokens(text), [
    "run",
    "bypass",
    "access",
    "approach",
  ]) || runnerHandTokensIncludePhrase(runnerHandTextTokens(text), ["jack", "out"]);
}

function runnerHandTextHasRepeatUsefulSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludeAny(tokens, [
      "counter",
      "temporary",
      "virus",
      "recurring",
      "multiaccess",
      "memory",
      "broker",
      "bank",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, ["stored", "credits"]) ||
    runnerHandTokensIncludeInOrder(tokens, "prevent", "damage") ||
    runnerHandTokensIncludePhrase(tokens, ["damage", "prevention"]) ||
    runnerHandTokensIncludePhrase(tokens, ["hand", "size"])
  );
}

function runnerHandTextHasPlayableSignal(text: string): boolean {
  return runnerHandTokensIncludeAny(runnerHandTextTokens(text), [
    "install",
    "play",
    "trigger",
    "action",
  ]);
}

function runnerHandTextHasRecoveryUtilitySignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["trash", "recovery"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "recovery"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "top", "trash", "recovery"]) ||
    runnerHandTokensIncludePhrase(tokens, ["search", "trash"]) ||
    runnerHandTokensIncludePhrase(tokens, [
      "top",
      "card",
      "from",
      "your",
      "trash",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, ["trash", "into", "your", "hand"]) ||
    runnerHandTokensIncludePhrase(tokens, ["heap", "recovery"])
  );
}

function runnerHandTextHasProgramSearchUtilitySignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["program", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "program", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, [
      "search",
      "your",
      "stack",
      "for",
      "a",
      "program",
    ]) ||
    runnerHandTokensIncludePhrase(tokens, ["program", "cards"])
  );
}

function runnerHandTextHasStackSearchUtilitySignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  return (
    runnerHandTokensIncludePhrase(tokens, ["stack", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, ["search", "stack"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "stack", "filter"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "card", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "prep", "resource", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, ["setup", "hardware", "search"]) ||
    runnerHandTokensIncludePhrase(tokens, ["top", "four", "cards", "of", "your", "stack"]) ||
    runnerHandTokensIncludePhrase(tokens, ["top", "five", "cards", "of", "your", "stack"])
  );
}

function runnerHandTextHasHiddenZoneSearchSignal(text: string): boolean {
  const tokens = runnerHandTextTokens(text);
  const hiddenZone =
    runnerHandTokensIncludePhrase(tokens, ["hidden", "zone", "tool"]) ||
    runnerHandTokensIncludePhrase(tokens, ["hidden", "runner", "resource"]) ||
    runnerHandTokensIncludePhrase(tokens, ["resource", "hidden"]);
  return (
    hiddenZone &&
    runnerHandTokensIncludeAny(tokens, ["search", "recovery", "stack", "trash"])
  );
}

function runnerHandTextTokens(text: string): string[] {
  return text
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function runnerHandTokensIncludeAny(
  tokens: readonly string[],
  needles: readonly string[],
): boolean {
  const tokenSet = new Set(tokens);
  return needles.some((needle) => tokenSet.has(needle));
}

function runnerHandTokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((_, index) =>
    phrase.every((token, offset) => tokens[index + offset] === token),
  );
}

function runnerHandTokensIncludeInOrder(
  tokens: readonly string[],
  first: string,
  second: string,
): boolean {
  const firstIndex = tokens.indexOf(first);
  return firstIndex >= 0 && tokens.indexOf(second, firstIndex + 1) >= 0;
}

function runnerHandTokensIncludeNumberBefore(
  tokens: readonly string[],
  tokenAfterNumber: string,
): boolean {
  return tokens.some(
    (token, index) =>
      runnerHandTokenIsDigits(token) && tokens[index + 1] === tokenAfterNumber,
  );
}

function runnerHandTokenIsDigits(token: string): boolean {
  for (const character of token) {
    if (character < "0" || character > "9") return false;
  }
  return token.length > 0;
}

function structuredHintSignals(hint: {
  effects?: readonly Record<string, unknown>[];
  targetProfiles?: readonly Record<string, unknown>[];
  lineSupport?: readonly string[];
}): string[] {
  return sortedUnique([
    ...(hint.effects ?? []).flatMap((effect) =>
      [
        effect.kind,
        effect.timing,
        effect.scope,
        effect.resource,
        effect.target,
      ].filter((value): value is string => typeof value === "string"),
    ),
    ...(hint.targetProfiles ?? []).flatMap((profile) =>
      [
        profile.kind,
        profile.timing,
        profile.targetType,
        profile.purpose,
        profile.hiddenInfoPolicy,
        ...(Array.isArray(profile.preferences) ? profile.preferences : []),
        ...(Array.isArray(profile.avoid) ? profile.avoid : []),
      ].filter((value): value is string => typeof value === "string"),
    ),
    ...(hint.lineSupport ?? []),
  ]);
}

function nonAdditiveUtilityFamiliesForPersistentCard(
  card: VisibleCard,
  text: string,
): string[] {
  if (card.type !== "resource") return [];
  const families = new Set<string>();
  const recovery = runnerHandTextHasRecoveryUtilitySignal(text);
  const programSearch = runnerHandTextHasProgramSearchUtilitySignal(text);
  const stackSearch = runnerHandTextHasStackSearchUtilitySignal(text);
  const hiddenZoneSearch = runnerHandTextHasHiddenZoneSearchSignal(text);

  if (recovery) families.add("non_additive_utility:recovery");
  if (programSearch) families.add("non_additive_utility:program_search");
  if (stackSearch) families.add("non_additive_utility:stack_search");
  if (hiddenZoneSearch) families.add("non_additive_utility:hidden_zone_search");
  if (families.size > 0) families.add("non_additive_utility:action_gated_search");
  return [...families].sort();
}

function breakerCoverageForPersistentCard(
  card: VisibleCard,
  text: string,
): BreakerCoverageKind[] {
  if (!looksLikeBreaker(card, text)) return [];
  const coverage = new Set<BreakerCoverageKind>();
  if (/fracter|wall|barrier/.test(text)) coverage.add("wall");
  if (/decoder|code gate|codegate|code_gate/.test(text)) coverage.add("code_gate");
  if (/killer|sentry/.test(text)) coverage.add("sentry");
  if (/\bap\b|anti-personnel/.test(text)) coverage.add("ap");
  if (/\btrace\b|traces/.test(text)) coverage.add("trace");
  if (/break (?:any|an?|\d+|one)?\s*ice subroutine|breaks? .*ice subroutine/.test(text)) {
    coverage.add(coverage.size > 0 ? "subtype_limited" : "universal");
  }
  if (coverage.size === 0) coverage.add("special");
  return [...coverage].sort();
}

function persistentCoverageAlreadyPresent(
  coverage: string,
  existingFunctionalCoverage: readonly string[],
): boolean {
  if (
    coverage.startsWith("non_additive_utility:") &&
    existingFunctionalCoverage.includes("non_additive_utility:action_gated_search")
  ) {
    return true;
  }
  if (!coverage.startsWith("breaker:")) {
    return existingFunctionalCoverage.includes(coverage);
  }
  if (existingFunctionalCoverage.includes(coverage)) return true;
  const coverageKind = coverage.slice("breaker:".length);
  return coverageKind !== "universal" &&
    existingFunctionalCoverage.includes("breaker:universal");
}

function persistentProfilesOverlap(
  candidate: PersistentFunctionalProfile,
  installed: PersistentFunctionalProfile,
): boolean {
  if (nonAdditiveUtilityProfilesOverlap(candidate, installed)) return true;
  if (
    candidate.breakerCoverage.length > 0 &&
    installed.breakerCoverage.length > 0 &&
    breakerCoverageOverlaps(candidate.breakerCoverage, installed.breakerCoverage)
  ) {
    return true;
  }
  return candidate.primaryGroups.some((group) =>
    installed.primaryGroups.includes(group),
  );
}

function nonAdditiveUtilityProfilesOverlap(
  candidate: PersistentFunctionalProfile,
  installed: PersistentFunctionalProfile,
): boolean {
  return candidate.nonAdditiveUtilityFamilies.some((family) =>
    installed.nonAdditiveUtilityFamilies.includes(family),
  );
}

function hasInstalledNonAdditiveUtilityOverlap(
  candidate: PersistentFunctionalProfile,
  installedProfiles: readonly PersistentFunctionalProfile[],
): boolean {
  return installedProfiles.some((installed) =>
    nonAdditiveUtilityProfilesOverlap(candidate, installed),
  );
}

function breakerCoverageOverlaps(
  left: readonly BreakerCoverageKind[],
  right: readonly BreakerCoverageKind[],
): boolean {
  if (left.includes("universal") || right.includes("universal")) return true;
  return left.some((coverage) => right.includes(coverage));
}

function stackabilityClassForPersistentInstall(
  params: EvaluateRunnerHandDevelopmentParams,
  profile: PersistentFunctionalProfile,
  installedProfiles: readonly PersistentFunctionalProfile[],
  installedSameDefinitionCount: number,
  installedSameFunctionalGroupCount: number,
): RunnerPersistentInstallStackabilityClass {
  if (profile.absoluteNonStackable) return "absolute_non_stackable";
  if (hasInstalledNonAdditiveUtilityOverlap(profile, installedProfiles)) {
    return "absolute_non_stackable";
  }
  if (persistentInstallReducesRisk(profile, installedProfiles)) {
    return "risk_mitigation";
  }
  if (profile.memorySupport || profile.damagePrevention || profile.handSizeSupport) {
    return "cumulative_capacity";
  }
  if (profile.bankTool) return "action_bank_parallel";
  if (profile.accessSupport || profile.searchSupport) return "synergy_support";
  if (profile.breakerCoverage.length > 0) {
    return installedSameDefinitionCount > 0 || installedSameFunctionalGroupCount > 0
      ? "backup_redundancy"
      : "replacement_upgrade";
  }
  if (
    installedSameFunctionalGroupCount > 0 &&
    cumulativeNeedLevel(params, profile) !== "low"
  ) {
    return "cumulative_capacity";
  }
  return "unknown";
}

function capabilityDeltaForPersistentInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  installedProfiles: readonly PersistentFunctionalProfile[];
  existingFunctionalCoverage: readonly string[];
  newFunctionalCoverage: readonly string[];
  stackabilityClass: RunnerPersistentInstallStackabilityClass;
  installedSameDefinitionCount: number;
  installedSameFunctionalGroupCount: number;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
}): RunnerPersistentInstallCapabilityDelta {
  if (
    params.profile.absoluteNonStackable &&
    params.installedSameFunctionalGroupCount > 0
  ) {
    return "none";
  }
  if (
    hasInstalledNonAdditiveUtilityOverlap(
      params.profile,
      params.installedProfiles,
    )
  ) {
    return "backup_only";
  }
  if (
    persistentInstallReducesRisk(params.profile, params.installedProfiles)
  ) {
    return "risk_reduction";
  }
  if (params.newFunctionalCoverage.length > 0) {
    if (
      params.profile.memorySupport ||
      params.profile.damagePrevention ||
      params.profile.handSizeSupport
    ) {
      return "cumulative_capacity";
    }
    return "new_coverage";
  }
  if (
    params.stackabilityClass === "cumulative_capacity" &&
    cumulativeNeedLevel(params.params, params.profile) !== "low"
  ) {
    return "cumulative_capacity";
  }
  if (
    params.stackabilityClass === "action_bank_parallel" &&
    params.currentNeed !== "none"
  ) {
    return "synergy_support";
  }
  if (
    params.installedSameDefinitionCount > 0 ||
    params.installedSameFunctionalGroupCount > 0
  ) {
    return "backup_only";
  }
  if (params.profile.functionalCoverage.length > 0) return "new_coverage";
  return "none";
}

function duplicateRoleForPersistentInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  installedProfiles: readonly PersistentFunctionalProfile[];
  capabilityDelta: RunnerPersistentInstallCapabilityDelta;
  installedSameDefinitionCount: number;
  installedSameFunctionalGroupCount: number;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
}): RunnerPersistentInstallDuplicateRole {
  if (
    params.installedSameDefinitionCount === 0 &&
    params.installedSameFunctionalGroupCount === 0
  ) {
    return "none";
  }
  if (
    hasInstalledNonAdditiveUtilityOverlap(
      params.profile,
      params.installedProfiles,
    )
  ) {
    return "redundant_duplicate";
  }
  if (
    params.capabilityDelta === "risk_reduction" ||
    params.capabilityDelta === "stable_upgrade" ||
    params.capabilityDelta === "new_coverage" ||
    params.capabilityDelta === "synergy_support"
  ) {
    return "useful_backup";
  }
  if (
    params.capabilityDelta === "cumulative_capacity" &&
    cumulativeNeedLevel(params.params, params.profile) !== "low"
  ) {
    return "useful_backup";
  }
  if (
    params.capabilityDelta === "backup_only" &&
    params.currentNeed === "acute"
  ) {
    return "emergency_redundancy";
  }
  return "redundant_duplicate";
}

function persistentInstallReducesRisk(
  profile: PersistentFunctionalProfile,
  installedProfiles: readonly PersistentFunctionalProfile[],
): boolean {
  return (
    profile.breakerCoverage.length > 0 &&
    !profile.riskyBreaker &&
    installedProfiles.some(
      (installed) =>
        installed.riskyBreaker &&
        breakerCoverageOverlaps(profile.breakerCoverage, installed.breakerCoverage),
    )
  );
}

function marginalUtilityScoreForPersistentInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  capabilityDelta: RunnerPersistentInstallCapabilityDelta;
  duplicateRole: RunnerPersistentInstallDuplicateRole;
  installedSameFunctionalGroupCount: number;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
}): number {
  switch (params.capabilityDelta) {
    case "new_coverage":
      return params.profile.breakerCoverage.length > 0 &&
        runnerNeedsCoverageFromHand(params.params.deckCapabilities)
        ? 1250
        : 950;
    case "stable_upgrade":
    case "risk_reduction":
      return 900;
    case "cost_upgrade":
      return 560;
    case "cumulative_capacity":
      return Math.round(
        cumulativeNeedBaseScore(params.params, params.profile) *
          diminishingReturnFactor(params.installedSameFunctionalGroupCount),
      );
    case "synergy_support":
      return params.profile.bankTool ? 260 : 420;
    case "backup_only":
      return params.duplicateRole === "emergency_redundancy" ? 320 : 160;
    case "none":
      return params.duplicateRole === "redundant_duplicate" ? -900 : 80;
  }
}

function cumulativeNeedBaseScore(
  params: EvaluateRunnerHandDevelopmentParams,
  profile: PersistentFunctionalProfile,
): number {
  switch (cumulativeNeedLevel(params, profile)) {
    case "high":
      return 760;
    case "medium":
      return 420;
    case "low":
      return 170;
  }
}

function cumulativeNeedLevel(
  params: EvaluateRunnerHandDevelopmentParams,
  profile: PersistentFunctionalProfile,
): "high" | "medium" | "low" {
  if (profile.memorySupport) {
    const memory = params.deckCapabilities?.runner?.memoryProfile;
    if (memory?.missingMemoryPressure || (memory?.memoryAvailable ?? 99) <= 0) {
      return "high";
    }
    if (runnerUsefulProgramsInHandForPersistent(params.input) > 0) return "medium";
  }
  if (profile.damagePrevention || profile.handSizeSupport) {
    if (
      runnerHasRiskyInstalledBreaker(params.input) ||
      visibleRunnerThreat(params.input)
    ) {
      return "high";
    }
    if (profile.handSizeSupport && params.input.playerView.own.gripOrHq.length <= 3) {
      return "medium";
    }
  }
  if (profile.bankTool) {
    if (params.input.playerView.own.credits <= 2) return "high";
    if (params.input.playerView.own.credits <= 5) return "medium";
  }
  if (
    profile.accessSupport &&
    (params.strategicIntent?.pressureVectors.length ?? 0) > 0
  ) {
    return "medium";
  }
  return "low";
}

function diminishingReturnFactor(installedSameFunctionalGroupCount: number): number {
  if (installedSameFunctionalGroupCount <= 0) return 1;
  if (installedSameFunctionalGroupCount === 1) return 0.6;
  if (installedSameFunctionalGroupCount === 2) return 0.3;
  return 0.15;
}

function opportunityPenaltyForPersistentInstall(params: {
  profile: PersistentFunctionalProfile;
  capabilityDelta: RunnerPersistentInstallCapabilityDelta;
  duplicateRole: RunnerPersistentInstallDuplicateRole;
  installCost: number;
  newFunctionalCoverage: readonly string[];
}): number {
  let penalty = 0;
  if (params.duplicateRole === "redundant_duplicate") penalty -= 480;
  if (params.duplicateRole === "useful_backup") penalty -= 80;
  if (
    params.profile.riskyBreaker &&
    params.capabilityDelta === "backup_only"
  ) {
    penalty -= 260;
  }
  if (
    params.installCost > 0 &&
    params.newFunctionalCoverage.length === 0 &&
    (params.capabilityDelta === "backup_only" ||
      params.capabilityDelta === "none")
  ) {
    penalty -= 180;
  }
  return penalty;
}

function reservePenaltyForPersistentInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  installCost: number;
  creditsAfterInstall: number;
}): number {
  if (params.installCost <= 0) return 0;
  const riskyContext = runnerHasRiskyInstalledBreaker(params.params.input);
  const minimumCreditFloor = riskyContext ? 3 : 2;
  const visibleRemoteScoreThreat = runnerVisibleRemoteScoreThreat(
    params.params.input,
  );
  const desiredCreditReserve = visibleRemoteScoreThreat
    ? 6
    : riskyContext
      ? 5
      : 4;
  if (params.creditsAfterInstall < minimumCreditFloor) return -900;
  if (visibleRemoteScoreThreat && params.creditsAfterInstall < 6) return -1300;
  if (params.creditsAfterInstall < desiredCreditReserve) return -420;
  return 0;
}

function handBufferPenaltyForPersistentInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  handAfterInstall: number;
  duplicateRole: RunnerPersistentInstallDuplicateRole;
}): number {
  if (params.profile.damagePrevention || params.profile.handSizeSupport) return 0;
  if (
    params.duplicateRole === "redundant_duplicate" &&
    params.profile.actionGatedUtility
  ) {
    if (params.handAfterInstall <= 0) return -1000;
    if (params.handAfterInstall <= 2) return -780;
    if (params.handAfterInstall <= 3) return -520;
    return -240;
  }
  const riskyContext =
    runnerHasRiskyInstalledBreaker(params.params.input) ||
    (params.profile.riskyBreaker && params.duplicateRole !== "none");
  if (!riskyContext) return 0;
  if (params.handAfterInstall <= 0) return -1000;
  if (params.handAfterInstall <= 2) return -780;
  if (params.handAfterInstall <= 3) return -520;
  return 0;
}

function muPressurePenaltyForPersistentInstall(params: {
  memoryAfterInstall?: number;
  card: VisibleCard;
}): number {
  if (params.memoryAfterInstall === undefined) return 0;
  if (params.memoryAfterInstall < 0) return -820;
  if (params.card.type === "program" && params.memoryAfterInstall === 0) {
    return -320;
  }
  return 0;
}

function persistentInstallEvidence(params: {
  profile: PersistentFunctionalProfile;
  capabilityDelta: RunnerPersistentInstallCapabilityDelta;
  stackabilityClass: RunnerPersistentInstallStackabilityClass;
  duplicateRole: RunnerPersistentInstallDuplicateRole;
  installedSameDefinitionCount: number;
  installedSameFunctionalGroupCount: number;
  newFunctionalCoverage: readonly string[];
  installCost: number;
  creditsAfterInstall: number;
  handAfterInstall: number;
  memoryAfterInstall?: number;
  marginalUtilityScore: number;
  opportunityPenalty: number;
  reservePenalty: number;
  handBufferPenalty: number;
  muPressurePenalty: number;
  displacementPenalty: number;
  finalInstallFit: number;
  role: RunnerHandDevelopmentRole;
}): string[] {
  return [
    `persistent_install_role:${params.role}`,
    `persistent_functional_coverage:${params.profile.functionalCoverage.join("|") || "none"}`,
    `non_additive_utility_families:${params.profile.nonAdditiveUtilityFamilies.join("|") || "none"}`,
    `new_functional_coverage:${params.newFunctionalCoverage.join("|") || "none"}`,
    `stackability_class:${params.stackabilityClass}`,
    `capability_delta:${params.capabilityDelta}`,
    `duplicate_role:${params.duplicateRole}`,
    `install_cost:${params.installCost}`,
    `credits_after_install:${params.creditsAfterInstall}`,
    `hand_after_install:${params.handAfterInstall}`,
    ...(params.memoryAfterInstall !== undefined
      ? [`memory_after_install:${params.memoryAfterInstall}`]
      : []),
    `marginal_utility_score:${params.marginalUtilityScore}`,
    `opportunity_penalty:${params.opportunityPenalty}`,
    `reserve_penalty:${params.reservePenalty}`,
    `hand_buffer_penalty:${params.handBufferPenalty}`,
    `mu_pressure_penalty:${params.muPressurePenalty}`,
    `displacement_penalty:${params.displacementPenalty}`,
    `final_install_fit:${params.finalInstallFit}`,
    ...(params.duplicateRole === "redundant_duplicate"
      ? ["why_duplicate_install_deferred:low_marginal_utility"]
      : []),
    ...(params.duplicateRole === "redundant_duplicate" &&
    params.profile.actionGatedUtility
      ? [
          "non_additive_utility_duplicate",
          "action_gated_utility_already_installed",
        ]
      : []),
    ...(params.duplicateRole !== "none" &&
    params.duplicateRole !== "redundant_duplicate"
      ? [`why_duplicate_install_allowed:${params.duplicateRole}`]
      : []),
    ...(params.handBufferPenalty < 0
      ? ["duplicate_install_reduces_damage_buffer"]
      : []),
    ...(params.profile.damagePrevention || params.profile.handSizeSupport
      ? ["why_support_over_duplicate_breaker:damage_or_hand_buffer"]
      : []),
    ...(params.capabilityDelta === "cumulative_capacity"
      ? ["why_cumulative_copy_still_useful:bounded_diminishing_returns"]
      : []),
  ];
}

function runnerHasRiskyInstalledBreaker(input: AiDecisionInput): boolean {
  return (input.playerView.own.rig ?? []).some((card) =>
    persistentFunctionalProfileForCard(card, signalsForCard(card, []).text)
      .riskyBreaker,
  );
}

function runnerVisibleRemoteScoreThreat(input: AiDecisionInput): boolean {
  return input.playerView.servers.some(
    (server) =>
      server.id.startsWith("remote_") &&
      server.root.some(
        (card) =>
          card.known &&
          (card.type === "agenda" ||
            card.advancementRequirement !== undefined ||
            (card.advancementCounters ?? 0) > 0),
      ),
  );
}

function runnerUsefulProgramsInHandForPersistent(input: AiDecisionInput): number {
  return input.playerView.own.gripOrHq.filter(
    (card) =>
      card.known !== false &&
      card.type === "program" &&
      (visibleOrRuntimeNumber(card, "memoryCost") ?? 0) > 0,
  ).length;
}

function actionMatchesCard(action: LegalAction, card: VisibleCard): boolean {
  if (action.side !== "runner") return false;
  if (
    action.type !== "install_card" &&
    action.type !== "play_event" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return false;
  }
  const payload = action.payload ?? {};
  return (
    action.source === card.instanceId ||
    payload.cardId === card.instanceId ||
    payload.sourceCardId === card.instanceId ||
    payload.sourceDefinitionId === card.definitionId ||
    payload.cardDefinitionId === card.definitionId ||
    payload.targetCardDefinitionId === card.definitionId
  );
}

function candidateMatchesCard(
  candidate: ActionSemanticCandidate,
  card: VisibleCard,
): boolean {
  return (
    candidate.actorSide === "runner" &&
    (candidate.sourceCardId === card.instanceId ||
      candidate.sourceCardId === card.definitionId ||
      candidate.legalActionRef.actionId === card.instanceId)
  );
}

function actionCreditCost(action: LegalAction): number | undefined {
  const values = action.costs
    .map((cost) => cost.credits)
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

function visibleOrRuntimeNumber(
  card: VisibleCard,
  key: "installCost" | "cost" | "memoryCost",
): number | undefined {
  const visibleValue = card[key];
  if (typeof visibleValue === "number") return visibleValue;
  if (!card.definitionId) return undefined;
  const runtimeValue = runtimeDefinition(card.definitionId)?.numeric?.[key];
  return typeof runtimeValue === "number" ? runtimeValue : undefined;
}

type RuntimeCardInfo = {
  title?: string;
  type?: string;
  subtypes?: readonly string[];
  text?: string;
  numeric?: Partial<Record<"installCost" | "cost" | "memoryCost", number | null>>;
};

function runtimeDefinition(cardId: string): RuntimeCardInfo | undefined {
  return RUNTIME_CARDS[cardId] as RuntimeCardInfo | undefined;
}

function memoryAvailableFor(
  params: EvaluateRunnerHandDevelopmentParams,
): number | undefined {
  const deckCapabilityMemory =
    params.deckCapabilities?.runner?.memoryProfile.memoryAvailable;
  if (deckCapabilityMemory !== undefined) return deckCapabilityMemory;
  const used = params.input.playerView.own.memoryUsed;
  const limit = params.input.playerView.own.memoryLimit;
  if (used === undefined || limit === undefined) return undefined;
  return Math.max(0, limit - used);
}

function memoryBlocked(context: CardContext): boolean {
  return (
    context.memoryCost !== undefined &&
    context.memoryCost > 0 &&
    context.memoryAvailable !== undefined &&
    context.memoryCost > context.memoryAvailable
  );
}

function looksLikeBreaker(card: VisibleCard, text: string): boolean {
  return (
    card.type === "program" &&
    ((card.subtypes ?? []).some((subtype) =>
      runnerHandTokensIncludeAny(runnerHandTextTokens(subtype), [
        "breaker",
        "icebreaker",
        "fracter",
        "decoder",
        "killer",
      ]),
    ) ||
      runnerHandTextHasBreakerSignal(text))
  );
}

function looksLikeMemorySupport(card: VisibleCard, text: string): boolean {
  return (
    card.memoryLimitBonus !== undefined ||
    runnerHandTextHasMemorySupportSignal(text)
  );
}

function looksLikeBankTool(text: string): boolean {
  return runnerHandTextHasBankToolSignal(text);
}

function looksLikeEconomyTool(text: string): boolean {
  return runnerHandTextHasEconomyToolSignal(text);
}

function looksLikeDrawOrSearch(text: string): boolean {
  return runnerHandTextHasDrawOrSearchSignal(text);
}

function looksLikeDefense(text: string): boolean {
  return runnerHandTextHasDefenseSignal(text);
}

function looksLikeAccessPayoff(text: string): boolean {
  return runnerHandTextHasAccessPayoffSignal(text);
}

function looksLikeRunEvent(card: VisibleCard, text: string): boolean {
  return card.type === "event" && runnerHandTextHasRunEventSignal(text);
}

function looksRepeatUseful(text: string): boolean {
  return runnerHandTextHasRepeatUsefulSignal(text);
}

function looksPotentiallyPlayable(card: VisibleCard, text: string): boolean {
  return (
    card.type === "program" ||
    card.type === "hardware" ||
    card.type === "resource" ||
    card.type === "event" ||
    runnerHandTextHasPlayableSignal(text)
  );
}

function runnerNeedsCoverageFromHand(
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  const matrix = deckCapabilities?.runner?.breakerCoverageMatrix;
  if (!matrix) return false;
  return Object.values(matrix).some((state) => state.inHand && !state.installed);
}

function roleMatchesStrategicIntent(
  role: RunnerHandDevelopmentRole,
  intent: RunnerStrategicIntentProfile | undefined,
): boolean {
  if (!intent) return false;
  if (
    (role === "breaker_or_rig_piece" || role === "memory_support") &&
    (intent.setupEngine.includes("runner.rig_first") ||
      intent.setupEngine.includes("runner.search_breaker_setup"))
  ) {
    return true;
  }
  if (
    (role === "economy_engine" || role === "bank_tool") &&
    intent.setupEngine.includes("runner.economy_setup_before_pressure")
  ) {
    return true;
  }
  if (
    role === "draw_or_search_engine" &&
    (intent.setupEngine.includes("runner.draw_or_search_setup") ||
      intent.setupEngine.includes("runner.search_breaker_setup"))
  ) {
    return true;
  }
  if (
    (role === "access_payoff" || role === "run_event") &&
    (intentHasPressure(intent) || intent.executionStyle === "runner.run_event_tempo")
  ) {
    return true;
  }
  return false;
}

function intentHasPressure(
  intent: RunnerStrategicIntentProfile | undefined,
): boolean {
  return (intent?.pressureVectors.length ?? 0) > 0;
}

function visibleRunnerThreat(input: AiDecisionInput): boolean {
  return (
    (input.playerView.own.tags ?? 0) > 0 ||
    input.playerView.servers.some((server) =>
      server.root.some(
        (card) =>
          card.known &&
          /damage|tag|flatline|trace/i.test(
            [card.title, card.rulesText, card.definitionId]
              .filter(Boolean)
              .join(" "),
          ),
      ),
    )
  );
}

function rolePriority(role: RunnerHandDevelopmentRole): number {
  switch (role) {
    case "breaker_or_rig_piece":
      return 700;
    case "memory_support":
      return 680;
    case "bank_tool":
      return 650;
    case "economy_engine":
      return 640;
    case "access_payoff":
      return 620;
    case "run_event":
      return 580;
    case "draw_or_search_engine":
      return 560;
    case "defense_support":
      return 420;
    case "duplicate_or_low_value":
      return 120;
    case "unknown":
      return 80;
  }
}

function availabilityPriority(
  availability: RunnerHandDevelopmentAvailability,
): number {
  switch (availability) {
    case "legal_now":
      return 90;
    case "missing_credits":
      return -80;
    case "missing_mu":
      return -120;
    case "timing_blocked":
      return -70;
    case "not_relevant_now":
      return -190;
  }
}

function fitPriority(fit: RunnerHandDevelopmentStrategicFit): number {
  switch (fit) {
    case "strong":
      return 120;
    case "medium":
      return 40;
    case "blocked":
      return -20;
    case "weak":
      return -90;
  }
}

function needPriority(need: RunnerHandDevelopmentCurrentNeed): number {
  switch (need) {
    case "acute":
      return 180;
    case "useful_now":
      return 110;
    case "setup":
      return 50;
    case "later":
      return -50;
    case "none":
      return -170;
  }
}

function clampPriority(value: number): number {
  return Math.max(0, Math.min(1000, value));
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
