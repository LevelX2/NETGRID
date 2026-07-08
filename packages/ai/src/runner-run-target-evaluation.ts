import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import type { BeliefState } from "./belief-state";
import {
  evaluateKnownCentralAccessPayoff,
  type KnownCentralAccessPayoff,
} from "./known-central-access-payoff";
import {
  evaluateKnownRemoteAccessPayoff,
  type KnownRemoteAccessPayoff,
} from "./known-remote-access-payoff";
import type { ActionSemanticCandidate } from "./action-semantic-candidate";
import type { AccessOutcomeMemoryStatus } from "./access/access-outcome-memory";
import type { RankedKnownRemoteAccessCandidate } from "./access/access-target-ranking";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import { createAiHintsByCard, type AiCardHint } from "./ai-hints";
import { deriveObservedRemoteNoProgressAccessMemory } from "./memory/remote-access-outcome";
import type { RunnerHandDevelopmentEvaluation } from "./runner-hand-development";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
  type VisibleIceRunHazard,
} from "./visible-run-analysis";
import { buildRunnerEconomyPosture } from "./runner-economy-posture";
import {
  assessBlinkRiskForRunAction,
  blinkRiskScorePenalty,
  blinkRiskShouldAvoidRun,
} from "./actions/risk-action-projection";
import {
  projectInternalRunnerRunActions,
  publicRunActionProjection,
  type InternalRunActionProjection,
} from "./actions/run-action-projection";

export const RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION =
  "runner-run-target-evaluation-v1" as const;
export const RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION =
  "runner-economy-posture-v1" as const;
export const RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION =
  "runner-credit-base-plan-v1" as const;

export type RunnerRunTargetKind = "hq" | "rd" | "archives" | "remote";

export type RunnerAccessPayoff =
  | "agenda"
  | "trash_affordable"
  | "trash_unaffordable"
  | "known_low_value"
  | "unknown"
  | "fresh"
  | "access_bonus"
  | "score_threat";

export type RunnerInstalledRunPayoff = {
  immediateAccessValue: number;
  futureSetupValue: number;
  purgeTaxValue: number;
  economyValue: number;
  riskPenalty: number;
  scoreBonus: number;
  multiaccessAvailable: boolean;
  evidence: string[];
};

export type RunnerRunActionSourceKind =
  | "basic_action"
  | "event"
  | "resource_ability"
  | "program_ability"
  | "hardware_ability"
  | "identity_ability"
  | "card_ability"
  | "choice"
  | "extra_action"
  | "unknown";

export type RunnerRunActionStructure =
  | "direct_start_run"
  | "event_run"
  | "extra_run"
  | "bonus_run"
  | "followup_run"
  | "multi_run_sequence"
  | "target_choice"
  | "run_enabler";

export type RunnerRunActionProjectionStatus =
  | "concrete_target"
  | "missing_target_options";

export type RunActionProjection = {
  actionId: string;
  actionType: string;
  sourceKind: RunnerRunActionSourceKind;
  sourceCardId?: string;
  targetServerId?: string;
  targetKind?: RunnerRunTargetKind;
  accessServerId?: string;
  structure: RunnerRunActionStructure;
  accessPayoffSignals: string[];
  constraintSignals: string[];
  riskSignals: string[];
  spendLimit?: number;
  noNoisyBreakers: boolean;
  bypassFirstIce: boolean;
  projectionStatus: RunnerRunActionProjectionStatus;
  evidence: string[];
};

export type RunnerKnownAccessState =
  | "known_payoff"
  | "known_no_current_payoff"
  | "unknown"
  | "changed"
  | "fresh";

export type RunnerPathPassability =
  | "reachable"
  | "blocked_missing_coverage"
  | "blocked_by_blink_hand_buffer"
  | "blocked_unpayable"
  | "blocked_unbreakable";

export type RunnerRunTargetRecommendation =
  | "run_now"
  | "run_if_free"
  | "setup_first"
  | "draw_for_damage_buffer"
  | "gain_credits_first"
  | "find_breaker_first"
  | "known_no_current_payoff"
  | "remote_changed_reassess"
  | "declined_trash_memory_active"
  | "do_not_run_now";

export type BlinkRiskSeverity = "none" | "low" | "medium" | "high" | "lethal";

export type BlinkRiskPayoffOverride =
  | "none"
  | "known_agenda"
  | "remote_score_threat"
  | "immediate_win"
  | "survival";

export type BlinkRiskAssessment = {
  currentHandCount: number;
  handAfterActionCost: number;
  blinkUsesLikely: number;
  visibleSubroutinesLikely: number;
  maxSingleFailureDamage: number;
  worstCaseDamageEstimate: number;
  lethalOnAnyFailure: boolean;
  lethalOnHighFailure: boolean;
  survivesOneFailedBlinkUse: boolean;
  riskSeverity: BlinkRiskSeverity;
  payoffOverride: BlinkRiskPayoffOverride;
  stableCoverageAvailable: boolean;
  pathDependsOnBlink: boolean;
  breakWouldBeExcludedInEncounter: boolean;
  blockedByHandBuffer: boolean;
  noProgressRunExpected: boolean;
  expectedEtrUnbroken: boolean;
  recentFailure: boolean;
  recentDamageAmount: number;
  sameServerRepeatedRiskPenalty: number;
  evidence: string[];
};

export type RunnerBlinkRecoveryAssessment = {
  active: boolean;
  targetServerId?: string;
  currentHandCount: number;
  handBufferTooLow: boolean;
  recentFailure: boolean;
  recentDamageAmount: number;
  sameServerRepeatedRiskPenalty: number;
  evidence: string[];
};

export type RunnerCreditBasePlanRecommendation =
  | "build_credit_base"
  | "fund_useful_hand_card"
  | "preserve_reserve"
  | "allow_setup_spend"
  | "allow_pressure";

export type RunnerCreditReservePhase = "opening" | "midgame" | "late_contest";

export type RunnerRemoteScoreThreat =
  | "none"
  | "possible"
  | "visible"
  | "urgent";

export type RunnerEconomyRoute =
  | "bank_cashout"
  | "bank_build"
  | "installed_action_economy"
  | "hand_bank_tool"
  | "hand_economy_engine"
  | "burst_event"
  | "basic_credit_fallback";

export type RunnerCreditReservePolicy = {
  schemaVersion: 1;
  phase: RunnerCreditReservePhase;
  currentCredits: number;
  minimumCreditFloor: number;
  breakerUseReserve: number;
  contestReserve: number;
  developmentReserve: number;
  emergencyReserve: number;
  desiredCreditReserve: number;
  remoteScoreThreat: RunnerRemoteScoreThreat;
  canContestIfFunded: boolean;
  belowReserveNow: boolean;
  spendingWouldDropBelowReserve: boolean;
  creditsAfterAction?: number;
  reserveDrivers: string[];
  reserveOverrides: string[];
  evidence: string[];
};

