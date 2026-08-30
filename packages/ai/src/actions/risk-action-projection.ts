import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";
import type {
  RandomBreakOrDamageRiskAssessment,
  RandomBreakOrDamageRiskPayoffOverride,
  RandomBreakOrDamageRiskSeverity,
  RunnerAccessPayoff,
  RunnerRandomBreakRecoveryAssessment,
} from "../run-analysis/runner-run-target-types";
import { AI_HINTS_BY_CARD, type AiCardHint } from "../ai-hints";

export type RandomBreakOrDamageRiskProfile = {
  kind: "random_break_or_damage";
  profileId: string;
  successProbabilityPerAttempt: number;
  failureDamageType: "net" | "meat" | "brain";
  maxSingleFailureDamage: number;
};

export const DEFAULT_RANDOM_BREAK_OR_DAMAGE_RISK_PROFILE: RandomBreakOrDamageRiskProfile =
  {
    kind: "random_break_or_damage",
    profileId: "random_break_or_damage:net:0.5:3",
    successProbabilityPerAttempt: 0.5,
    failureDamageType: "net",
    maxSingleFailureDamage: 3,
  };

export function randomBreakOrDamageRiskProfileForDefinitionId(
  definitionId: string | undefined,
): RandomBreakOrDamageRiskProfile | undefined {
  if (!definitionId) return undefined;
  return randomBreakOrDamageRiskProfileForHint(
    AI_HINTS_BY_CARD.get(definitionId),
  );
}

export function randomBreakOrDamageRiskProfileForHint(
  hint: AiCardHint | undefined,
): RandomBreakOrDamageRiskProfile | undefined {
  const outcome = hint?.breakerProfile?.randomOutcome;
  if (!outcome || outcome.kind !== "random_break_or_damage") return undefined;
  return {
    kind: outcome.kind,
    profileId: `${outcome.kind}:${outcome.failureDamageType}:${outcome.successProbabilityPerAttempt}:${outcome.maxSingleFailureDamage}`,
    successProbabilityPerAttempt: outcome.successProbabilityPerAttempt,
    failureDamageType: outcome.failureDamageType,
    maxSingleFailureDamage: outcome.maxSingleFailureDamage,
  };
}

