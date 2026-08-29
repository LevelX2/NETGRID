import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate";
import type {
  BreakerCapability,
  BreakerCoverageKind,
  DeckCapabilityProfile,
} from "../../deck-capabilities";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
import { AI_HINTS_BY_CARD, RUNTIME_CARDS } from "../../ai-hints";
import { randomBreakOrDamageRiskProfileForDefinitionId } from "../../actions/risk-action-projection";
import { persistentDevelopmentActionProjection } from "../../actions/persistent-development-action";
import { actionClickCost } from "../../runtime/action-cost";
import { runnerRestrictedRunCreditProfile } from "../../runtime/runner-canonical-card-facts";
import {
  runnerHintProvidesDamagePrevention,
  runnerHintProvidesExposeInformation,
  runnerHintProvidesMultiaccess,
  runnerHintProvidesNonNoisyBreakerCredits,
  runnerHintProvidesSearch,
  runnerHintProvidesTopTrashRecovery,
} from "../../runner-canonical-hint-semantics";
import type {
  BreakerVariantAssessment,
  CardContext,
  CardSignals,
  PersistentFunctionalProfile,
} from "./runner-hand-development-internal-types";
import type {
  EvaluateRunnerHandDevelopmentParams,
  RunnerHandDevelopmentAvailability,
  RunnerHandDevelopmentCurrentNeed,
  RunnerHandDevelopmentDeferReason,
  RunnerHandDevelopmentEvaluation,
  RunnerHandDevelopmentRole,
  RunnerHandDevelopmentStrategicFit,
  RunnerPersistentInstallCapabilityDelta,
  RunnerPersistentInstallDuplicateRole,
  RunnerPersistentEngineAssessment,
  RunnerPersistentEngineCapability,
  RunnerPersistentEngineConsumptionBlocker,
  RunnerPersistentEngineKind,
  RunnerPersistentDeckReplacementAssessment,
  RunnerPersistentInstallEvaluation,
  RunnerPersistentInstallStackabilityClass,
} from "./runner-hand-development-types";
import {
  runnerHandTextHasAbsoluteLinkSignal,
  runnerHandTextHasAccessPayoffSignal,
  runnerHandTextHasActionEconomySignal,
  runnerHandTextHasApCoverageSignal,
  runnerHandTextHasBankToolSignal,
  runnerHandTextHasBreakerStrengthSupportSignal,
  runnerHandTextHasCodeGateCoverageSignal,
  runnerHandTextHasDefenseSignal,
  runnerHandTextHasDrawOrSearchSignal,
  runnerHandTextHasEconomyToolSignal,
  runnerHandTextHasHandSizeSignal,
  runnerHandTextHasHiddenZoneSearchSignal,
  runnerHandTextHasIceStrengthReductionSignal,
  runnerHandTextHasIceSubroutineBreakSignal,
  runnerHandTextHasMemorySupportSignal,
  runnerHandTextHasPlayableSignal,
  runnerHandTextHasRepeatUsefulSignal,
  runnerHandTextHasRiskyBreakerSignal,
  runnerHandTextHasRunEventSignal,
  runnerHandTextHasSentryCoverageSignal,
  runnerHandTextHasTemporaryCounterSignal,
  runnerHandTextHasTraceCoverageSignal,
  runnerHandTextHasVisibleThreatSignal,
  runnerHandTextHasWallCoverageSignal,
  runnerHandTextTokens,
  runnerHandTokensIncludeAny,
  runnerHandTokensIncludeInOrder,
} from "./runner-hand-text-signals";

export function signalsForCard(
  card: VisibleCard,
  candidates: readonly ActionSemanticCandidate[],
): CardSignals {
  const definition = card.definitionId
    ? runtimeDefinition(card.definitionId)
    : undefined;
  const hint = card.definitionId
    ? AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  const roles = sortedUnique([...(hint?.roles ?? [])]);
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
  const effectTargets = sortedUnique([
    ...candidates.flatMap((candidate) => candidate.effectTargets ?? []),
    ...((hint?.effects ?? []) as readonly Record<string, unknown>[])
      .map((effect) => effect.target)
      .filter((target): target is string => typeof target === "string"),
  ]);
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
  const requiresSameTurnAccess =
    (hint?.effects ?? []).some((effect) => effect.timing === "on_access") &&
    [card.rulesText, definition?.text].some(
      (rulesText) =>
        typeof rulesText === "string" && /\bthis turn\b/i.test(rulesText),
    );
  const requiresHostedIcebreaker =
    (hint?.effects ?? []).some((effect) => {
      const record = effect as unknown as Record<string, unknown>;
      return record.kind === "program_host" && record.target === "icebreaker";
    }) ||
    (hint?.targetProfiles ?? []).some((profile) => {
      const record = profile as unknown as Record<string, unknown>;
      return (
        record.kind === "hosted_install_target" &&
        record.targetType === "icebreaker"
      );
    });
  return {
    text,
    roles,
    planRoles,
    functionSignals: sortedUnique([...(hint?.functionSignals ?? [])]),
    candidateSignals,
    effectTargets,
    structuredEffects: [...(hint?.effects ?? [])],
    requiresSameTurnAccess,
    requiresHostedIcebreaker,
  };
}

export function hostableIcebreakerAvailableAfterInstall(
  input: AiDecisionInput,
  hostCard: VisibleCard,
  hostInstallAction: LegalAction | undefined,
): boolean {
  if (!hostInstallAction) return false;
  const remainingClicks =
    input.playerView.own.clicks - actionClickCost(hostInstallAction);
  if (remainingClicks < 1) return false;
  const remainingCredits =
    input.playerView.own.credits - (actionCreditCost(hostInstallAction) ?? 0);
  if (remainingCredits < 0) return false;
  return input.playerView.own.gripOrHq.some((candidate) => {
    if (
      candidate.instanceId === hostCard.instanceId ||
      candidate.known === false
    ) {
      return false;
    }
    const candidateText = signalsForCard(candidate, []).text;
    if (!looksLikeBreaker(candidate, candidateText)) return false;
    const installCost =
      visibleOrRuntimeNumber(candidate, "installCost") ??
      visibleOrRuntimeNumber(candidate, "cost") ??
      0;
    return installCost <= remainingCredits;
  });
}