export type RunnerCreditBaseHandCandidate = {
  developmentRole: RunnerHandDevelopmentEvaluation["developmentRole"];
  currentNeed: RunnerHandDevelopmentEvaluation["currentNeed"];
  priority: number;
  installOrPlayCost: number;
  missingCredits: number;
  deferReason: RunnerHandDevelopmentEvaluation["deferReason"];
};

export type RunnerCreditBasePlan = {
  schemaVersion: typeof RUNNER_CREDIT_BASE_PLAN_SCHEMA_VERSION;
  currentCredits: number;
  minimumCreditFloor: number;
  desiredCreditReserve: number;
  runCostReserve: number;
  creditReservePolicy: RunnerCreditReservePolicy;
  fundingNeed: boolean;
  usefulHandCardsBlockedByCredits: number;
  usefulHandCardsAffordableNow: number;
  topBlockedHandCandidate?: RunnerCreditBaseHandCandidate;
  recommendation: RunnerCreditBasePlanRecommendation;
  economyPriority: "low" | "medium" | "high";
  evidence: string[];
};

export type RunnerRunTargetEvaluation = {
  schemaVersion: typeof RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION;
  targetServerId: string;
  targetKind: RunnerRunTargetKind;
  accessServerId: string;
  accessTargetKind: RunnerRunTargetKind;
  actionId: string;
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  multiaccessAvailable: boolean;
  pathPassability: RunnerPathPassability;
  pathCost: number;
  creditsAfterRun: number;
  visibleIceRunHazards?: VisibleIceRunHazard[];
  visibleIceHazardPenalty?: number;
  visibleIceHazardAvoidanceCost?: number;
  creditsAfterAvoidingVisibleIceHazards?: number;
  expectedTagsFromVisibleIce?: number;
  unavoidableVisibleIceHazardCount?: number;
  visibleTraceTagHazardUnavoidable?: boolean;
  stealOrTrashAffordable: boolean | "unknown";
  installedRunPayoff: RunnerInstalledRunPayoff;
  runActionPayoff: RunnerInstalledRunPayoff;
  runActionProjection: RunActionProjection;
  riskyUniversalCoverage: boolean;
  blinkRiskAssessment?: BlinkRiskAssessment;
  scoreThreat: boolean;
  recommendation: RunnerRunTargetRecommendation;
  score: number;
  evidence: string[];
};

export type RunnerEconomyPosture = {
  schemaVersion: typeof RUNNER_ECONOMY_POSTURE_SCHEMA_VERSION;
  minimumCreditFloor: number;
  desiredCreditReserve: number;
  creditReservePolicy: RunnerCreditReservePolicy;
  creditBasePlan: RunnerCreditBasePlan;
  preferredEconomyRoute?: RunnerEconomyRoute;
  riskAdjustedRunReserve: boolean;
  buildEconomyBeforePressure: boolean;
  bankToolsRelevant: boolean;
  fundingNeed: boolean;
  recommendation:
    | "stable"
    | "build_economy"
    | "cash_out_bank"
    | "can_spend_for_high_payoff";
  evidence: string[];
};

export type EvaluateRunnerRunTargetsParams = {
  input: AiDecisionInput;
  strategicIntent?: RunnerStrategicIntentProfile;
  deckCapabilities?: DeckCapabilityProfile;
  beliefState?: BeliefState;
  handDevelopmentEvaluations?: readonly RunnerHandDevelopmentEvaluation[];
  actionCandidates?: readonly ActionSemanticCandidate[];
  accessOutcomeMemory?: AccessOutcomeMemoryStatus;
  rankedAccessTargets?: readonly RankedKnownRemoteAccessCandidate[];
};

const AI_HINTS_BY_CARD = createAiHintsByCard();
const INSTALLED_RUN_PAYOFF_SCORE_CAP = 180;
export {
  BLINK_CARD_ID,
  BLINK_RANDOM_BREAK_OR_DAMAGE_RISK_PROFILE,
  assessBlinkRiskForRunAction,
  blinkRiskScorePenalty,
  blinkRiskShouldAvoidRun,
  buildBlinkRiskAssessment,
  randomBreakOrDamageRiskProfileForDefinitionId,
  runnerBlinkRecoveryAssessment,
} from "./actions/risk-action-projection";
export type { RandomBreakOrDamageRiskProfile } from "./actions/risk-action-projection";

export { buildRunnerEconomyPosture } from "./runner-economy-posture";

export function evaluateRunnerRunTargets(
  params: EvaluateRunnerRunTargetsParams,
): RunnerRunTargetEvaluation[] {
  const economyPosture = buildRunnerEconomyPosture(params);
  return projectInternalRunnerRunActions(params)
    .filter(
      (projection) =>
        projection.projectionStatus === "concrete_target" &&
        projection.targetServerId !== undefined,
    )
    .map((projection) =>
      evaluateRunnerRunTarget(params, projection, economyPosture),
    )
    .filter(
      (evaluation): evaluation is RunnerRunTargetEvaluation =>
        evaluation !== undefined,
    )
    .sort(
      (left, right) =>
        recommendationRank(right.recommendation) -
          recommendationRank(left.recommendation) ||
        right.score - left.score ||
        left.targetServerId.localeCompare(right.targetServerId) ||
        left.actionId.localeCompare(right.actionId),
    );
}

export { projectRunnerRunActions } from "./actions/run-action-projection";