export function buildRandomBreakOrDamageRiskAssessment(params: {
  currentHandCount: number;
  handAfterActionCost: number;
  randomBreakUsesLikely: number;
  visibleSubroutinesLikely: number;
  payoffOverride: RandomBreakOrDamageRiskPayoffOverride;
  stableCoverageAvailable: boolean;
  context: "run_path" | "encounter_break";
  riskProfile: RandomBreakOrDamageRiskProfile;
  unbrokenTargetDamageLikely?: number;
  targetServerId?: string;
  evidence?: readonly string[];
}): RandomBreakOrDamageRiskAssessment {
  const riskProfile = params.riskProfile;
  const maxSingleFailureDamage = Math.max(
    1,
    Math.floor(riskProfile.maxSingleFailureDamage),
  );
  const currentHandCount = Math.max(0, Math.floor(params.currentHandCount));
  const handAfterActionCost = Math.max(
    0,
    Math.floor(params.handAfterActionCost),
  );
  const randomBreakUsesLikely = Math.max(
    1,
    Math.floor(params.randomBreakUsesLikely),
  );
  const unbrokenTargetDamageLikely = Math.max(
    0,
    Math.floor(params.unbrokenTargetDamageLikely ?? 0),
  );
  const visibleSubroutinesLikely = Math.max(
    1,
    Math.floor(params.visibleSubroutinesLikely),
  );
  const worstCaseDamageEstimate =
    randomBreakUsesLikely * maxSingleFailureDamage + unbrokenTargetDamageLikely;
  const lethalOnAnyFailure = handAfterActionCost <= 0;
  const lethalOnHighFailure =
    handAfterActionCost < maxSingleFailureDamage + unbrokenTargetDamageLikely;
  const survivesOneFailedUse =
    handAfterActionCost >= maxSingleFailureDamage + unbrokenTargetDamageLikely;
  const riskSeverity = randomBreakOrDamageRiskSeverityFor({
    handAfterActionCost,
    worstCaseDamageEstimate,
    lethalOnAnyFailure,
    lethalOnHighFailure,
  });
  const lethalRandomBreakDamageFailureRisk =
    lethalOnAnyFailure || lethalOnHighFailure;
  const pathDependsOnRandomBreakOrDamage = !params.stableCoverageAvailable;
  const breakWouldBeExcludedInEncounter =
    pathDependsOnRandomBreakOrDamage &&
    randomBreakOrDamageRiskShouldAvoidRunSeverity(riskSeverity);
  const blockedByHandBuffer =
    pathDependsOnRandomBreakOrDamage &&
    breakWouldBeExcludedInEncounter &&
    params.context === "run_path";
  const noProgressRunExpected =
    blockedByHandBuffer && params.visibleSubroutinesLikely > 0;
  const expectedEtrUnbroken = noProgressRunExpected;
  const recent = params.targetServerId
    ? recentRandomBreakFailureForServer(
        params.targetServerId,
        params.evidence ?? [],
      )
    : { recentFailure: false, recentDamageAmount: 0 };
  const sameServerRepeatedRiskPenalty =
    recent.recentFailure && noProgressRunExpected ? -900 : 0;
  const disposition = blockedByHandBuffer
    ? "why_random_break_damage_run_deferred_for_hand_buffer:self_damage_buffer_too_low"
    : params.payoffOverride !== "none"
      ? `why_random_break_damage_run_allowed_despite_risk:${params.payoffOverride}`
      : randomBreakOrDamageRiskShouldAvoidRunSeverity(riskSeverity)
        ? `why_random_break_damage_run_blocked:${riskSeverity}`
        : "why_random_break_damage_run_allowed_despite_risk:hand_buffer";
  const evidence = [
    "randomBreakDamageRiskApplied:true",
    `randomBreakDamageRiskContext:${params.context}`,
    `currentHandCount:${currentHandCount}`,
    `handAfterActionCost:${handAfterActionCost}`,
    `randomBreakDamageHandBuffer:${handAfterActionCost}`,
    `randomBreakDamageUsesLikely:${randomBreakUsesLikely}`,
    `visibleSubroutinesLikely:${visibleSubroutinesLikely}`,
    `randomBreakOrDamageRiskProfile:${riskProfile.profileId}`,
    `randomBreakOrDamageFailureDamageType:${riskProfile.failureDamageType}`,
    `maxSingleFailureDamage:${maxSingleFailureDamage}`,
    `unbrokenTargetDamageLikely:${unbrokenTargetDamageLikely}`,
    `worstCaseDamageEstimate:${worstCaseDamageEstimate}`,
    `lethalOnAnyFailure:${lethalOnAnyFailure}`,
    `lethalOnHighFailure:${lethalOnHighFailure}`,
    `survivesOneFailedRandomBreakUse:${survivesOneFailedUse}`,
    `randomBreakDamageRiskSeverity:${riskSeverity}`,
    `payoffOverride:${params.payoffOverride}`,
    `stableCoverageAvailable:${params.stableCoverageAvailable}`,
    `lethalRandomBreakDamageFailureRisk:${lethalRandomBreakDamageFailureRisk}`,
    `randomBreakDamagePreRunRiskApplied:${params.context === "run_path"}`,
    `pathDependsOnRandomBreakDamage:${pathDependsOnRandomBreakOrDamage}`,
    `randomBreakDamageExcludedInEncounter:${breakWouldBeExcludedInEncounter}`,
    `blocked_by_random_break_damage_hand_buffer:${blockedByHandBuffer}`,
    `random_break_damage_no_progress_run:${noProgressRunExpected}`,
    `expected_etr_unbroken:${expectedEtrUnbroken}`,
    `recentRandomBreakDamageFailure:${recent.recentFailure}`,
    `recentRandomBreakDamageAmount:${recent.recentDamageAmount}`,
    `sameServerRepeatedRandomBreakDamageRiskPenalty:${sameServerRepeatedRiskPenalty}`,
    disposition,
    ...(blockedByHandBuffer
      ? [
          "random_break_damage_unusable_due_to_hand_buffer:true",
          "recommendation:draw_for_damage_buffer",
          "recommendation:find_stable_breaker_first",
        ]
      : []),
    ...(sameServerRepeatedRiskPenalty < 0
      ? ["repeated_no_progress_random_break_damage_run:true"]
      : []),
    ...(params.evidence ?? []),
  ];

  return {
    currentHandCount,
    handAfterActionCost,
    randomBreakUsesLikely,
    visibleSubroutinesLikely,
    maxSingleFailureDamage,
    unbrokenTargetDamageLikely,
    worstCaseDamageEstimate,
    lethalOnAnyFailure,
    lethalOnHighFailure,
    survivesOneFailedUse,
    riskSeverity,
    payoffOverride: params.payoffOverride,
    stableCoverageAvailable: params.stableCoverageAvailable,
    pathDependsOnRandomBreakOrDamage,
    breakWouldBeExcludedInEncounter,
    blockedByHandBuffer,
    noProgressRunExpected,
    expectedEtrUnbroken,
    recentFailure: recent.recentFailure,
    recentDamageAmount: recent.recentDamageAmount,
    sameServerRepeatedRiskPenalty,
    evidence,
  };
}