export function persistentFunctionalProfileForCard(
  card: VisibleCard,
  text: string,
): PersistentFunctionalProfile {
  const breakerCoverage = breakerCoverageForPersistentCard(card, text);
  const randomBreakOrDamageProfile =
    randomBreakOrDamageRiskProfileForDefinitionId(card.definitionId);
  const hint = card.definitionId
    ? AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  const riskyBreaker =
    breakerCoverage.length > 0 &&
    (randomBreakOrDamageProfile !== undefined ||
      runnerHandTextHasRiskyBreakerSignal(text));
  const damagePrevention = runnerHintProvidesDamagePrevention(hint);
  const handSizeSupport = runnerHandTextHasHandSizeSignal(text);
  const memorySupport = looksLikeMemorySupport(card, text);
  const breakerStrengthSupport =
    runnerHandTextHasBreakerStrengthSupportSignal(text);
  const iceStrengthReduction =
    runnerHandTextHasIceStrengthReductionSignal(text);
  const restrictedRunCreditProfile = runnerRestrictedRunCreditProfile(
    card.definitionId,
  );
  const recurringBreakerEconomy =
    restrictedRunCreditProfile !== undefined ||
    runnerHintProvidesNonNoisyBreakerCredits(hint);
  const runOnlyEconomyPool = cardHasRunOnlyEconomyPool(card);
  const bankTool = !runOnlyEconomyPool && looksLikeBankTool(text);
  const economyTool =
    !runOnlyEconomyPool &&
    breakerCoverage.length === 0 &&
    looksLikeEconomyTool(text);
  const actionEconomy = runnerHandTextHasActionEconomySignal(text);
  const accessSupport =
    hint?.planRoles?.includes("information") === true ||
    runnerHintProvidesExposeInformation(hint) ||
    runnerHintProvidesMultiaccess(hint) ||
    looksLikeAccessPayoff(text);
  const searchSupport =
    runnerHintProvidesSearch(hint) ||
    runnerHintProvidesTopTrashRecovery(hint) ||
    looksLikeDrawOrSearch(text);
  const exclusiveHardwareDeck = Boolean(
    card.type === "hardware" &&
    (hint?.effects?.some(
      (effect) =>
        effect.kind === "hardware_trait" &&
        effect.timing === "persistent" &&
        effect.target === "deck_exclusive",
    ) === true ||
      hint?.functionSignals?.includes("setup.deck_exclusive") === true ||
      hint?.requiredMechanics?.includes("deck_unique_replacement") === true ||
      card.subtypes?.some((subtype) => subtype.toLowerCase() === "deck") ===
        true),
  );
  const persistentEngine = persistentEngineProfileForCard(card);
  const nonAdditiveUtilityFamilies = sortedUnique([
    ...nonAdditiveUtilityFamiliesForPersistentCard(card, text),
    ...(persistentEngine.coverage &&
    persistentEngine.kind !== "delayed_install_engine"
      ? [persistentEngine.coverage]
      : []),
  ]);
  const actionGatedUtility =
    nonAdditiveUtilityFamilies.length > 0 || actionEconomy;
  const absoluteNonStackable =
    runnerHandTextHasAbsoluteLinkSignal(text) &&
    !runnerHandTextHasTemporaryCounterSignal(text);
  const functionalCoverage = sortedUnique([
    ...(persistentEngine.coverage ? [persistentEngine.coverage] : []),
    ...breakerCoverage.map((coverage) => `breaker:${coverage}`),
    ...nonAdditiveUtilityFamilies,
    ...(memorySupport ? ["memory"] : []),
    ...(breakerStrengthSupport ? ["breaker_strength_support"] : []),
    ...(iceStrengthReduction ? ["ice_strength_reduction"] : []),
    ...(recurringBreakerEconomy ? ["breaker_recurring_economy"] : []),
    ...(damagePrevention ? ["damage_prevention"] : []),
    ...(handSizeSupport ? ["hand_size"] : []),
    ...(bankTool ? ["bank_tool"] : []),
    ...(economyTool ? ["economy_engine"] : []),
    ...(actionEconomy ? ["action_economy"] : []),
    ...(accessSupport ? ["access_support"] : []),
    ...(searchSupport ? ["search_support"] : []),
    ...(absoluteNonStackable ? ["absolute_link"] : []),
  ]);
  const primaryGroups = persistentEngine.coverage
    ? [persistentEngine.coverage]
    : functionalCoverage.length > 0
      ? functionalCoverage
      : [`type:${card.type ?? "unknown"}`];
  return {
    persistentEngineKind: persistentEngine.kind,
    persistentEngineCapabilities: persistentEngine.outputCapabilities,
    persistentEngineRepeatable: persistentEngine.repeatable,
    persistentEngineConsumptionBlockers: persistentEngine.consumptionBlockers,
    ...(persistentEngine.coverage
      ? { persistentEngineCoverage: persistentEngine.coverage }
      : {}),
    exclusiveHardwareDeck,
    functionalCoverage,
    primaryGroups,
    nonAdditiveUtilityFamilies,
    breakerCoverage,
    riskyBreaker,
    ...(randomBreakOrDamageProfile
      ? {
          randomBreakOrDamageProfileId: randomBreakOrDamageProfile.profileId,
          randomBreakSuccessProbabilityPerAttempt:
            randomBreakOrDamageProfile.successProbabilityPerAttempt,
          randomBreakMaxSingleFailureDamage:
            randomBreakOrDamageProfile.maxSingleFailureDamage,
        }
      : {}),
    damagePrevention,
    handSizeSupport,
    memorySupport,
    breakerStrengthSupport,
    iceStrengthReduction,
    recurringBreakerEconomy,
    restrictedRunCreditUses: [...(restrictedRunCreditProfile?.uses ?? [])],
    bankTool,
    accessSupport,
    searchSupport,
    actionGatedUtility,
    absoluteNonStackable,
  };
}

export function persistentDeckReplacementAssessment(params: {
  candidateCard: VisibleCard;
  candidateProfile: PersistentFunctionalProfile;
  installed: readonly {
    card: VisibleCard;
    profile: PersistentFunctionalProfile;
  }[];
}): RunnerPersistentDeckReplacementAssessment {
  const sameDefinitionInstalled = params.installed.some(
    ({ card }) =>
      params.candidateCard.definitionId !== undefined &&
      card.definitionId === params.candidateCard.definitionId,
  );
  const conflicting = params.installed.filter(
    ({ card, profile }) =>
      profile.exclusiveHardwareDeck &&
      card.definitionId !== params.candidateCard.definitionId,
  );
  const conflictingDefinitionIds = sortedUnique(
    conflicting
      .map(({ card }) => card.definitionId)
      .filter(
        (definitionId): definitionId is string => definitionId !== undefined,
      ),
  );
  const unassessedDefinitionIds = sortedUnique(
    conflicting
      .filter(({ profile }) => profile.functionalCoverage.length === 0)
      .map(({ card }) => card.definitionId)
      .filter(
        (definitionId): definitionId is string => definitionId !== undefined,
      ),
  );
  let status: RunnerPersistentDeckReplacementAssessment["status"];
  let admitted: boolean;
  let gainedFunctionalCoverage: string[] = [];
  let lostFunctionalCoverage: string[] = [];
  if (!params.candidateProfile.exclusiveHardwareDeck) {
    status = "not_applicable";
    admitted = true;
  } else if (sameDefinitionInstalled) {
    status = "already_satisfied";
    admitted = false;
  } else if (conflicting.length === 0) {
    status = "no_conflict";
    admitted = true;
  } else if (unassessedDefinitionIds.length > 0) {
    status = "blocked_unvalued_loss";
    admitted = false;
  } else {
    const conflictingCards = new Set(
      conflicting.map(({ card }) => card.instanceId),
    );
    const coverageBefore = sortedUnique(
      params.installed.flatMap(({ profile }) => profile.functionalCoverage),
    );
    const coverageAfter = sortedUnique([
      ...params.installed
        .filter(({ card }) => !conflictingCards.has(card.instanceId))
        .flatMap(({ profile }) => profile.functionalCoverage),
      ...params.candidateProfile.functionalCoverage,
    ]);
    gainedFunctionalCoverage = coverageAfter.filter(
      (coverage) => !coverageBefore.includes(coverage),
    );
    lostFunctionalCoverage = coverageBefore.filter(
      (coverage) => !coverageAfter.includes(coverage),
    );
    if (
      gainedFunctionalCoverage.length > 0 &&
      lostFunctionalCoverage.length === 0
    ) {
      status = "positive_upgrade";
      admitted = true;
    } else if (
      gainedFunctionalCoverage.length === 0 &&
      lostFunctionalCoverage.length === 0
    ) {
      status = "already_satisfied";
      admitted = false;
    } else {
      status = "blocked_unvalued_loss";
      admitted = false;
    }
  }
  return {
    status,
    admitted,
    conflictingDefinitionIds,
    unassessedDefinitionIds,
    gainedFunctionalCoverage,
    lostFunctionalCoverage,
    evidence: [
      `deck_replacement_status:${status}`,
      `deck_replacement_admitted:${admitted}`,
      `deck_replacement_conflicts:${conflictingDefinitionIds.join("|") || "none"}`,
      `deck_replacement_unassessed:${unassessedDefinitionIds.join("|") || "none"}`,
      `deck_replacement_gained_coverage:${gainedFunctionalCoverage.join("|") || "none"}`,
      `deck_replacement_lost_coverage:${lostFunctionalCoverage.join("|") || "none"}`,
    ],
  };
}