function evaluateRunnerRunTarget(
  params: EvaluateRunnerRunTargetsParams,
  projection: InternalRunActionProjection,
  economyPosture: RunnerEconomyPosture,
): RunnerRunTargetEvaluation | undefined {
  const targetServerId = projection.targetServerId;
  if (!targetServerId) return undefined;
  const targetKind = targetKindForServerId(targetServerId);
  if (!targetKind) return undefined;
  const accessServerId = projection.accessServerId ?? targetServerId;
  const accessTargetKind = targetKindForServerId(accessServerId);
  if (!accessTargetKind) return undefined;
  const server = params.input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  const accessServer = params.input.playerView.servers.find(
    (candidate) => candidate.id === accessServerId,
  );
  const path = assessKnownRezzedIcePath(
    server?.ice ?? [],
    params.input.playerView.own.rig ?? [],
    runnerRunPathCreditBudgetWithVisiblePools(
      params.input.playerView.own.credits,
      params.input.playerView.own.rig ?? [],
    ),
    server?.root ?? [],
    params.input.playerView.opponent.credits,
  );
  const payoff = payoffForTarget(params, accessServerId, accessTargetKind);
  const installedRunPayoff = installedRunPayoffForTarget(
    params.input,
    accessTargetKind,
  );
  const runActionPayoff = runActionPayoffForTarget(
    projection,
    accessTargetKind,
  );
  const combinedRunPayoff = combineRunPayoffs(
    installedRunPayoff,
    runActionPayoff,
  );
  const scoreThreat =
    accessTargetKind === "remote" && remoteHasScoreThreat(accessServer);
  const accessPayoff = accessPayoffWithInstalledRunPayoff({
    basePayoff: payoff.accessPayoff,
    installedRunPayoff: combinedRunPayoff,
    scoreThreat,
  });
  const rankedAccessTarget = rankedAccessTargetForServer(
    params.rankedAccessTargets,
    accessServerId,
  );
  const accessOutcomeMemory =
    params.accessOutcomeMemory ??
    deriveObservedRemoteNoProgressAccessMemory(params.input, accessServerId);
  const blinkRiskAssessment = assessBlinkRiskForRunAction(
    params.input,
    projection.action,
    { accessPayoff, scoreThreat },
  );
  const riskyUniversalCoverage =
    hasRiskyUniversalPressure(params) && (server?.ice.length ?? 0) > 0;
  const basePathPassability = pathPassabilityFor(path);
  const spendLimitBlocksPath =
    projection.spendLimit !== undefined &&
    (path.visibleBreakCost ?? 0) > projection.spendLimit;
  const pathPassability = blinkRiskAssessment?.blockedByHandBuffer
    ? "blocked_by_blink_hand_buffer"
    : spendLimitBlocksPath
      ? "blocked_unpayable"
      : basePathPassability;
  const creditsAfterRun = path.creditsAfterPath;
  const multiaccessAvailable = combinedRunPayoff.multiaccessAvailable;
  const stealOrTrashAffordable = stealOrTrashAffordableFor(accessPayoff);
  const unproductiveVisibleRunPath = runnerRunTargetPathIsUnproductive(path);
  const visibleTraceEndRunLockUnavoidable =
    path.knownPathBlockedByUnavoidableTraceRunLock === true;
  const visibleIceHazardPenalty = path.visibleIceHazardPenalty ?? 0;
  const visibleIceHazardAvoidanceCost = path.visibleIceHazardAvoidanceCost ?? 0;
  const creditsAfterAvoidingVisibleIceHazards =
    path.creditsAfterAvoidingVisibleIceHazards ?? creditsAfterRun;
  const expectedTagsFromVisibleIce = path.expectedTagsFromVisibleIce ?? 0;
  const unavoidableVisibleIceHazardCount =
    path.unavoidableVisibleIceHazardCount ?? 0;
  const visibleTraceTagHazardUnavoidable =
    path.visibleTraceTagHazardUnavoidable === true;
  const recommendation = recommendationForRunTarget({
    targetKind: accessTargetKind,
    accessPayoff,
    knownAccessState: payoff.knownAccessState,
    pathPassability,
    creditsAfterRun,
    economyPosture,
    installedRunPayoff: combinedRunPayoff,
    scoreThreat,
    unproductiveVisibleRunPath,
    visibleIceHazardPenalty,
    visibleIceHazardAvoidanceCost,
    creditsAfterAvoidingVisibleIceHazards,
    expectedTagsFromVisibleIce,
    unavoidableVisibleIceHazardCount,
    visibleTraceTagHazardUnavoidable,
    ...(accessOutcomeMemory ? { accessOutcomeMemory } : {}),
    ...(rankedAccessTarget ? { rankedAccessTarget } : {}),
    ...(blinkRiskAssessment ? { blinkRiskAssessment } : {}),
  });
  const score = scoreRunTargetEvaluation({
    targetKind: accessTargetKind,
    accessPayoff,
    knownAccessState: payoff.knownAccessState,
    pathPassability,
    creditsAfterRun,
    economyPosture,
    scoreThreat,
    recommendation,
    multiaccessAvailable,
    installedRunPayoffScore: combinedRunPayoff.scoreBonus,
    accessPayoffScoreAdjustment: payoff.scoreAdjustment,
    visibleIceHazardPenalty,
    ...(accessOutcomeMemory ? { accessOutcomeMemory } : {}),
    ...(blinkRiskAssessment ? { blinkRiskAssessment } : {}),
  });
  const publicProjection = publicRunActionProjection(projection);
  return {
    schemaVersion: RUNNER_RUN_TARGET_EVALUATION_SCHEMA_VERSION,
    targetServerId,
    targetKind,
    accessServerId,
    accessTargetKind,
    actionId: projection.actionId,
    accessPayoff,
    knownAccessState: payoff.knownAccessState,
    multiaccessAvailable,
    pathPassability,
    pathCost: path.visibleBreakCost ?? 0,
    creditsAfterRun,
    ...(path.visibleIceRunHazards?.length
      ? { visibleIceRunHazards: path.visibleIceRunHazards }
      : {}),
    visibleIceHazardPenalty,
    visibleIceHazardAvoidanceCost,
    creditsAfterAvoidingVisibleIceHazards,
    expectedTagsFromVisibleIce,
    unavoidableVisibleIceHazardCount,
    visibleTraceTagHazardUnavoidable,
    stealOrTrashAffordable,
    installedRunPayoff,
    runActionPayoff,
    runActionProjection: publicProjection,
    riskyUniversalCoverage,
    ...(blinkRiskAssessment ? { blinkRiskAssessment } : {}),
    scoreThreat,
    recommendation,
    score,
    evidence: [
      `target:${targetServerId}`,
      `target_kind:${targetKind}`,
      `access_server:${accessServerId}`,
      `access_target_kind:${accessTargetKind}`,
      `access_payoff:${accessPayoff}`,
      `known_access_state:${payoff.knownAccessState}`,
      `path_passability:${pathPassability}`,
      `path_cost:${path.visibleBreakCost ?? 0}`,
      `credits_after_run:${creditsAfterRun}`,
      `visible_ice_hazard_penalty:${visibleIceHazardPenalty}`,
      `visible_ice_hazard_avoidance_cost:${visibleIceHazardAvoidanceCost}`,
      `credits_after_avoiding_visible_ice_hazards:${creditsAfterAvoidingVisibleIceHazards}`,
      `expected_tags_from_visible_ice:${expectedTagsFromVisibleIce}`,
      `unavoidable_visible_ice_hazard_count:${unavoidableVisibleIceHazardCount}`,
      `visible_trace_tag_hazard_unavoidable:${visibleTraceTagHazardUnavoidable}`,
      ...(path.visibleIceRunHazards ?? [])
        .flatMap((hazard) => hazard.evidence)
        .slice(0, 16),
      `multiaccess_available:${multiaccessAvailable}`,
      `installed_run_payoff_score:${installedRunPayoff.scoreBonus}`,
      `run_action_payoff_score:${runActionPayoff.scoreBonus}`,
      `combined_run_payoff_score:${combinedRunPayoff.scoreBonus}`,
      `access_payoff_score_adjustment:${payoff.scoreAdjustment}`,
      `run_action_projection_status:${projection.projectionStatus}`,
      `run_action_projection_source_kind:${projection.sourceKind}`,
      `run_action_projection_structure:${projection.structure}`,
      ...(projection.sourceCardId
        ? [`run_action_projection_source_card:${projection.sourceCardId}`]
        : []),
      ...(projection.spendLimit !== undefined
        ? [`run_action_projection_spend_limit:${projection.spendLimit}`]
        : []),
      `run_action_projection_spend_limit_blocks_path:${spendLimitBlocksPath}`,
      `run_action_projection_no_noisy_breakers:${projection.noNoisyBreakers}`,
      `run_action_projection_bypass_first_ice:${projection.bypassFirstIce}`,
      `risky_universal_coverage:${riskyUniversalCoverage}`,
      ...(blinkRiskAssessment?.evidence ?? []),
      `unproductive_visible_run_path:${unproductiveVisibleRunPath}`,
      `visible_trace_end_run_lock_unavoidable:${visibleTraceEndRunLockUnavoidable}`,
      ...(path.hardUnbrokenRunEffects?.length
        ? [`hard_unbroken_run_effect:${path.hardUnbrokenRunEffects.join("|")}`]
        : []),
      ...(path.hardUnbrokenEffectIceTitle
        ? [`hard_unbroken_run_effect_ice:${path.hardUnbrokenEffectIceTitle}`]
        : []),
      `score_threat:${scoreThreat}`,
      `recommendation:${recommendation}`,
      ...accessOutcomeMemoryEvaluationEvidence(accessOutcomeMemory),
      ...rankedAccessTargetEvaluationEvidence(rankedAccessTarget),
      ...economyPosture.creditReservePolicy.evidence.slice(0, 12),
      ...payoff.evidence.slice(0, 36),
      ...installedRunPayoff.evidence.slice(0, 8),
      ...runActionPayoff.evidence.slice(0, 8),
      ...projection.evidence.slice(0, 12),
    ],
  };
}