export function assessRandomBreakOrDamageRiskForRunAction(
  input: AiDecisionInput,
  action: LegalAction,
  params: { accessPayoff?: RunnerAccessPayoff; scoreThreat?: boolean } = {},
): RandomBreakOrDamageRiskAssessment | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (action.type !== "start_run") return undefined;
  const targetServerId = concretePayloadServerId(action);
  if (!targetServerId) return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  if (!server || server.ice.length <= 0) return undefined;

  return assessRandomBreakOrDamageRiskForVisibleRunPath(input, {
    targetServerId,
    visibleIce: server.ice,
    consumesKnownOwnHandCard: actionConsumesKnownOwnHandCard(input, action),
    ...params,
  });
}

export function assessRandomBreakOrDamageRiskForVisibleRunPath(
  input: AiDecisionInput,
  params: {
    targetServerId: string;
    visibleIce: VisibleServerIce[];
    consumesKnownOwnHandCard?: boolean;
    accessPayoff?: RunnerAccessPayoff;
    scoreThreat?: boolean;
  },
): RandomBreakOrDamageRiskAssessment | undefined {
  if (input.side !== "runner" || params.visibleIce.length <= 0) {
    return undefined;
  }
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === params.targetServerId,
  );
  if (!server) return undefined;
  const rig = input.playerView.own.rig ?? [];
  const riskProfile = randomBreakOrDamageRiskProfilesForRig(rig)[0];
  if (!riskProfile) return undefined;

  const fullPath = assessKnownRezzedIcePath(
    params.visibleIce,
    rig,
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      rig,
    ),
    server.root,
  );
  const visibleBreakworthySubroutineCount =
    visibleRandomBreakCandidateSubroutineCountForPath(params.visibleIce);
  const randomBreakCanAttemptVisiblePath =
    visibleBreakworthySubroutineCount > 0;
  if (
    fullPath.assessedKnownIceCount <= 0 ||
    (!fullPath.canReachAccess && !randomBreakCanAttemptVisiblePath)
  ) {
    return undefined;
  }

  const stableRig = rig.filter(
    (card) => !randomBreakOrDamageRiskProfileForVisibleBreaker(card),
  );
  const stablePath = assessKnownRezzedIcePath(
    params.visibleIce,
    stableRig,
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      stableRig,
    ),
    server.root,
  );
  const stableCoverageAvailable =
    stablePath.assessedKnownIceCount > 0 && stablePath.canReachAccess;
  if (stableCoverageAvailable) return undefined;

  const currentHandCount = input.playerView.own.gripOrHq.length;
  const handAfterActionCost =
    currentHandCount - (params.consumesKnownOwnHandCard === true ? 1 : 0);
  const visibleSubroutinesLikely = Math.max(
    1,
    visibleBreakworthySubroutineCount,
  );
  const payoffOverride = randomBreakOrDamageRiskPayoffOverride(
    params.accessPayoff,
    params.scoreThreat,
  );

  return buildRandomBreakOrDamageRiskAssessment({
    currentHandCount,
    handAfterActionCost,
    randomBreakUsesLikely: visibleSubroutinesLikely,
    visibleSubroutinesLikely,
    payoffOverride,
    stableCoverageAvailable,
    context: "run_path",
    riskProfile,
    targetServerId: params.targetServerId,
    evidence: [
      `randomBreakDamageRunTarget:${params.targetServerId}`,
      `randomBreakDamageStablePathReachable:${stablePath.canReachAccess}`,
      `randomBreakDamageFullPathReachable:${fullPath.canReachAccess}`,
      `randomBreakDamageKnownIceCount:${fullPath.assessedKnownIceCount}`,
      `randomBreakDamagePathCost:${fullPath.visibleBreakCost ?? 0}`,
      ...recentRandomBreakFailureEvidence(input, params.targetServerId),
      ...(params.accessPayoff
        ? [`randomBreakDamageAccessPayoff:${params.accessPayoff}`]
        : []),
      ...(params.scoreThreat !== undefined
        ? [`randomBreakDamageScoreThreat:${params.scoreThreat}`]
        : []),
    ],
  });
}