type PersistentEngineProfile = {
  kind: RunnerPersistentEngineKind;
  outputCapabilities: RunnerPersistentEngineCapability[];
  repeatable: boolean;
  consumptionBlockers: RunnerPersistentEngineConsumptionBlocker[];
  coverage?: string;
};

export function persistentEngineProfileForCard(
  card: VisibleCard,
): PersistentEngineProfile {
  if (
    !["program", "hardware", "resource"].includes(card.type ?? "") ||
    !card.definitionId
  ) {
    return emptyPersistentEngineProfile();
  }
  const hint = AI_HINTS_BY_CARD.get(card.definitionId);
  if (!hint) return emptyPersistentEngineProfile();
  const consumptionBlockers = sortedUnique([
    ...(hint.roles.some((role) => role === "self_trash")
      ? ["role:self_trash"]
      : []),
    ...(hint.riskTags?.some((risk) =>
      ["self_trash", "trash_source"].includes(risk),
    )
      ? ["risk:self_trash"]
      : []),
    ...(hint.requiredMechanics?.includes("trash_source")
      ? ["mechanic:trash_source"]
      : []),
    ...(hint.requiredMechanics?.includes("source_counter_cost")
      ? ["mechanic:source_counter_cost"]
      : []),
    ...(hint.requiredMechanics?.some((mechanic) =>
      ["once_per_game", "once_per_game_limit"].includes(mechanic),
    )
      ? ["mechanic:once_per_game"]
      : []),
  ]) as RunnerPersistentEngineConsumptionBlocker[];
  const delayedInstallEngine = hint.effects?.some(
    (effect) =>
      effect.kind === "install" &&
      effect.timing === "persistent" &&
      effect.target === "setup.install_countdown" &&
      effect.repeatable === true,
  );
  if (delayedInstallEngine && consumptionBlockers.length === 0) {
    return {
      kind: "delayed_install_engine",
      outputCapabilities: ["install"],
      repeatable: true,
      consumptionBlockers,
      coverage: "persistent_engine:delayed_install",
    };
  }
  const repeatableActionCapability = hint.actionCapabilitySemantics
    ?.map((capability) => ({
      outputCapabilities: sortedUnique(
        (capability.effects ?? [])
          .filter((effect) => effect.timing === "action")
          .map(persistentActionOutputCapability)
          .filter(
            (output): output is RunnerPersistentEngineCapability =>
              output !== undefined,
          ),
      ) as RunnerPersistentEngineCapability[],
    }))
    .find(
      ({ outputCapabilities }) =>
        outputCapabilities.length >= 2 &&
        (hint.costProfile?.clicks ?? 0) >= 1 &&
        hint.requiredMechanics?.includes("activated") === true &&
        hint.requiredMechanics.includes("take_click_ability"),
    );
  if (repeatableActionCapability && consumptionBlockers.length === 0) {
    const outputCapabilities = repeatableActionCapability.outputCapabilities;
    return {
      kind: "multi_output_action_engine",
      outputCapabilities,
      repeatable: true,
      consumptionBlockers,
      coverage: `persistent_engine:multi_output_action:${outputCapabilities.join("+")}`,
    };
  }
  const successfulRunFollowup = hint.effects?.find(
    (effect) =>
      effect.kind === "future_run_effect" &&
      effect.timing === "after_successful_run" &&
      effect.target === "make_run" &&
      effect.repeatable === true &&
      hint.conditions?.some(
        (condition) => condition.kind === "requires_successful_run",
      ) === true,
  );
  if (successfulRunFollowup && consumptionBlockers.length === 0) {
    return {
      kind: "successful_run_followup_engine",
      outputCapabilities: ["conditional_run"],
      repeatable: true,
      consumptionBlockers,
      coverage: "persistent_engine:successful_run_followup",
    };
  }
  return {
    ...emptyPersistentEngineProfile(),
    consumptionBlockers,
  };
}

function emptyPersistentEngineProfile(): PersistentEngineProfile {
  return {
    kind: "none",
    outputCapabilities: [],
    repeatable: false,
    consumptionBlockers: [],
  };
}

function persistentActionOutputCapability(effect: {
  kind: string;
  resource?: string;
}): RunnerPersistentEngineCapability | undefined {
  if (
    effect.resource === "credits" ||
    effect.kind === "economy" ||
    effect.kind === "action_economy"
  ) {
    return "credits";
  }
  if (effect.resource === "cards" || effect.kind === "draw") return "cards";
  return undefined;
}

export function persistentEngineAssessmentForInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  installedSameDefinitionCount: number;
  installedSameFunctionalGroupCount: number;
}): RunnerPersistentEngineAssessment {
  const { profile } = params;
  const alreadySatisfied =
    profile.persistentEngineKind !== "none" &&
    profile.persistentEngineKind !== "delayed_install_engine" &&
    (params.installedSameDefinitionCount > 0 ||
      params.installedSameFunctionalGroupCount > 0);
  const setupEngine = new Set(params.params.strategicIntent?.setupEngine ?? []);
  const delayedInstallDoctrine = runnerHasDelayedInstallDoctrine(params.params);
  const delayedInstallVisibleDemand = runnerDelayedInstallDemandCount(
    params.params.input,
  );
  const delayedInstallStagedShellCounters = runnerStagedShellCounterDemand(
    params.params.input,
  );
  const deckCompatible =
    profile.persistentEngineKind === "delayed_install_engine"
      ? delayedInstallDoctrine ||
        delayedInstallVisibleDemand > 0 ||
        delayedInstallStagedShellCounters > 0
      : profile.persistentEngineKind === "multi_output_action_engine"
        ? setupEngine.has("runner.economy_setup_before_pressure") ||
          setupEngine.has("runner.draw_or_search_setup") ||
          setupEngine.has("runner.search_breaker_setup")
        : profile.persistentEngineKind === "successful_run_followup_engine"
          ? intentHasPressure(params.params.strategicIntent) ||
            params.params.strategicIntent?.executionStyle ===
              "runner.run_event_tempo"
          : false;
  const readiness =
    profile.persistentEngineKind === "none"
      ? "not_applicable"
      : profile.persistentEngineConsumptionBlockers.length > 0 ||
          !profile.persistentEngineRepeatable
        ? "blocked"
        : alreadySatisfied
          ? "already_satisfied"
          : profile.persistentEngineKind === "delayed_install_engine" &&
              !deckCompatible
            ? "blocked"
            : profile.persistentEngineKind ===
                  "successful_run_followup_engine" && !deckCompatible
              ? "blocked"
              : profile.persistentEngineKind ===
                    "successful_run_followup_engine" &&
                  runnerNeedsCoverageFromHand(params.params.deckCapabilities)
                ? "setup"
                : deckCompatible
                  ? "ready_now"
                  : "setup";
  return {
    kind: profile.persistentEngineKind,
    readiness,
    outputCapabilities: profile.persistentEngineCapabilities,
    repeatable: profile.persistentEngineRepeatable,
    consumptionBlockers: profile.persistentEngineConsumptionBlockers,
    deckCompatible,
    alreadySatisfied,
    evidence: [
      `persistent_engine_kind:${profile.persistentEngineKind}`,
      `persistent_engine_readiness:${readiness}`,
      `persistent_engine_outputs:${profile.persistentEngineCapabilities.join("|") || "none"}`,
      `persistent_engine_repeatable:${profile.persistentEngineRepeatable}`,
      `persistent_engine_consumption_blockers:${profile.persistentEngineConsumptionBlockers.join("|") || "none"}`,
      `persistent_engine_deck_compatible:${deckCompatible}`,
      `persistent_engine_already_satisfied:${alreadySatisfied}`,
      ...(profile.persistentEngineKind === "delayed_install_engine"
        ? [
            `delayed_install_doctrine:${delayedInstallDoctrine}`,
            `delayed_install_visible_demand:${delayedInstallVisibleDemand}`,
            `delayed_install_staged_shell_counters:${delayedInstallStagedShellCounters}`,
          ]
        : []),
    ],
  };
}