function runActionPayoffForTarget(
  projection: RunActionProjection,
  targetKind: RunnerRunTargetKind,
): RunnerInstalledRunPayoff {
  const values = emptyRunPayoffValues();
  const evidence = new Set<string>();
  if (projectionHasAccessSignal(projection, targetKind, "multiaccess")) {
    values.immediateAccessValue += 90;
    evidence.add(`run_action_payoff:${targetKind}:multiaccess`);
  }
  if (projectionHasAccessSignal(projection, targetKind, "hq_info")) {
    values.immediateAccessValue += 60;
    evidence.add("run_action_payoff:hq:hq_info");
  }
  if (projectionHasAccessSignal(projection, targetKind, "topdeck_info")) {
    values.immediateAccessValue += 60;
    evidence.add("run_action_payoff:rd:topdeck_info");
  }
  if (projectionHasAccessSignal(projection, targetKind, "free_trash")) {
    values.immediateAccessValue += 70;
    evidence.add(`run_action_payoff:${targetKind}:access_trash`);
  }
  if (projection.bypassFirstIce) {
    values.futureSetupValue += 35;
    evidence.add(`run_action_payoff:${targetKind}:bypass_first_ice`);
  }
  if (projection.structure === "multi_run_sequence") {
    values.futureSetupValue += 35;
    evidence.add(`run_action_payoff:${targetKind}:multi_run_sequence`);
  }
  if (
    projection.riskSignals.some(
      (signal) =>
        projectionSignalHasToken(signal, "tag") ||
        projectionSignalHasToken(signal, "damage"),
    )
  ) {
    values.riskPenalty += 25;
    evidence.add(`run_action_payoff:${targetKind}:risk_penalty`);
  }
  const multiaccessAvailable = projectionHasAccessSignal(
    projection,
    targetKind,
    "multiaccess",
  );
  return finalizeRunPayoff(values, multiaccessAvailable, [...evidence].sort());
}

function projectionHasAccessSignal(
  projection: RunActionProjection,
  targetKind: RunnerRunTargetKind,
  kind: "multiaccess" | "hq_info" | "topdeck_info" | "free_trash",
): boolean {
  const signals = projection.accessPayoffSignals.map((signal) =>
    signal.toLowerCase(),
  );
  if (kind === "multiaccess") {
    return signals.some((signal) => {
      if (!projectionSignalHasToken(signal, "multiaccess")) return false;
      if (
        projectionSignalHasToken(signal, "hq") ||
        projectionSignalHasToken(signal, "hand")
      ) {
        return targetKind === "hq";
      }
      if (
        projectionSignalHasToken(signal, "rnd") ||
        projectionSignalHasToken(signal, "rd") ||
        projectionSignalHasToken(signal, "topdeck")
      ) {
        return targetKind === "rd";
      }
      if (projectionSignalHasToken(signal, "archives"))
        return targetKind === "archives";
      if (projectionSignalHasToken(signal, "remote"))
        return targetKind === "remote";
      return true;
    });
  }
  if (kind === "hq_info") {
    return (
      targetKind === "hq" &&
      signals.some((signal) =>
        projectionSignalHasPhrase(signal, ["hq", "info"]),
      )
    );
  }
  if (kind === "topdeck_info") {
    return (
      targetKind === "rd" &&
      signals.some(
        (signal) =>
          projectionSignalHasToken(signal, "topdeck") ||
          projectionSignalHasPhrase(signal, ["rnd", "topdeck"]),
      )
    );
  }
  return signals.some(
    (signal) =>
      projectionSignalHasPhrase(signal, ["free", "trash"]) ||
      projectionSignalHasPhrase(signal, ["access", "trash"]),
  );
}

function projectionSignalHasToken(signal: string, token: string): boolean {
  const signalTokenSet = new Set(projectionSignalTokens(signal));
  return signalTokenSet.has(token);
}

function projectionSignalHasPhrase(
  signal: string,
  phrase: readonly string[],
): boolean {
  const tokens = projectionSignalTokens(signal);
  return tokens.some(
    (entry, index) =>
      entry === phrase[0] &&
      phrase.every(
        (phraseToken, offset) => tokens[index + offset] === phraseToken,
      ),
  );
}