export function randomBreakOrDamageRiskCanCarryRunPath(
  assessment: RandomBreakOrDamageRiskAssessment | undefined,
): boolean {
  return Boolean(
    assessment?.pathDependsOnRandomBreakOrDamage &&
    !assessment.blockedByHandBuffer &&
    !assessment.breakWouldBeExcludedInEncounter,
  );
}

export function randomBreakOrDamageRiskShouldAvoidRun(
  assessment: RandomBreakOrDamageRiskAssessment | undefined,
): boolean {
  if (!assessment) return false;
  if (
    randomBreakOrDamageRiskShouldAvoidRunSeverity(assessment.riskSeverity) &&
    !randomBreakOrDamageRiskHandBufferOverrideAllowed(assessment.payoffOverride)
  ) {
    return true;
  }
  if (assessment.payoffOverride !== "none") return false;
  return randomBreakOrDamageRiskShouldAvoidRunSeverity(assessment.riskSeverity);
}

export function randomBreakOrDamageRiskScorePenalty(
  assessment: RandomBreakOrDamageRiskAssessment | undefined,
): number {
  if (!assessment) return 0;
  const overrideMultiplier =
    assessment.payoffOverride === "none" ||
    (assessment.blockedByHandBuffer &&
      !randomBreakOrDamageRiskHandBufferOverrideAllowed(
        assessment.payoffOverride,
      ))
      ? 1
      : 0.25;
  const noProgressPenalty = assessment.noProgressRunExpected ? -1700 : 0;
  switch (assessment.riskSeverity) {
    case "lethal":
      return (
        Math.floor(-2400 * overrideMultiplier) +
        noProgressPenalty +
        assessment.sameServerRepeatedRiskPenalty
      );
    case "high":
      return (
        Math.floor(-1800 * overrideMultiplier) +
        noProgressPenalty +
        assessment.sameServerRepeatedRiskPenalty
      );
    case "medium":
      return (
        Math.floor(-640 * overrideMultiplier) +
        assessment.sameServerRepeatedRiskPenalty
      );
    case "low":
      return (
        Math.floor(-160 * overrideMultiplier) +
        assessment.sameServerRepeatedRiskPenalty
      );
    case "none":
      return assessment.sameServerRepeatedRiskPenalty;
  }
}

function randomBreakOrDamageRiskHandBufferOverrideAllowed(
  payoffOverride: RandomBreakOrDamageRiskPayoffOverride,
): boolean {
  return (
    payoffOverride === "known_agenda" || payoffOverride === "immediate_win"
  );
}

function recentRandomBreakFailureEvidence(
  input: AiDecisionInput,
  targetServerId: string,
): string[] {
  const recent = recentRandomBreakFailureFromEvents(input, targetServerId);
  return [
    `recentRandomBreakDamageFailure:${recent.recentFailure}`,
    `recentRandomBreakDamageAmount:${recent.recentDamageAmount}`,
    ...(recent.targetServerId
      ? [`recentRandomBreakDamageFailureTarget:${recent.targetServerId}`]
      : []),
  ];
}

function recentRandomBreakFailureForServer(
  targetServerId: string,
  evidence: readonly string[],
): { recentFailure: boolean; recentDamageAmount: number } {
  const evidenceSet = new Set(evidence);
  const recentFailure =
    evidenceSet.has("recentRandomBreakDamageFailure:true") &&
    evidenceSet.has(`recentRandomBreakDamageFailureTarget:${targetServerId}`);
  return {
    recentFailure,
    recentDamageAmount: recentFailure
      ? numberEvidenceValue(evidence, "recentRandomBreakDamageAmount")
      : 0,
  };
}