function cardHasRunOnlyEconomyPool(card: VisibleCard): boolean {
  if (runnerRestrictedRunCreditProfile(card.definitionId)) return true;
  const hint = card.definitionId
    ? AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  return Boolean(
    hint?.effects?.some(
      (effect) =>
        effect.kind === "finite_economy_pool" &&
        effect.timing === "during_run" &&
        effect.target === "run_credit_pool",
    ),
  );
}

export function structuredHintSignals(hint: {
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

export function nonAdditiveUtilityFamiliesForPersistentCard(
  card: VisibleCard,
  text: string,
): string[] {
  if (card.type !== "resource") return [];
  const families = new Set<string>();
  const hint = card.definitionId
    ? AI_HINTS_BY_CARD.get(card.definitionId)
    : undefined;
  const recovery = runnerHintProvidesTopTrashRecovery(hint);
  const searchEffects = hint?.effects?.filter(
    (effect) => effect.kind === "search",
  );
  const programSearch =
    searchEffects?.some((effect) => effect.target?.includes("program")) ??
    false;
  const stackSearch =
    searchEffects?.some((effect) => effect.scope === "stack") ?? false;
  const hiddenZoneSearch = runnerHandTextHasHiddenZoneSearchSignal(text);

  if (recovery) families.add("non_additive_utility:recovery");
  if (programSearch) families.add("non_additive_utility:program_search");
  if (stackSearch) families.add("non_additive_utility:stack_search");
  if (hiddenZoneSearch) families.add("non_additive_utility:hidden_zone_search");
  if (families.size > 0)
    families.add("non_additive_utility:action_gated_search");
  return [...families].sort();
}

export function breakerCoverageForPersistentCard(
  card: VisibleCard,
  text: string,
): BreakerCoverageKind[] {
  if (!looksLikeBreaker(card, text)) return [];
  const coverage = new Set<BreakerCoverageKind>();
  if (runnerHandTextHasWallCoverageSignal(text)) coverage.add("wall");
  if (runnerHandTextHasCodeGateCoverageSignal(text)) coverage.add("code_gate");
  if (runnerHandTextHasSentryCoverageSignal(text)) coverage.add("sentry");
  if (runnerHandTextHasApCoverageSignal(text)) coverage.add("ap");
  if (runnerHandTextHasTraceCoverageSignal(text)) coverage.add("trace");
  if (runnerHandTextHasIceSubroutineBreakSignal(text)) {
    coverage.add(coverage.size > 0 ? "subtype_limited" : "universal");
  }
  if (coverage.size === 0) coverage.add("special");
  return [...coverage].sort();
}

export function persistentCoverageAlreadyPresent(
  coverage: string,
  existingFunctionalCoverage: readonly string[],
): boolean {
  const existingCoverage = new Set(existingFunctionalCoverage);
  if (!coverage.startsWith("breaker:")) {
    return existingCoverage.has(coverage);
  }
  if (existingCoverage.has(coverage)) return true;
  const coverageKind = coverage.slice("breaker:".length);
  if (coverageKind === "subtype_limited") {
    return existingFunctionalCoverage.some(
      (existing) =>
        existing.startsWith("breaker:") && existing !== "breaker:special",
    );
  }
  return (
    coverageKind !== "universal" && existingCoverage.has("breaker:universal")
  );
}

export function persistentProfilesOverlap(
  candidate: PersistentFunctionalProfile,
  installed: PersistentFunctionalProfile,
): boolean {
  if (
    candidate.nonAdditiveUtilityFamilies.length > 0 &&
    installed.nonAdditiveUtilityFamilies.length > 0
  ) {
    return nonAdditiveUtilityProfilesOverlap(candidate, installed);
  }
  if (
    candidate.breakerCoverage.length > 0 &&
    installed.breakerCoverage.length > 0 &&
    breakerCoverageOverlaps(
      candidate.breakerCoverage,
      installed.breakerCoverage,
    )
  ) {
    return true;
  }
  const installedPrimaryGroups = new Set(installed.primaryGroups);
  return candidate.primaryGroups.some((group) =>
    installedPrimaryGroups.has(group),
  );
}

export function nonAdditiveUtilityProfilesOverlap(
  candidate: PersistentFunctionalProfile,
  installed: PersistentFunctionalProfile,
): boolean {
  const genericFamily = "non_additive_utility:action_gated_search";
  const candidateSpecificFamilies = candidate.nonAdditiveUtilityFamilies.filter(
    (family) => family !== genericFamily,
  );
  const installedSpecificFamilies = new Set(
    installed.nonAdditiveUtilityFamilies.filter(
      (family) => family !== genericFamily,
    ),
  );
  if (
    candidateSpecificFamilies.length > 0 &&
    installedSpecificFamilies.size > 0
  ) {
    return candidateSpecificFamilies.some((family) =>
      installedSpecificFamilies.has(family),
    );
  }
  const installedFamilies = new Set(installed.nonAdditiveUtilityFamilies);
  return candidate.nonAdditiveUtilityFamilies.some((family) =>
    installedFamilies.has(family),
  );
}

export function hasInstalledNonAdditiveUtilityOverlap(
  candidate: PersistentFunctionalProfile,
  installedProfiles: readonly PersistentFunctionalProfile[],
): boolean {
  return installedProfiles.some((installed) =>
    nonAdditiveUtilityProfilesOverlap(candidate, installed),
  );
}

export function breakerCoverageOverlaps(
  left: readonly BreakerCoverageKind[],
  right: readonly BreakerCoverageKind[],
): boolean {
  const leftCoverage = new Set(left);
  const rightCoverage = new Set(right);
  if (leftCoverage.has("universal") || rightCoverage.has("universal")) {
    return true;
  }
  return left.some((coverage) => rightCoverage.has(coverage));
}

export function breakerVariantAssessment(
  params: EvaluateRunnerHandDevelopmentParams,
  card: VisibleCard,
  profile: PersistentFunctionalProfile,
): BreakerVariantAssessment {
  const inventory = params.deckCapabilities?.runner?.breakerInventory;
  const matrix = params.deckCapabilities?.runner?.breakerCoverageMatrix;
  const candidate = card.definitionId
    ? inventory?.find((entry) => entry.cardId === card.definitionId)
    : undefined;
  const installedCapabilities = (params.input.playerView.own.rig ?? [])
    .filter((installed) => installed.known !== false && installed.definitionId)
    .filter((installed) => {
      const installedProfile = persistentFunctionalProfileForCard(
        installed,
        signalsForCard(installed, []).text,
      );
      return concreteBreakerCoverageOverlaps(
        profile.breakerCoverage,
        installedProfile.breakerCoverage,
      );
    })
    .map((installed) =>
      inventory?.find((entry) => entry.cardId === installed.definitionId),
    )
    .filter((entry): entry is BreakerCapability => entry !== undefined);
  const advantages = candidate
    ? sortedUnique(
        installedCapabilities.flatMap((installed) =>
          breakerVariantAdvantages(candidate, installed),
        ),
      )
    : [];
  const strategyAligned =
    params.strategicIntent?.confidence !== "low" &&
    (params.strategicIntent?.setupEngine.includes("runner.rig_first") ===
      true ||
      params.strategicIntent?.setupEngine.includes(
        "runner.search_breaker_setup",
      ) === true);
  const deckContainsIntentionalPair =
    (candidate?.quantityKnownInDeck ?? 0) > 0 &&
    installedCapabilities.some(
      (installed) =>
        installed.cardId !== candidate?.cardId &&
        installed.quantityKnownInDeck > 0,
    );
  const pendingPrimaryCoverage = matrix
    ? (["wall", "code_gate", "sentry"] as const).filter((coverage) => {
        const state = matrix[coverage];
        return (
          !state.installed &&
          (state.inHand || state.inDeckKnown) &&
          !profile.breakerCoverage.includes(coverage)
        );
      })
    : [];
  const blockers = sortedUnique([
    ...(profile.breakerCoverage.length === 0 ? ["candidate_not_breaker"] : []),
    ...(!candidate ? ["candidate_missing_from_deck_inventory"] : []),
    ...(installedCapabilities.length === 0
      ? ["no_overlapping_installed_breaker_profile"]
      : []),
    ...(!deckContainsIntentionalPair
      ? ["deck_does_not_express_breaker_pair"]
      : []),
    ...(!strategyAligned ? ["strategy_does_not_support_rig_variants"] : []),
    ...(advantages.length === 0 ? ["no_concrete_variant_advantage"] : []),
    ...pendingPrimaryCoverage.map(
      (coverage) => `primary_coverage_not_installed:${coverage}`,
    ),
  ]);
  return {
    supported: blockers.length === 0,
    advantages,
    blockers,
    evidence: [
      `breaker_variant_supported:${blockers.length === 0}`,
      `breaker_variant_advantages:${advantages.join(",") || "none"}`,
      `breaker_variant_blockers:${blockers.join(",") || "none"}`,
      `breaker_variant_deck_pair:${deckContainsIntentionalPair}`,
      `breaker_variant_strategy_aligned:${strategyAligned}`,
    ],
  };
}

export function concreteBreakerCoverageOverlaps(
  left: readonly BreakerCoverageKind[],
  right: readonly BreakerCoverageKind[],
): boolean {
  if (left.includes("universal") || right.includes("universal")) return true;
  const concrete = new Set<BreakerCoverageKind>([
    "wall",
    "code_gate",
    "sentry",
    "ap",
    "trace",
  ]);
  return left.some(
    (coverage) => concrete.has(coverage) && right.includes(coverage),
  );
}

export function breakerVariantAdvantages(
  candidate: BreakerCapability,
  installed: BreakerCapability,
): string[] {
  return [
    ...(lowerKnownValue(candidate.breakCost, installed.breakCost)
      ? ["lower_break_cost"]
      : []),
    ...(lowerKnownValue(candidate.pumpCost, installed.pumpCost)
      ? ["lower_pump_cost"]
      : []),
    ...(higherKnownValue(candidate.baseStrength, installed.baseStrength)
      ? ["higher_base_strength"]
      : []),
    ...(candidate.risks.length < installed.risks.length ? ["lower_risk"] : []),
    ...(candidate.restrictions.length < installed.restrictions.length
      ? ["fewer_restrictions"]
      : []),
  ];
}

export function lowerKnownValue(
  candidate: number | undefined,
  installed: number | undefined,
): boolean {
  return (
    candidate !== undefined && installed !== undefined && candidate < installed
  );
}

export function higherKnownValue(
  candidate: number | undefined,
  installed: number | undefined,
): boolean {
  return (
    candidate !== undefined && installed !== undefined && candidate > installed
  );
}

export function stackabilityClassForPersistentInstall(
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
  if (profile.persistentEngineKind === "delayed_install_engine") {
    return "cumulative_capacity";
  }
  if (profile.persistentEngineKind !== "none") return "synergy_support";
  if (
    persistentInstallImprovesRandomBreakProbability(profile, installedProfiles)
  ) {
    return "risk_mitigation";
  }
  if (persistentInstallReducesRisk(profile, installedProfiles)) {
    return "risk_mitigation";
  }
  if (
    profile.memorySupport ||
    profile.damagePrevention ||
    profile.handSizeSupport
  ) {
    return "cumulative_capacity";
  }
  if (
    profile.breakerStrengthSupport ||
    profile.iceStrengthReduction ||
    profile.recurringBreakerEconomy
  ) {
    return "cumulative_capacity";
  }
  if (profile.bankTool) return "action_bank_parallel";
  if (profile.accessSupport || profile.searchSupport) return "synergy_support";
  if (profile.breakerCoverage.length > 0) {
    return installedSameDefinitionCount > 0 ||
      installedSameFunctionalGroupCount > 0
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

export function capabilityDeltaForPersistentInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  installedProfiles: readonly PersistentFunctionalProfile[];
  existingFunctionalCoverage: readonly string[];
  newFunctionalCoverage: readonly string[];
  stackabilityClass: RunnerPersistentInstallStackabilityClass;
  installedSameDefinitionCount: number;
  installedSameFunctionalGroupCount: number;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  breakerVariant: BreakerVariantAssessment;
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
    persistentInstallImprovesRandomBreakProbability(
      params.profile,
      params.installedProfiles,
    )
  ) {
    return "risk_reduction";
  }
  if (persistentInstallReducesRisk(params.profile, params.installedProfiles)) {
    return "risk_reduction";
  }
  if (params.newFunctionalCoverage.length > 0) {
    if (
      params.profile.breakerStrengthSupport ||
      params.profile.iceStrengthReduction
    ) {
      return "cost_upgrade";
    }
    if (params.profile.recurringBreakerEconomy) {
      return "cumulative_capacity";
    }
    if (
      params.profile.memorySupport ||
      params.profile.damagePrevention ||
      params.profile.handSizeSupport
    ) {
      return "cumulative_capacity";
    }
    return "new_coverage";
  }
  if (params.breakerVariant.supported) return "cost_upgrade";
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

export function duplicateRoleForPersistentInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  installedProfiles: readonly PersistentFunctionalProfile[];
  capabilityDelta: RunnerPersistentInstallCapabilityDelta;
  installedSameDefinitionCount: number;
  installedSameFunctionalGroupCount: number;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  breakerVariant: BreakerVariantAssessment;
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
    params.capabilityDelta === "cost_upgrade" ||
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
    params.currentNeed === "acute" &&
    !params.breakerVariant.blockers.some((blocker) =>
      blocker.startsWith("primary_coverage_not_installed:"),
    )
  ) {
    return "emergency_redundancy";
  }
  return "redundant_duplicate";
}

export function persistentInstallReducesRisk(
  profile: PersistentFunctionalProfile,
  installedProfiles: readonly PersistentFunctionalProfile[],
): boolean {
  return (
    profile.breakerCoverage.length > 0 &&
    !profile.riskyBreaker &&
    installedProfiles.some(
      (installed) =>
        installed.riskyBreaker &&
        breakerCoverageOverlaps(
          profile.breakerCoverage,
          installed.breakerCoverage,
        ),
    )
  );
}

export function persistentInstallImprovesRandomBreakProbability(
  profile: PersistentFunctionalProfile,
  installedProfiles: readonly PersistentFunctionalProfile[],
): boolean {
  return Boolean(
    profile.randomBreakOrDamageProfileId &&
    installedProfiles.some(
      (installed) =>
        installed.randomBreakOrDamageProfileId ===
        profile.randomBreakOrDamageProfileId,
    ),
  );
}

export function marginalUtilityScoreForPersistentInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  capabilityDelta: RunnerPersistentInstallCapabilityDelta;
  duplicateRole: RunnerPersistentInstallDuplicateRole;
  installedSameFunctionalGroupCount: number;
  currentNeed: RunnerHandDevelopmentCurrentNeed;
  handSizeBonus: number;
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
        (cumulativeNeedBaseScore(params.params, params.profile) +
          (params.profile.handSizeSupport ? params.handSizeBonus * 60 : 0)) *
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

export function cumulativeNeedBaseScore(
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

export function cumulativeNeedLevel(
  params: EvaluateRunnerHandDevelopmentParams,
  profile: PersistentFunctionalProfile,
): "high" | "medium" | "low" {
  if (profile.persistentEngineKind === "delayed_install_engine") {
    if (
      runnerDelayedInstallDemandCount(params.input) > 0 ||
      runnerStagedShellCounterDemand(params.input) > 0
    ) {
      return "high";
    }
    if (runnerHasDelayedInstallDoctrine(params)) return "medium";
  }
  if (profile.memorySupport) {
    const memory = params.deckCapabilities?.runner?.memoryProfile;
    if (memory?.missingMemoryPressure || (memory?.memoryAvailable ?? 99) <= 0) {
      return "high";
    }
    if (runnerUsefulProgramsInHandForPersistent(params.input) > 0)
      return "medium";
  }
  if (profile.damagePrevention || profile.handSizeSupport) {
    if (
      runnerHasRiskyInstalledBreaker(params.input) ||
      visibleRunnerThreat(params.input)
    ) {
      return "high";
    }
    if (
      profile.handSizeSupport &&
      params.input.playerView.own.gripOrHq.length <= 3
    ) {
      return "medium";
    }
  }
  if (profile.bankTool) {
    if (params.input.playerView.own.credits <= 2) return "high";
    if (params.input.playerView.own.credits <= 5) return "medium";
  }
  if (
    profile.breakerStrengthSupport ||
    profile.iceStrengthReduction ||
    profile.recurringBreakerEconomy
  ) {
    const hasBoundRestrictedRunCreditDemand =
      profile.recurringBreakerEconomy &&
      params.rigDemandProjection?.roleDemands.some(
        (demand) =>
          demand.capabilityId.startsWith("restricted_run_credit:") &&
          profile.restrictedRunCreditUses.some((use) =>
            demand.capabilityId.endsWith(use),
          ),
      ) === true;
    if (hasBoundRestrictedRunCreditDemand) return "high";
    if (profile.recurringBreakerEconomy && params.rigDemandProjection) {
      return "low";
    }
    const hasInstalledBreaker = (params.input.playerView.own.rig ?? []).some(
      (card) =>
        looksLikeBreaker(card, signalsForCard(card, []).text) &&
        restrictedRunCreditsCanUseBreaker(
          profile.restrictedRunCreditUses,
          card,
        ),
    );
    if (hasInstalledBreaker && params.input.playerView.own.credits <= 5) {
      return "high";
    }
    if (hasInstalledBreaker) return "medium";
  }
  if (
    profile.accessSupport &&
    (params.strategicIntent?.pressureVectors.length ?? 0) > 0
  ) {
    return "medium";
  }
  return "low";
}

function restrictedRunCreditsCanUseBreaker(
  uses: readonly string[],
  breaker: VisibleCard,
): boolean {
  if (uses.length === 0) return true;
  const signals = signalsForCard(breaker, []);
  const traits = new Set([
    ...(breaker.subtypes ?? []).map((subtype) =>
      subtype.toLocaleLowerCase("en-US"),
    ),
    ...signals.roles.map((role) => role.toLocaleLowerCase("en-US")),
  ]);
  return uses.some((use) =>
    use === "using_killer_during_run"
      ? traits.has("killer") || traits.has("breaker_killer")
      : use === "using_icebreaker_during_run_non_noisy"
        ? !traits.has("noisy") && !traits.has("breaker_noisy")
        : false,
  );
}

export function runnerHasDelayedInstallDoctrine(
  params: EvaluateRunnerHandDevelopmentParams,
): boolean {
  const intent = params.strategicIntent;
  return Boolean(
    intent?.engineLineIds?.includes("runner.engine.delayed_install") &&
    intent.engineProviders?.some(
      (provider) =>
        provider.capabilities.includes("runner.staging.delayed_install") &&
        provider.persistence === "persistent" &&
        provider.additivity === "additive_by_trigger_cadence",
    ),
  );
}

export function runnerDelayedInstallDemandCount(
  input: AiDecisionInput,
): number {
  return input.playerView.own.gripOrHq.filter(
    (card) =>
      card.known !== false &&
      (card.type === "program" || card.type === "hardware") &&
      (visibleOrRuntimeNumber(card, "installCost") ??
        visibleOrRuntimeNumber(card, "cost") ??
        0) > 0,
  ).length;
}

export function runnerStagedShellCounterDemand(input: AiDecisionInput): number {
  return (input.playerView.specialZones?.setAside ?? []).reduce(
    (sum, card) => sum + Math.max(0, card.counters?.shell ?? 0),
    0,
  );
}

export function looksLikeDelayedInstallEngine(signals: CardSignals): boolean {
  return signals.structuredEffects.some(
    (effect) =>
      effect.kind === "install" &&
      effect.timing === "persistent" &&
      effect.target === "setup.install_countdown" &&
      effect.repeatable === true,
  );
}

export function diminishingReturnFactor(
  installedSameFunctionalGroupCount: number,
): number {
  if (installedSameFunctionalGroupCount <= 0) return 1;
  if (installedSameFunctionalGroupCount === 1) return 0.6;
  if (installedSameFunctionalGroupCount === 2) return 0.3;
  return 0.15;
}

export function opportunityPenaltyForPersistentInstall(params: {
  profile: PersistentFunctionalProfile;
  capabilityDelta: RunnerPersistentInstallCapabilityDelta;
  duplicateRole: RunnerPersistentInstallDuplicateRole;
  installCost: number;
  newFunctionalCoverage: readonly string[];
}): number {
  let penalty = 0;
  if (params.duplicateRole === "redundant_duplicate") penalty -= 480;
  if (params.duplicateRole === "useful_backup") penalty -= 80;
  if (params.profile.riskyBreaker && params.capabilityDelta === "backup_only") {
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

export function reservePenaltyForPersistentInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  card: VisibleCard;
  action: LegalAction;
  installCost: number;
  creditsAfterInstall: number;
  handAfterInstall: number;
}): number {
  if (params.installCost <= 0) return 0;
  if (proactiveHandCapacitySetupMaySpendReserve(params)) return 0;
  const minimumCreditFloor = minimumCreditFloorForPersistentInstall(
    params.params.input,
  );
  const visibleRemoteScoreThreat = runnerVisibleRemoteScoreThreat(
    params.params.input,
  );
  const desiredCreditReserve = desiredCreditReserveForPersistentEngine(
    params.params.input,
  );
  if (params.creditsAfterInstall < minimumCreditFloor) return -900;
  if (visibleRemoteScoreThreat && params.creditsAfterInstall < 6) return -1300;
  if (params.creditsAfterInstall < desiredCreditReserve) return -420;
  return 0;
}

export function proactiveHandCapacitySetupMaySpendReserve(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  card: VisibleCard;
  action: LegalAction;
  installCost: number;
  creditsAfterInstall: number;
  handAfterInstall: number;
}): boolean {
  const handSizeBonus = Math.max(0, params.card.maxHandSizeBonus ?? 0);
  const input = params.params.input;
  return (
    params.profile.handSizeSupport &&
    handSizeBonus > 0 &&
    params.installCost <= handSizeBonus &&
    params.creditsAfterInstall >= 0 &&
    params.handAfterInstall >= 2 &&
    input.playerView.own.stackOrRdCount > 0 &&
    input.playerView.own.tags === 0 &&
    input.playerView.own.clicks - actionClickCost(params.action) >= 2 &&
    !visibleRunnerThreat(input) &&
    !runnerVisibleRemoteScoreThreat(input)
  );
}

export function desiredCreditReserveForPersistentEngine(
  input: AiDecisionInput,
): number {
  if (runnerVisibleRemoteScoreThreat(input)) return 6;
  return runnerHasRiskyInstalledBreaker(input) ? 5 : 4;
}

export function minimumCreditFloorForPersistentInstall(
  input: AiDecisionInput,
): number {
  if (runnerVisibleRemoteScoreThreat(input)) return 6;
  return runnerHasRiskyInstalledBreaker(input) ? 3 : 2;
}

export function handBufferPenaltyForPersistentInstall(params: {
  params: EvaluateRunnerHandDevelopmentParams;
  profile: PersistentFunctionalProfile;
  handAfterInstall: number;
  duplicateRole: RunnerPersistentInstallDuplicateRole;
}): number {
  if (params.profile.damagePrevention || params.profile.handSizeSupport)
    return 0;
  if (
    params.profile.randomBreakOrDamageProfileId &&
    params.duplicateRole !== "none" &&
    params.handAfterInstall <
      (params.profile.randomBreakMaxSingleFailureDamage ?? 1)
  ) {
    return -1800;
  }
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

export function muPressurePenaltyForPersistentInstall(params: {
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

export function persistentInstallEvidence(params: {
  profile: PersistentFunctionalProfile;
  engineAssessment: RunnerPersistentEngineAssessment;
  replacementAssessment: RunnerPersistentDeckReplacementAssessment;
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
  protectedCreditReserve?: number;
  safeInstallTargetCredits?: number;
  marginalUtilityScore: number;
  opportunityPenalty: number;
  reservePenalty: number;
  handBufferPenalty: number;
  muPressurePenalty: number;
  displacementPenalty: number;
  rigDemandFitScore: number;
  finalInstallFit: number;
  handSizeBonus: number;
  role: RunnerHandDevelopmentRole;
  installedSameRandomBreakProfileCount: number;
  breakerVariantEvidence: readonly string[];
}): string[] {
  const randomBreakProbability =
    params.profile.randomBreakSuccessProbabilityPerAttempt;
  const randomBreakProbabilityBefore =
    randomBreakProbability !== undefined
      ? combinedIndependentSuccessProbability(
          randomBreakProbability,
          params.installedSameRandomBreakProfileCount,
        )
      : undefined;
  const randomBreakProbabilityAfter =
    randomBreakProbability !== undefined
      ? combinedIndependentSuccessProbability(
          randomBreakProbability,
          params.installedSameRandomBreakProfileCount + 1,
        )
      : undefined;
  return [
    `persistent_install_role:${params.role}`,
    `persistent_functional_coverage:${params.profile.functionalCoverage.join("|") || "none"}`,
    `non_additive_utility_families:${params.profile.nonAdditiveUtilityFamilies.join("|") || "none"}`,
    `new_functional_coverage:${params.newFunctionalCoverage.join("|") || "none"}`,
    `stackability_class:${params.stackabilityClass}`,
    `capability_delta:${params.capabilityDelta}`,
    `duplicate_role:${params.duplicateRole}`,
    ...params.engineAssessment.evidence,
    ...params.replacementAssessment.evidence,
    ...(params.profile.randomBreakOrDamageProfileId
      ? [
          `random_break_or_damage_profile:${params.profile.randomBreakOrDamageProfileId}`,
          `random_break_attempts_before:${params.installedSameRandomBreakProfileCount}`,
          `random_break_success_probability_before:${formatProbability(randomBreakProbabilityBefore)}`,
          `random_break_success_probability_after:${formatProbability(randomBreakProbabilityAfter)}`,
          `random_break_success_probability_delta:${formatProbability(
            randomBreakProbabilityAfter !== undefined &&
              randomBreakProbabilityBefore !== undefined
              ? randomBreakProbabilityAfter - randomBreakProbabilityBefore
              : undefined,
          )}`,
        ]
      : []),
    ...params.breakerVariantEvidence,
    `install_cost:${params.installCost}`,
    `credits_after_install:${params.creditsAfterInstall}`,
    `hand_after_install:${params.handAfterInstall}`,
    ...(params.memoryAfterInstall !== undefined
      ? [`memory_after_install:${params.memoryAfterInstall}`]
      : []),
    ...(params.protectedCreditReserve !== undefined
      ? [`protected_credit_reserve:${params.protectedCreditReserve}`]
      : []),
    ...(params.safeInstallTargetCredits !== undefined
      ? [`safe_install_target_credits:${params.safeInstallTargetCredits}`]
      : []),
    `marginal_utility_score:${params.marginalUtilityScore}`,
    `opportunity_penalty:${params.opportunityPenalty}`,
    `reserve_penalty:${params.reservePenalty}`,
    `hand_buffer_penalty:${params.handBufferPenalty}`,
    `mu_pressure_penalty:${params.muPressurePenalty}`,
    `displacement_penalty:${params.displacementPenalty}`,
    `rig_demand_fit_score:${params.rigDemandFitScore}`,
    `final_install_fit:${params.finalInstallFit}`,
    ...(params.profile.handSizeSupport && params.handSizeBonus > 0
      ? [
          `hand_size_option_capacity:+${params.handSizeBonus}`,
          "hand_size_damage_buffer_setup:true",
        ]
      : []),
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

export function combinedIndependentSuccessProbability(
  successProbabilityPerAttempt: number,
  attempts: number,
): number {
  const boundedProbability = Math.max(
    0,
    Math.min(1, successProbabilityPerAttempt),
  );
  return 1 - (1 - boundedProbability) ** Math.max(0, attempts);
}

export function formatProbability(value: number | undefined): string {
  return value === undefined
    ? "unknown"
    : String(Math.round(value * 1000) / 1000);
}

export function runnerHasRiskyInstalledBreaker(
  input: AiDecisionInput,
): boolean {
  return (input.playerView.own.rig ?? []).some(
    (card) =>
      persistentFunctionalProfileForCard(card, signalsForCard(card, []).text)
        .riskyBreaker,
  );
}

export function runnerVisibleRemoteScoreThreat(
  input: AiDecisionInput,
): boolean {
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

export function runnerUsefulProgramsInHandForPersistent(
  input: AiDecisionInput,
): number {
  return input.playerView.own.gripOrHq.filter(
    (card) =>
      card.known !== false &&
      card.type === "program" &&
      (visibleOrRuntimeNumber(card, "memoryCost") ?? 0) > 0,
  ).length;
}

export function actionMatchesCard(
  action: LegalAction,
  card: VisibleCard,
): boolean {
  if (action.side !== "runner") return false;
  const persistentDevelopment = persistentDevelopmentActionProjection(action);
  if (persistentDevelopment) {
    if (!persistentDevelopment.developsGripCard) return false;
    return persistentDevelopment.targetCardId !== undefined
      ? persistentDevelopment.targetCardId === card.instanceId
      : persistentDevelopment.targetDefinitionId === card.definitionId;
  }
  if (
    action.type !== "install_card" &&
    action.type !== "play_event" &&
    action.type !== "trigger_ability" &&
    action.type !== "activated_card_ability"
  ) {
    return false;
  }
  const payload = action.payload ?? {};
  const instanceIds = [
    action.source !== "basic_action" ? action.source : undefined,
    payload.cardId,
    payload.sourceCardId,
  ].filter((value): value is string => typeof value === "string");
  if (instanceIds.length > 0) {
    return instanceIds.includes(card.instanceId);
  }
  return (
    payload.sourceDefinitionId === card.definitionId ||
    payload.cardDefinitionId === card.definitionId ||
    payload.targetCardDefinitionId === card.definitionId
  );
}

export function candidateMatchesCard(
  candidate: ActionSemanticCandidate,
  card: VisibleCard,
): boolean {
  const sourceMatches =
    candidate.sourceCardInstanceId !== undefined
      ? candidate.sourceCardInstanceId === card.instanceId
      : candidate.sourceDefinitionId !== undefined
        ? candidate.sourceDefinitionId === card.definitionId
        : candidate.sourceCardId === card.instanceId ||
          candidate.sourceCardId === card.definitionId;
  return candidate.actorSide === "runner" && sourceMatches;
}

export function actionCreditCost(action: LegalAction): number | undefined {
  const values = action.costs
    .map((cost) => cost.credits)
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

export function visibleOrRuntimeNumber(
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
  numeric?: Partial<
    Record<"installCost" | "cost" | "memoryCost", number | null>
  >;
};

export function runtimeDefinition(cardId: string): RuntimeCardInfo | undefined {
  return RUNTIME_CARDS[cardId] as RuntimeCardInfo | undefined;
}

export function memoryAvailableFor(
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

export function memoryBlocked(context: CardContext): boolean {
  return (
    context.memoryCost !== undefined &&
    context.memoryCost > 0 &&
    context.memoryAvailable !== undefined &&
    context.memoryCost > context.memoryAvailable
  );
}

export function looksLikeBreaker(card: VisibleCard, text: string): boolean {
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
      runnerHandTokensIncludeInOrder(
        runnerHandTextTokens(text),
        "break",
        "subroutine",
      ))
  );
}

export function looksLikeMemorySupport(
  card: VisibleCard,
  text: string,
): boolean {
  return (
    card.memoryLimitBonus !== undefined ||
    runnerHandTextHasMemorySupportSignal(text)
  );
}

export function looksLikeBankTool(text: string): boolean {
  return runnerHandTextHasBankToolSignal(text);
}

export function looksLikeEconomyTool(text: string): boolean {
  return runnerHandTextHasEconomyToolSignal(text);
}

export function looksLikeDrawOrSearch(text: string): boolean {
  return runnerHandTextHasDrawOrSearchSignal(text);
}

export function looksLikeDefense(text: string): boolean {
  return runnerHandTextHasDefenseSignal(text);
}

export function looksLikeAccessPayoff(text: string): boolean {
  return runnerHandTextHasAccessPayoffSignal(text);
}

export function looksLikeRunEvent(card: VisibleCard, text: string): boolean {
  return card.type === "event" && runnerHandTextHasRunEventSignal(text);
}

export function looksRepeatUseful(text: string): boolean {
  return runnerHandTextHasRepeatUsefulSignal(text);
}

export function looksPotentiallyPlayable(
  card: VisibleCard,
  text: string,
): boolean {
  return (
    card.type === "program" ||
    card.type === "hardware" ||
    card.type === "resource" ||
    card.type === "event" ||
    runnerHandTextHasPlayableSignal(text)
  );
}

export function runnerNeedsCoverageFromHand(
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  const matrix = deckCapabilities?.runner?.breakerCoverageMatrix;
  if (!matrix) return false;
  return Object.values(matrix).some(
    (state) => state.inHand && !state.installed,
  );
}

export function roleMatchesStrategicIntent(
  role: RunnerHandDevelopmentRole,
  intent: RunnerStrategicIntentProfile | undefined,
): boolean {
  if (!intent) return false;
  const setupEngine = new Set(intent.setupEngine);
  if (
    role === "delayed_install_engine" &&
    intent.engineLineIds?.includes("runner.engine.delayed_install") &&
    intent.engineProviders?.some(
      (provider) =>
        provider.capabilities.includes("runner.staging.delayed_install") &&
        provider.additivity === "additive_by_trigger_cadence",
    )
  ) {
    return true;
  }
  if (
    (role === "breaker_or_rig_piece" || role === "memory_support") &&
    (setupEngine.has("runner.rig_first") ||
      setupEngine.has("runner.search_breaker_setup"))
  ) {
    return true;
  }
  if (
    (role === "economy_engine" || role === "bank_tool") &&
    setupEngine.has("runner.economy_setup_before_pressure")
  ) {
    return true;
  }
  if (
    role === "draw_or_search_engine" &&
    (setupEngine.has("runner.draw_or_search_setup") ||
      setupEngine.has("runner.search_breaker_setup"))
  ) {
    return true;
  }
  if (
    (role === "access_payoff" || role === "run_event") &&
    (intentHasPressure(intent) ||
      intent.executionStyle === "runner.run_event_tempo")
  ) {
    return true;
  }
  return false;
}

export function intentHasPressure(
  intent: RunnerStrategicIntentProfile | undefined,
): boolean {
  return (intent?.pressureVectors.length ?? 0) > 0;
}

export function visibleRunnerThreat(input: AiDecisionInput): boolean {
  if ((input.playerView.own.tags ?? 0) > 0) return true;
  return input.playerView.servers.some((server) =>
    [...server.root, ...server.ice].some(visibleCardShowsRunnerThreat),
  );
}

export function visibleRunnerTraceThreat(input: AiDecisionInput): boolean {
  return input.playerView.servers.some((server) =>
    [...server.root, ...server.ice].some(visibleCardShowsTraceThreat),
  );
}

export function visibleRunnerTraceThreatOnServer(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  return (
    server !== undefined &&
    [...server.root, ...server.ice].some(visibleCardShowsTraceThreat)
  );
}

export function visibleRunnerTagThreat(input: AiDecisionInput): boolean {
  return input.playerView.servers.some((server) =>
    [...server.root, ...server.ice].some(
      (card) =>
        card.known === true &&
        card.rezzed === true &&
        (card.effectiveRunQuote?.subroutines.some(
          (subroutine) =>
            subroutine.type === "give_runner_tag" ||
            (subroutine.type === "initiate_trace" &&
              subroutine.traceSuccessEffect !== undefined &&
              [
                "add_tag",
                "add_tags_by_trace_margin_over_runner_link",
                "add_tag_and_counter",
                "trash_runner_resource_and_add_tag",
              ].includes(subroutine.traceSuccessEffect.type)),
        ) === true ||
          (card.definitionId !== undefined &&
            AI_HINTS_BY_CARD.get(card.definitionId)?.functionSignals?.includes(
              "tag.source",
            ) === true)),
    ),
  );
}

function visibleCardShowsTraceThreat(card: VisibleCard): boolean {
  return (
    card.known === true &&
    card.rezzed === true &&
    (card.effectiveRunQuote?.subroutines.some(
      (subroutine) => subroutine.type === "initiate_trace",
    ) === true ||
      (card.definitionId !== undefined &&
        AI_HINTS_BY_CARD.get(card.definitionId)?.functionSignals?.includes(
          "trace.source",
        ) === true))
  );
}

export function visibleCardShowsRunnerThreat(card: VisibleCard): boolean {
  if (!card.known) return false;
  return runnerHandTextHasVisibleThreatSignal(
    [card.title, card.rulesText, card.definitionId, ...(card.subtypes ?? [])]
      .filter((entry): entry is string => typeof entry === "string")
      .join(" "),
  );
}

export function persistentInstallRouteBlocked(
  evaluation: RunnerPersistentInstallEvaluation,
): boolean {
  return (
    evaluation.engineAssessment.readiness === "blocked" ||
    evaluation.replacementAssessment.status === "blocked_unvalued_loss" ||
    evaluation.displacementPenalty < 0 ||
    evaluation.muPressurePenalty < 0 ||
    evaluation.reservePenalty <= -900 ||
    evaluation.handBufferPenalty <= -780
  );
}

export function rolePriority(role: RunnerHandDevelopmentRole): number {
  switch (role) {
    case "breaker_or_rig_piece":
      return 700;
    case "delayed_install_engine":
      return 660;
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

export function availabilityPriority(
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

export function fitPriority(fit: RunnerHandDevelopmentStrategicFit): number {
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

export function needPriority(need: RunnerHandDevelopmentCurrentNeed): number {
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

export function clampPriority(value: number): number {
  return Math.max(0, Math.min(1000, value));
}

export function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