function projectionSignalTokens(signal: string): string[] {
  return signal
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function combineRunPayoffs(
  installedRunPayoff: RunnerInstalledRunPayoff,
  runActionPayoff: RunnerInstalledRunPayoff,
): RunnerInstalledRunPayoff {
  return finalizeRunPayoff(
    {
      immediateAccessValue:
        installedRunPayoff.immediateAccessValue +
        runActionPayoff.immediateAccessValue,
      futureSetupValue:
        installedRunPayoff.futureSetupValue + runActionPayoff.futureSetupValue,
      purgeTaxValue:
        installedRunPayoff.purgeTaxValue + runActionPayoff.purgeTaxValue,
      economyValue:
        installedRunPayoff.economyValue + runActionPayoff.economyValue,
      riskPenalty: installedRunPayoff.riskPenalty + runActionPayoff.riskPenalty,
    },
    installedRunPayoff.multiaccessAvailable ||
      runActionPayoff.multiaccessAvailable,
    uniqueStrings([
      ...installedRunPayoff.evidence,
      ...runActionPayoff.evidence,
    ]),
  );
}

function emptyRunPayoffValues(): Omit<
  RunnerInstalledRunPayoff,
  "scoreBonus" | "multiaccessAvailable" | "evidence"
> {
  return {
    immediateAccessValue: 0,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
  };
}

function finalizeRunPayoff(
  values: Omit<
    RunnerInstalledRunPayoff,
    "scoreBonus" | "multiaccessAvailable" | "evidence"
  >,
  multiaccessAvailable: boolean,
  evidence: string[],
): RunnerInstalledRunPayoff {
  const rawScore =
    values.immediateAccessValue +
    values.futureSetupValue +
    values.purgeTaxValue +
    values.economyValue -
    values.riskPenalty;
  return {
    ...values,
    scoreBonus: Math.max(0, Math.min(INSTALLED_RUN_PAYOFF_SCORE_CAP, rawScore)),
    multiaccessAvailable,
    evidence: uniqueStrings(evidence).sort(),
  };
}

function payloadRecord(action: LegalAction): Record<string, unknown> {
  return (action.payload ?? {}) as Record<string, unknown>;
}

function payloadStringValues(
  action: LegalAction,
  keys: readonly string[],
): string[] {
  const payload = payloadRecord(action);
  return keys.flatMap((key) => {
    const value = payload[key];
    if (typeof value === "string") return [value];
    if (Array.isArray(value)) {
      return value.filter(
        (entry): entry is string => typeof entry === "string",
      );
    }
    if (
      value &&
      typeof value === "object" &&
      typeof (value as { serverId?: unknown }).serverId === "string"
    ) {
      return [(value as { serverId: string }).serverId];
    }
    return [];
  });
}

function payloadStringArray(
  action: LegalAction,
  keys: readonly string[],
): string[] {
  return payloadStringValues(action, keys).map((value) =>
    value.trim().toLowerCase(),
  );
}

function payloadSearchText(action: LegalAction): string {
  const payload = payloadRecord(action);
  return Object.entries(payload)
    .flatMap(([key, value]) => {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return [`${key}:${value}`];
      }
      if (Array.isArray(value)) {
        return value
          .filter(
            (entry): entry is string | number | boolean =>
              typeof entry === "string" ||
              typeof entry === "number" ||
              typeof entry === "boolean",
          )
          .map((entry) => `${key}:${entry}`);
      }
      return [key];
    })
    .join(" ");
}

function booleanPayloadValue(action: LegalAction, key: string): boolean {
  return payloadRecord(action)[key] === true;
}