function recentRandomBreakFailureFromEvents(
  input: AiDecisionInput,
  targetServerId?: string,
): {
  recentFailure: boolean;
  recentDamageAmount: number;
  targetServerId?: string;
} {
  const history = [
    ...(input.playerView.publicEvents ?? []),
    ...(input.eventTail ?? []),
  ];
  let activeRunServerId: string | undefined;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    const payload = event.publicPayload ?? {};
    const actionType =
      typeof payload.actionType === "string" ? payload.actionType : event.type;
    const actor = typeof payload.actor === "string" ? payload.actor : undefined;
    const serverId = publicEventServerId(payload);
    if (actionType === "start_run" && serverId) {
      activeRunServerId = serverId;
    }
    if (actionType === "end_turn" || actor === "corp") break;
    if (actionType !== "break_subroutine") continue;
    const damageAmount =
      typeof payload.randomBreakOutcomeDamageAmount === "number"
        ? payload.randomBreakOutcomeDamageAmount
        : typeof payload.damageAmount === "number"
          ? payload.damageAmount
          : typeof payload.amount === "number"
            ? payload.amount
            : 0;
    const randomBreakFailure =
      payload.randomBreakOutcomeKind === "random_break_or_damage" &&
      payload.randomBreakOutcomeSuccess === false &&
      damageAmount > 0;
    if (!randomBreakFailure) continue;
    const failureServerId =
      serverId ?? activeRunServerId ?? nearestPriorRunServer(history, index);
    if (
      targetServerId &&
      failureServerId &&
      failureServerId !== targetServerId
    ) {
      continue;
    }
    return {
      recentFailure: true,
      recentDamageAmount: damageAmount,
      ...(failureServerId ? { targetServerId: failureServerId } : {}),
    };
  }
  return { recentFailure: false, recentDamageAmount: 0 };
}

function publicEventServerId(
  payload: Record<string, unknown>,
): string | undefined {
  const serverId =
    typeof payload.serverId === "string"
      ? payload.serverId
      : typeof payload.targetServerId === "string"
        ? payload.targetServerId
        : typeof payload.attackedServerId === "string"
          ? payload.attackedServerId
          : undefined;
  return serverId;
}

function concretePayloadServerId(action: LegalAction): string | undefined {
  const payload = action.payload ?? {};
  const candidates = [
    payload.serverId,
    payload.targetServerId,
    payload.attackedServerId,
  ];
  return candidates.find(
    (candidate): candidate is string => typeof candidate === "string",
  );
}

function nearestPriorRunServer(
  history: AiDecisionInput["eventTail"],
  fromIndex: number,
): string | undefined {
  for (let index = fromIndex - 1; index >= 0; index -= 1) {
    const event = history[index]!;
    const payload = event.publicPayload ?? {};
    const actionType =
      typeof payload.actionType === "string" ? payload.actionType : event.type;
    if (actionType === "start_run") return publicEventServerId(payload);
    if (actionType === "end_turn") return undefined;
  }
  return undefined;
}

