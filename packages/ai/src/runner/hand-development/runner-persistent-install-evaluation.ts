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
  runnerHandTextHasDamagePreventionSignal,
  runnerHandTextHasDefenseSignal,
  runnerHandTextHasDrawOrSearchSignal,
  runnerHandTextHasEconomyToolSignal,
  runnerHandTextHasHandSizeSignal,
  runnerHandTextHasHiddenZoneSearchSignal,
  runnerHandTextHasIceStrengthReductionSignal,
  runnerHandTextHasIceSubroutineBreakSignal,
  runnerHandTextHasMemorySupportSignal,
  runnerHandTextHasPlayableSignal,
  runnerHandTextHasProgramSearchUtilitySignal,
  runnerHandTextHasRecurringBreakerEconomySignal,
  runnerHandTextHasRecoveryUtilitySignal,
  runnerHandTextHasRepeatUsefulSignal,
  runnerHandTextHasRiskyBreakerSignal,
  runnerHandTextHasRunEventSignal,
  runnerHandTextHasSentryCoverageSignal,
  runnerHandTextHasStackSearchUtilitySignal,
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
    candidateSignals,
    effectTargets,
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
  const riskyBreaker =
    breakerCoverage.length > 0 &&
    (randomBreakOrDamageProfile !== undefined ||
      runnerHandTextHasRiskyBreakerSignal(text));
  const damagePrevention = runnerHandTextHasDamagePreventionSignal(text);
  const handSizeSupport = runnerHandTextHasHandSizeSignal(text);
  const memorySupport = looksLikeMemorySupport(card, text);
  const breakerStrengthSupport =
    runnerHandTextHasBreakerStrengthSupportSignal(text);
  const iceStrengthReduction =
    runnerHandTextHasIceStrengthReductionSignal(text);
  const recurringBreakerEconomy =
    runnerHandTextHasRecurringBreakerEconomySignal(text);
  const bankTool = looksLikeBankTool(text);
  const economyTool =
    breakerCoverage.length === 0 && looksLikeEconomyTool(text);
  const actionEconomy = runnerHandTextHasActionEconomySignal(text);
  const accessSupport = looksLikeAccessPayoff(text);
  const searchSupport = looksLikeDrawOrSearch(text);
  const nonAdditiveUtilityFamilies =
    nonAdditiveUtilityFamiliesForPersistentCard(card, text);
  const actionGatedUtility =
    nonAdditiveUtilityFamilies.length > 0 || actionEconomy;
  const absoluteNonStackable =
    runnerHandTextHasAbsoluteLinkSignal(text) &&
    !runnerHandTextHasTemporaryCounterSignal(text);
  const functionalCoverage = sortedUnique([
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
  const primaryGroups =
    functionalCoverage.length > 0
      ? functionalCoverage
      : [`type:${card.type ?? "unknown"}`];
  return {
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
    bankTool,
    accessSupport,
    searchSupport,
    actionGatedUtility,
    absoluteNonStackable,
  };
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
  const recovery = runnerHandTextHasRecoveryUtilitySignal(text);
  const programSearch = runnerHandTextHasProgramSearchUtilitySignal(text);
  const stackSearch = runnerHandTextHasStackSearchUtilitySignal(text);
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
  if (
    coverage.startsWith("non_additive_utility:") &&
    existingCoverage.has("non_additive_utility:action_gated_search")
  ) {
    return true;
  }
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
  if (nonAdditiveUtilityProfilesOverlap(candidate, installed)) return true;
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
    const hasInstalledBreaker = (params.input.playerView.own.rig ?? []).some(
      (card) => looksLikeBreaker(card, signalsForCard(card, []).text),
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
    return (
      persistentDevelopment.developsGripCard &&
      (persistentDevelopment.targetCardId === card.instanceId ||
        persistentDevelopment.targetDefinitionId === card.definitionId)
    );
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
  return (
    action.source === card.instanceId ||
    payload.cardId === card.instanceId ||
    payload.sourceCardId === card.instanceId ||
    payload.sourceDefinitionId === card.definitionId ||
    payload.cardDefinitionId === card.definitionId ||
    payload.targetCardDefinitionId === card.definitionId
  );
}

export function candidateMatchesCard(
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