function numberPayloadValue(
  action: LegalAction,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    const value = payloadRecord(action)[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
  }
  return undefined;
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function accessPayoffWithInstalledRunPayoff(params: {
  basePayoff: RunnerAccessPayoff;
  installedRunPayoff: RunnerInstalledRunPayoff;
  scoreThreat: boolean;
}): RunnerAccessPayoff {
  if (params.scoreThreat && params.basePayoff === "unknown") {
    return "score_threat";
  }
  if (
    params.basePayoff === "unknown" &&
    params.installedRunPayoff.immediateAccessValue >= 50
  ) {
    return "access_bonus";
  }
  return params.basePayoff;
}

function payoffForTarget(
  params: EvaluateRunnerRunTargetsParams,
  targetServerId: string,
  targetKind: RunnerRunTargetKind,
): {
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  scoreAdjustment: number;
  evidence: string[];
} {
  if (targetKind === "remote") {
    return remotePayoffToRunTarget(
      evaluateKnownRemoteAccessPayoff(
        params.input,
        targetServerId,
        params.beliefState,
      ),
    );
  }
  if (targetServerId === "hq" || targetServerId === "rd") {
    return centralPayoffToRunTarget(
      evaluateKnownCentralAccessPayoff(
        params.input,
        targetServerId,
        params.beliefState,
      ),
    );
  }
  return {
    accessPayoff: "unknown",
    knownAccessState: "unknown",
    scoreAdjustment: 0,
    evidence: [`${targetKind}_payoff:unknown`],
  };
}

function rankedAccessTargetForServer(
  rankedAccessTargets: readonly RankedKnownRemoteAccessCandidate[] | undefined,
  serverId: string,
): RankedKnownRemoteAccessCandidate | undefined {
  return rankedAccessTargets?.find(
    (candidate) => candidate.commitment.serverId === serverId,
  );
}

function accessOutcomeMemoryEvaluationEvidence(
  status: AccessOutcomeMemoryStatus | undefined,
): string[] {
  if (!status) return [];
  return [
    `run_target_access_memory_applies:${status.applies}`,
    `run_target_access_memory_suppresses_plan_bonus:${status.suppressesPlanBonus}`,
    ...(status.invalidationReason
      ? [`run_target_access_memory_invalidation:${status.invalidationReason}`]
      : []),
    ...status.evidence.slice(0, 20),
  ];
}

function rankedAccessTargetEvaluationEvidence(
  candidate: RankedKnownRemoteAccessCandidate | undefined,
): string[] {
  if (!candidate) return [];
  return [
    `run_target_ranked_access_position:${candidate.positionKey}`,
    `run_target_ranked_access_kind:${candidate.targetKind}`,
    `run_target_ranked_access_intent:${candidate.commitment.intendedAccessAction}`,
    `run_target_ranked_access_reason:${candidate.commitment.reason}`,
    `run_target_ranked_access_score:${candidate.rankScore}`,
    ...candidate.rankEvidence.slice(0, 6),
  ];
}

function remotePayoffToRunTarget(payoff: KnownRemoteAccessPayoff): {
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  scoreAdjustment: number;
  evidence: string[];
} {
  return {
    accessPayoff: payoff.payoff === "changed" ? "unknown" : payoff.payoff,
    knownAccessState: payoff.knownNoCurrentPayoff
      ? "known_no_current_payoff"
      : payoff.payoff === "changed"
        ? "changed"
        : payoff.payoff === "unknown"
          ? "unknown"
          : "known_payoff",
    scoreAdjustment: -payoff.penalty,
    evidence: payoff.evidence,
  };
}

function centralPayoffToRunTarget(payoff: KnownCentralAccessPayoff): {
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  scoreAdjustment: number;
  evidence: string[];
} {
  return {
    accessPayoff: payoff.payoff,
    knownAccessState: payoff.knownNoCurrentPayoff
      ? "known_no_current_payoff"
      : payoff.payoff === "fresh"
        ? "fresh"
        : payoff.payoff === "unknown"
          ? "unknown"
          : "known_payoff",
    scoreAdjustment: -payoff.penalty,
    evidence: payoff.evidence,
  };
}

function recommendationForRunTarget(params: {
  targetKind: RunnerRunTargetKind;
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  pathPassability: RunnerPathPassability;
  creditsAfterRun: number;
  economyPosture: RunnerEconomyPosture;
  installedRunPayoff: RunnerInstalledRunPayoff;
  scoreThreat: boolean;
  unproductiveVisibleRunPath: boolean;
  visibleIceHazardPenalty: number;
  visibleIceHazardAvoidanceCost: number;
  creditsAfterAvoidingVisibleIceHazards: number;
  expectedTagsFromVisibleIce: number;
  unavoidableVisibleIceHazardCount: number;
  visibleTraceTagHazardUnavoidable: boolean;
  accessOutcomeMemory?: AccessOutcomeMemoryStatus;
  rankedAccessTarget?: RankedKnownRemoteAccessCandidate;
  blinkRiskAssessment?: BlinkRiskAssessment;
}): RunnerRunTargetRecommendation {
  if (params.pathPassability === "blocked_by_blink_hand_buffer") {
    return "draw_for_damage_buffer";
  }
  if (blinkRiskShouldAvoidRun(params.blinkRiskAssessment)) {
    return "do_not_run_now";
  }
  if (
    params.blinkRiskAssessment &&
    params.blinkRiskAssessment.payoffOverride === "none" &&
    params.blinkRiskAssessment.riskSeverity === "medium" &&
    params.knownAccessState === "known_no_current_payoff"
  ) {
    return "do_not_run_now";
  }
  if (
    params.blinkRiskAssessment &&
    params.blinkRiskAssessment.payoffOverride === "none" &&
    params.blinkRiskAssessment.riskSeverity === "medium"
  ) {
    return "setup_first";
  }
  if (params.unproductiveVisibleRunPath) {
    return "do_not_run_now";
  }
  if (
    params.visibleTraceTagHazardUnavoidable &&
    !highValuePayoff(params.accessPayoff) &&
    !params.scoreThreat
  ) {
    return "gain_credits_first";
  }
  if (
    params.unavoidableVisibleIceHazardCount > 0 &&
    !highValuePayoff(params.accessPayoff) &&
    !params.scoreThreat
  ) {
    return params.expectedTagsFromVisibleIce > 0
      ? "gain_credits_first"
      : "setup_first";
  }
  if (params.pathPassability === "blocked_missing_coverage") {
    return "find_breaker_first";
  }
  if (
    params.pathPassability === "blocked_unpayable" ||
    params.pathPassability === "blocked_unbreakable"
  ) {
    return params.pathPassability === "blocked_unbreakable"
      ? "find_breaker_first"
      : "gain_credits_first";
  }
  if (
    params.targetKind === "remote" &&
    params.accessOutcomeMemory?.invalidationReason ===
      "remote_fingerprint_changed"
  ) {
    return "remote_changed_reassess";
  }
  if (
    params.targetKind === "remote" &&
    params.accessOutcomeMemory?.applies === true &&
    params.accessOutcomeMemory.suppressesPlanBonus
  ) {
    return "declined_trash_memory_active";
  }
  if (params.knownAccessState === "known_no_current_payoff") {
    if (params.targetKind === "remote") {
      if (
        params.rankedAccessTarget?.commitment.reason ===
          "insufficient_credits" ||
        params.rankedAccessTarget?.commitment.reason === "reserve_would_break"
      ) {
        return "gain_credits_first";
      }
      return params.accessPayoff === "trash_unaffordable"
        ? "gain_credits_first"
        : "known_no_current_payoff";
    }
    return params.accessPayoff === "trash_unaffordable"
      ? "gain_credits_first"
      : "do_not_run_now";
  }
  if (
    params.accessPayoff === "score_threat" &&
    params.creditsAfterRun <
      params.economyPosture.creditReservePolicy.contestReserve
  ) {
    return "gain_credits_first";
  }
  if (
    params.targetKind === "rd" &&
    params.knownAccessState === "unknown" &&
    params.pathPassability === "reachable" &&
    params.creditsAfterRun >= 0
  ) {
    return "run_now";
  }
  if (highValuePayoff(params.accessPayoff)) return "run_now";
  if (
    params.creditsAfterRun < params.economyPosture.minimumCreditFloor ||
    params.economyPosture.fundingNeed
  ) {
    return "gain_credits_first";
  }
  if (
    params.installedRunPayoff.immediateAccessValue >= 50 &&
    params.pathPassability === "reachable"
  ) {
    return "run_now";
  }
  if (params.scoreThreat) return "run_now";
  if (params.accessPayoff === "unknown") return "run_if_free";
  return "setup_first";
}

function scoreRunTargetEvaluation(params: {
  targetKind: RunnerRunTargetKind;
  accessPayoff: RunnerAccessPayoff;
  knownAccessState: RunnerKnownAccessState;
  pathPassability: RunnerPathPassability;
  creditsAfterRun: number;
  economyPosture: RunnerEconomyPosture;
  scoreThreat: boolean;
  recommendation: RunnerRunTargetRecommendation;
  multiaccessAvailable: boolean;
  installedRunPayoffScore: number;
  accessPayoffScoreAdjustment: number;
  visibleIceHazardPenalty: number;
  accessOutcomeMemory?: AccessOutcomeMemoryStatus;
  blinkRiskAssessment?: BlinkRiskAssessment;
}): number {
  const payoffScore = scoreForPayoff(params.accessPayoff);
  const pathPenalty =
    params.pathPassability === "reachable"
      ? 0
      : params.pathPassability === "blocked_by_blink_hand_buffer"
        ? -1200
        : -420;
  const reservePenalty =
    params.creditsAfterRun < params.economyPosture.minimumCreditFloor
      ? -160
      : 0;
  const multiaccessBonus = params.multiaccessAvailable ? 80 : 0;
  const installedRunPayoffBonus = params.installedRunPayoffScore;
  const scoreThreatBonus = params.scoreThreat ? 180 : 0;
  const recommendationScore = recommendationRank(params.recommendation) * 20;
  const visibleIceHazardPenalty = -Math.max(0, params.visibleIceHazardPenalty);
  const blinkRiskPenalty = blinkRiskScorePenalty(params.blinkRiskAssessment);
  const accessOutcomeMemoryPenalty =
    params.targetKind === "remote" &&
    params.accessOutcomeMemory?.applies === true &&
    params.accessOutcomeMemory.suppressesPlanBonus
      ? -360
      : 0;
  return (
    payoffScore +
    pathPenalty +
    reservePenalty +
    multiaccessBonus +
    installedRunPayoffBonus +
    scoreThreatBonus +
    params.accessPayoffScoreAdjustment +
    visibleIceHazardPenalty +
    blinkRiskPenalty +
    accessOutcomeMemoryPenalty +
    recommendationScore
  );
}

function scoreForPayoff(payoff: RunnerAccessPayoff): number {
  switch (payoff) {
    case "agenda":
      return 520;
    case "score_threat":
      return 260;
    case "trash_affordable":
    case "fresh":
      return 180;
    case "access_bonus":
      return 140;
    case "unknown":
      return 60;
    case "trash_unaffordable":
      return -120;
    case "known_low_value":
      return -260;
  }
}

function recommendationRank(
  recommendation: RunnerRunTargetRecommendation,
): number {
  switch (recommendation) {
    case "run_now":
      return 6;
    case "run_if_free":
      return 5;
    case "setup_first":
      return 4;
    case "draw_for_damage_buffer":
      return 3;
    case "gain_credits_first":
      return 3;
    case "find_breaker_first":
      return 2;
    case "remote_changed_reassess":
      return 2;
    case "declined_trash_memory_active":
      return 1;
    case "known_no_current_payoff":
      return 1;
    case "do_not_run_now":
      return 1;
  }
}

function pathPassabilityFor(
  path: ReturnType<typeof assessKnownRezzedIcePath>,
): RunnerPathPassability {
  if (!path.blocked) return "reachable";
  if (path.knownPathBlockedByHardUnbrokenEffect) {
    return path.unpayableReason === "ice_unbreakable"
      ? "blocked_unbreakable"
      : "blocked_unpayable";
  }
  if (path.knownPathBlockedByMissingCoverage) return "blocked_missing_coverage";
  if (path.unpayableReason === "ice_unbreakable") return "blocked_unbreakable";
  return "blocked_unpayable";
}

function runnerRunTargetPathIsUnproductive(
  path: ReturnType<typeof assessKnownRezzedIcePath>,
): boolean {
  return (
    path.blocked &&
    path.canReachAccess === false &&
    path.knownPathBlockedByHardUnbrokenEffect === true
  );
}

function stealOrTrashAffordableFor(
  payoff: RunnerAccessPayoff,
): boolean | "unknown" {
  if (payoff === "agenda" || payoff === "trash_affordable") return true;
  if (payoff === "trash_unaffordable") return false;
  return "unknown";
}

function highValuePayoff(payoff: RunnerAccessPayoff): boolean {
  return (
    payoff === "agenda" ||
    payoff === "trash_affordable" ||
    payoff === "fresh" ||
    payoff === "access_bonus" ||
    payoff === "score_threat"
  );
}

function installedRunPayoffForTarget(
  input: AiDecisionInput,
  targetKind: RunnerRunTargetKind,
): RunnerInstalledRunPayoff {
  const values = {
    immediateAccessValue: 0,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
  };
  let multiaccessAvailable = false;
  const evidence = new Set<string>();
  for (const card of input.playerView.own.rig ?? []) {
    if (card.known === false) continue;
    if (!card.definitionId) continue;
    const hint = AI_HINTS_BY_CARD.get(card.definitionId);
    const contribution = hint
      ? installedRunPayoffContributionForHint(hint, targetKind)
      : undefined;
    if (!contribution) continue;
    values.immediateAccessValue += contribution.immediateAccessValue;
    values.futureSetupValue += contribution.futureSetupValue;
    values.purgeTaxValue += contribution.purgeTaxValue;
    values.economyValue += contribution.economyValue;
    values.riskPenalty += contribution.riskPenalty;
    multiaccessAvailable ||= contribution.multiaccessAvailable;
    for (const fact of contribution.evidence) evidence.add(fact);
  }
  const rawScore =
    values.immediateAccessValue +
    values.futureSetupValue +
    values.purgeTaxValue +
    values.economyValue -
    values.riskPenalty;
  const scoreBonus = Math.max(
    0,
    Math.min(INSTALLED_RUN_PAYOFF_SCORE_CAP, rawScore),
  );
  return {
    ...values,
    scoreBonus,
    multiaccessAvailable,
    evidence: [...evidence].sort(),
  };
}

function installedRunPayoffContributionForHint(
  hint: AiCardHint,
  targetKind: RunnerRunTargetKind,
): RunnerInstalledRunPayoff {
  const effects = hint.effects ?? [];
  const contribution: RunnerInstalledRunPayoff = {
    immediateAccessValue: 0,
    futureSetupValue: 0,
    purgeTaxValue: 0,
    economyValue: 0,
    riskPenalty: 0,
    scoreBonus: 0,
    multiaccessAvailable: false,
    evidence: [],
  };
  const successfulRunTriggerMatches = effects.some(
    (effect) =>
      effect.kind === "persistent_counter_effect" &&
      effect.timing === "successful_run" &&
      effectScopeMatchesTarget(effect.scope, targetKind),
  );
  for (const effect of effects) {
    const target = effectTarget(effect);
    if (
      effect.kind === "multiaccess" &&
      effectScopeMatchesTarget(effect.scope, targetKind)
    ) {
      contribution.multiaccessAvailable = true;
      contribution.immediateAccessValue += 90;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:multiaccess`,
      );
      continue;
    }
    if (
      effect.kind === "hq_info" &&
      targetKind === "hq" &&
      effect.timing === "on_access"
    ) {
      contribution.immediateAccessValue += 60;
      contribution.evidence.push("installed_run_payoff:hq:hq_info");
      continue;
    }
    if (
      effect.kind === "topdeck_info" &&
      targetKind === "rd" &&
      (effect.timing === "on_access" || effect.timing === "successful_run")
    ) {
      contribution.immediateAccessValue += 60;
      contribution.evidence.push("installed_run_payoff:rd:topdeck_info");
      continue;
    }
    if (
      effect.kind === "access_replacement" &&
      effectScopeMatchesTarget(effect.scope, targetKind) &&
      (effect.timing === "on_access" || effect.timing === "successful_run")
    ) {
      contribution.immediateAccessValue += 45;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:access_replacement`,
      );
      continue;
    }
    if (
      effect.kind === "persistent_counter_effect" &&
      effect.timing === "on_access" &&
      effectScopeMatchesTarget(effect.scope, targetKind) &&
      (target === "free_trash" ||
        target === "trash_untrashable" ||
        target === "access_trash_pressure")
    ) {
      contribution.immediateAccessValue += 70;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:access_trash`,
      );
      continue;
    }
    if (
      effect.kind === "persistent_counter_effect" &&
      effect.timing === "successful_run" &&
      effectScopeMatchesTarget(effect.scope, targetKind)
    ) {
      contribution.futureSetupValue += 24;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:successful_run_counter`,
      );
      continue;
    }
    if (
      effect.kind === "topdeck_info" &&
      targetKind === "rd" &&
      effect.timing === "start_of_turn"
    ) {
      contribution.futureSetupValue += 35;
      contribution.evidence.push("installed_run_payoff:rd:future_topdeck_info");
      continue;
    }
    if (
      effect.kind === "hq_info" &&
      targetKind === "hq" &&
      effect.timing === "start_of_turn"
    ) {
      contribution.futureSetupValue += 35;
      contribution.evidence.push("installed_run_payoff:hq:future_hq_info");
      continue;
    }
    if (
      effect.kind === "remote_tax" &&
      effectScopeMatchesTarget(effect.scope, targetKind)
    ) {
      contribution.futureSetupValue += targetKind === "remote" ? 45 : 24;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:remote_tax`,
      );
      continue;
    }
    if (
      effect.kind === "global_modifier" &&
      effect.timing === "successful_run" &&
      effect.scope === "ice"
    ) {
      contribution.futureSetupValue += 24;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:break_cost_support`,
      );
      continue;
    }
    if (
      effect.kind === "recurring_economy" &&
      (effectScopeMatchesTarget(effect.scope, targetKind) ||
        successfulRunTriggerMatches)
    ) {
      contribution.economyValue += 28;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:economy_value`,
      );
      continue;
    }
    if (
      effect.kind === "delayed_penalty" &&
      target === "virus_purge" &&
      successfulRunTriggerMatches
    ) {
      contribution.purgeTaxValue += 10;
      contribution.evidence.push(
        `installed_run_payoff:${targetKind}:purge_tax`,
      );
      continue;
    }
    if (
      effect.kind === "run_tax" &&
      effect.scope === "runner" &&
      (effect.timing === "action" || effect.timing === "successful_run")
    ) {
      contribution.riskPenalty += 25;
      contribution.evidence.push(`installed_run_payoff:${targetKind}:risk_tax`);
    }
  }
  const rawScore =
    contribution.immediateAccessValue +
    contribution.futureSetupValue +
    contribution.purgeTaxValue +
    contribution.economyValue -
    contribution.riskPenalty;
  return {
    ...contribution,
    scoreBonus: Math.max(0, Math.min(INSTALLED_RUN_PAYOFF_SCORE_CAP, rawScore)),
  };
}

function effectScopeMatchesTarget(
  scope: string | undefined,
  targetKind: RunnerRunTargetKind,
): boolean {
  if (!scope) return false;
  if (targetKind === "rd" && scope === "rnd") return true;
  if (scope === targetKind) return true;
  if (scope === "server") return true;
  if (targetKind === "remote" && scope === "remote") return true;
  return false;
}

function effectTarget(
  effect: NonNullable<AiCardHint["effects"]>[number],
): string | undefined {
  const target = (effect as Record<string, unknown>).target;
  return typeof target === "string" ? target : undefined;
}

function hasRiskyUniversalPressure(
  params: EvaluateRunnerRunTargetsParams,
): boolean {
  const riskProfile = new Set(params.strategicIntent?.riskProfile ?? []);
  return (
    riskProfile.has("runner.risky_universal_breaker_pressure") ||
    (params.deckCapabilities?.runner?.breakerInventory.some((breaker) => {
      const coverage = new Set(breaker.coverage);
      return coverage.has("universal") && breaker.risks.length > 0;
    }) ??
      false)
  );
}

function runnerCreditReservePhase(
  input: AiDecisionInput,
  remoteScoreThreat: RunnerRemoteScoreThreat,
): RunnerCreditReservePhase {
  if (
    remoteScoreThreat === "urgent" ||
    input.playerView.opponent.agendaPoints >=
      input.playerView.agendaPointsToWin - 2
  ) {
    return "late_contest";
  }
  if (remoteScoreThreat === "visible") return "late_contest";
  return input.playerView.stateVersion <= 8 ? "opening" : "midgame";
}

function runnerRemoteScoreThreat(
  input: AiDecisionInput,
): RunnerRemoteScoreThreat {
  let threat: RunnerRemoteScoreThreat = "none";
  for (const server of input.playerView.servers) {
    if (!server.id.startsWith("remote_")) continue;
    if (server.root.length === 0) continue;
    const advancedRoot = server.root.some(
      (card) => (card.advancementCounters ?? 0) > 0,
    );
    const urgentRoot = server.root.some(
      (card) => (card.advancementCounters ?? 0) >= 2,
    );
    const knownAgenda = server.root.some(
      (card) => card.known && card.type === "agenda",
    );
    if (
      urgentRoot ||
      knownAgenda ||
      input.playerView.opponent.agendaPoints >=
        input.playerView.agendaPointsToWin - 2
    ) {
      return "urgent";
    }
    if (advancedRoot) threat = maxRemoteScoreThreat(threat, "visible");
    else threat = maxRemoteScoreThreat(threat, "possible");
  }
  return threat;
}

function maxRemoteScoreThreat(
  left: RunnerRemoteScoreThreat,
  right: RunnerRemoteScoreThreat,
): RunnerRemoteScoreThreat {
  return remoteScoreThreatRank(right) > remoteScoreThreatRank(left)
    ? right
    : left;
}

function remoteScoreThreatRank(threat: RunnerRemoteScoreThreat): number {
  switch (threat) {
    case "urgent":
      return 3;
    case "visible":
      return 2;
    case "possible":
      return 1;
    case "none":
      return 0;
  }
}

function runnerContestReserve(params: {
  phase: RunnerCreditReservePhase;
  remoteScoreThreat: RunnerRemoteScoreThreat;
  canContestIfFunded: boolean;
}): number {
  if (params.remoteScoreThreat === "none") return 0;
  if (!params.canContestIfFunded) return 0;
  if (params.remoteScoreThreat === "urgent") return 8;
  if (params.remoteScoreThreat === "visible") return 6;
  if (params.phase === "late_contest") return 6;
  return params.canContestIfFunded ? 5 : 4;
}

function runnerEmergencyReserve(input: AiDecisionInput): number {
  return input.playerView.own.tags > 0 ? 3 : 0;
}

function remoteHasScoreThreat(
  server: AiDecisionInput["playerView"]["servers"][number] | undefined,
): boolean {
  if (!server?.id.startsWith("remote_")) return false;
  return server.root.some(
    (card) =>
      card.type === "agenda" ||
      (card.known === false && (card.advancementCounters ?? 0) > 0),
  );
}

function targetKindForServerId(
  serverId: string,
): RunnerRunTargetKind | undefined {
  if (serverId === "hq") return "hq";
  if (serverId === "rd") return "rd";
  if (serverId === "archives") return "archives";
  if (serverId.startsWith("remote_")) return "remote";
  return undefined;
}

function actionServerId(action: LegalAction): string | undefined {
  const value = action.payload?.serverId;
  return typeof value === "string" ? value : undefined;
}

function isBankPayoutAction(action: LegalAction): boolean {
  return (
    (action.type === "trigger_ability" ||
      action.type === "activated_card_ability") &&
    action.payload?.cardImplementationTakesHostedCredits === true
  );
}