function numberEvidenceValue(evidence: readonly string[], key: string): number {
  const prefix = `${key}:`;
  const raw = evidence
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
  const value = raw !== undefined ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function runnerRandomBreakRecoveryAssessment(
  input: AiDecisionInput,
  targetServerId?: string,
): RunnerRandomBreakRecoveryAssessment | undefined {
  if (input.side !== "runner") return undefined;
  const riskProfile = randomBreakOrDamageRiskProfilesForRig(
    input.playerView.own.rig ?? [],
  )[0];
  if (!riskProfile) return undefined;
  const currentHandCount = input.playerView.own.gripOrHq.length;
  const recent = targetServerId
    ? recentRandomBreakFailureFromEvents(input, targetServerId)
    : recentRandomBreakFailureFromEvents(input);
  const handBufferTooLow =
    currentHandCount < riskProfile.maxSingleFailureDamage;
  const active = recent.recentFailure && handBufferTooLow;
  if (!active && !recent.recentFailure) return undefined;
  const sameServerRepeatedRiskPenalty =
    active && targetServerId && recent.targetServerId === targetServerId
      ? -900
      : 0;
  return {
    active,
    ...(targetServerId ? { targetServerId } : {}),
    currentHandCount,
    handBufferTooLow,
    recentFailure: recent.recentFailure,
    recentDamageAmount: recent.recentDamageAmount,
    sameServerRepeatedRiskPenalty,
    evidence: [
      `recentRandomBreakDamageFailure:${recent.recentFailure}`,
      `recentRandomBreakDamageAmount:${recent.recentDamageAmount}`,
      `randomBreakOrDamageRiskProfile:${riskProfile.profileId}`,
      `randomBreakDamageRecoveryHandCount:${currentHandCount}`,
      `randomBreakDamageRecoveryHandBufferTooLow:${handBufferTooLow}`,
      `sameServerRepeatedRandomBreakDamageRiskPenalty:${sameServerRepeatedRiskPenalty}`,
      ...(targetServerId
        ? [`randomBreakDamageRecoveryTarget:${targetServerId}`]
        : []),
      ...(recent.targetServerId
        ? [`randomBreakDamageRecoveryRecentTarget:${recent.targetServerId}`]
        : []),
      ...(active
        ? [
            "why_draw_for_damage_buffer_over_remote_run:recent_random_break_damage",
            "why_random_break_damage_run_deferred_for_hand_buffer:recent_random_break_damage",
          ]
        : []),
      ...(sameServerRepeatedRiskPenalty < 0
        ? ["repeated_no_progress_random_break_damage_run:true"]
        : []),
    ],
  };
}

type VisibleRigCard = NonNullable<
  AiDecisionInput["playerView"]["own"]["rig"]
>[number];
type VisibleServerIce =
  AiDecisionInput["playerView"]["servers"][number]["ice"][number];

function randomBreakOrDamageRiskProfilesForRig(
  rig: readonly VisibleRigCard[],
): RandomBreakOrDamageRiskProfile[] {
  return rig
    .map(randomBreakOrDamageRiskProfileForVisibleBreaker)
    .filter(
      (profile): profile is RandomBreakOrDamageRiskProfile =>
        profile !== undefined,
    );
}

function randomBreakOrDamageRiskProfileForVisibleBreaker(
  card: VisibleRigCard,
): RandomBreakOrDamageRiskProfile | undefined {
  if (!card.known) return undefined;
  return randomBreakOrDamageRiskProfileForDefinitionId(card.definitionId);
}

function actionConsumesKnownOwnHandCard(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  return input.playerView.own.gripOrHq.some(
    (card) => card.known && card.instanceId === action.source,
  );
}

function visibleRandomBreakCandidateSubroutineCountForPath(
  iceCards: readonly VisibleServerIce[],
): number {
  return iceCards.reduce(
    (sum, ice) => sum + visibleRandomBreakCandidateSubroutineCountForIce(ice),
    0,
  );
}

function visibleRandomBreakCandidateSubroutineCountForIce(
  ice: VisibleServerIce,
): number {
  if (!ice.known || ice.rezzed !== true || !ice.definitionId) return 0;
  const quote = ice.effectiveRunQuote;
  if (quote && quote.iceDefinitionId === ice.definitionId) {
    return quote.subroutines.filter(
      (subroutine) =>
        subroutine.type === "end_the_run" ||
        subroutine.type === "end_the_run_unless_runner_pays" ||
        subroutine.unbrokenRunEffect?.causesDamageOrProgramTrash === true,
    ).length;
  }
  return (
    CARD_DEFINITIONS_BY_ID[ice.definitionId]?.subroutines?.filter(
      (subroutine) =>
        subroutine.type === "end_the_run" ||
        subroutine.type === "end_the_run_unless_runner_pays",
    ).length ?? 0
  );
}

function randomBreakOrDamageRiskPayoffOverride(
  accessPayoff: RunnerAccessPayoff | undefined,
  scoreThreat: boolean | undefined,
): RandomBreakOrDamageRiskPayoffOverride {
  if (accessPayoff === "agenda") return "known_agenda";
  if (scoreThreat === true || accessPayoff === "score_threat") {
    return "remote_score_threat";
  }
  return "none";
}

function randomBreakOrDamageRiskSeverityFor(params: {
  handAfterActionCost: number;
  worstCaseDamageEstimate: number;
  lethalOnAnyFailure: boolean;
  lethalOnHighFailure: boolean;
}): RandomBreakOrDamageRiskSeverity {
  if (params.lethalOnAnyFailure) return "lethal";
  if (params.lethalOnHighFailure) return "high";
  if (params.handAfterActionCost < params.worstCaseDamageEstimate) {
    return "medium";
  }
  return params.worstCaseDamageEstimate > 0 ? "low" : "none";
}

function randomBreakOrDamageRiskShouldAvoidRunSeverity(
  riskSeverity: RandomBreakOrDamageRiskSeverity,
): boolean {
  return riskSeverity === "lethal" || riskSeverity === "high";
}
