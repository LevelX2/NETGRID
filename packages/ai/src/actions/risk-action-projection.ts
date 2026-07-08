import {
  DEMO_CARDS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import {
  assessKnownRezzedIcePath,
  runnerRunPathCreditBudgetWithVisiblePools,
} from "../visible-run-analysis";
import type {
  BlinkRiskAssessment,
  BlinkRiskPayoffOverride,
  BlinkRiskSeverity,
  RunnerAccessPayoff,
  RunnerBlinkRecoveryAssessment,
} from "../runner-run-target-evaluation";

export const BLINK_CARD_ID = "onr_v1_007_blink";

export type RandomBreakOrDamageRiskProfile = {
  kind: "random_break_or_damage";
  profileId: "blink";
  definitionIds: readonly string[];
  failureDamageType: "net";
  maxSingleFailureDamage: number;
};

export const BLINK_RANDOM_BREAK_OR_DAMAGE_RISK_PROFILE: RandomBreakOrDamageRiskProfile =
  {
    kind: "random_break_or_damage",
    profileId: "blink",
    definitionIds: [BLINK_CARD_ID],
    failureDamageType: "net",
    maxSingleFailureDamage: 3,
  };

const RANDOM_BREAK_OR_DAMAGE_RISK_PROFILES = [
  BLINK_RANDOM_BREAK_OR_DAMAGE_RISK_PROFILE,
] as const;

export function randomBreakOrDamageRiskProfileForDefinitionId(
  definitionId: string | undefined,
): RandomBreakOrDamageRiskProfile | undefined {
  if (!definitionId) return undefined;
  return RANDOM_BREAK_OR_DAMAGE_RISK_PROFILES.find((profile) => {
    const definitionIdSet = new Set(profile.definitionIds);
    return definitionIdSet.has(definitionId);
  });
}

export function buildBlinkRiskAssessment(params: {
  currentHandCount: number;
  handAfterActionCost: number;
  blinkUsesLikely: number;
  visibleSubroutinesLikely: number;
  payoffOverride: BlinkRiskPayoffOverride;
  stableCoverageAvailable: boolean;
  context: "run_path" | "encounter_break";
  riskProfile?: RandomBreakOrDamageRiskProfile;
  targetServerId?: string;
  evidence?: readonly string[];
}): BlinkRiskAssessment {
  const riskProfile =
    params.riskProfile ?? BLINK_RANDOM_BREAK_OR_DAMAGE_RISK_PROFILE;
  const maxSingleFailureDamage = Math.max(
    1,
    Math.floor(riskProfile.maxSingleFailureDamage),
  );
  const currentHandCount = Math.max(0, Math.floor(params.currentHandCount));
  const handAfterActionCost = Math.max(
    0,
    Math.floor(params.handAfterActionCost),
  );
  const blinkUsesLikely = Math.max(1, Math.floor(params.blinkUsesLikely));
  const visibleSubroutinesLikely = Math.max(
    1,
    Math.floor(params.visibleSubroutinesLikely),
  );
  const worstCaseDamageEstimate = blinkUsesLikely * maxSingleFailureDamage;
  const lethalOnAnyFailure = handAfterActionCost <= 0;
  const lethalOnHighFailure = handAfterActionCost <= 2;
  const survivesOneFailedBlinkUse =
    handAfterActionCost >= maxSingleFailureDamage;
  const riskSeverity = blinkRiskSeverityFor({
    handAfterActionCost,
    worstCaseDamageEstimate,
    lethalOnAnyFailure,
    lethalOnHighFailure,
  });
  const lethalBlinkFailureRisk = lethalOnAnyFailure || lethalOnHighFailure;
  const pathDependsOnBlink = !params.stableCoverageAvailable;
  const breakWouldBeExcludedInEncounter =
    pathDependsOnBlink && blinkRiskShouldAvoidRunSeverity(riskSeverity);
  const blockedByHandBuffer =
    pathDependsOnBlink &&
    breakWouldBeExcludedInEncounter &&
    params.context === "run_path";
  const noProgressRunExpected =
    blockedByHandBuffer && params.visibleSubroutinesLikely > 0;
  const expectedEtrUnbroken = noProgressRunExpected;
  const recent = params.targetServerId
    ? recentBlinkFailureForServer(params.targetServerId, params.evidence ?? [])
    : { recentFailure: false, recentDamageAmount: 0 };
  const sameServerRepeatedRiskPenalty =
    recent.recentFailure && noProgressRunExpected ? -900 : 0;
  const disposition = blockedByHandBuffer
    ? "why_blink_run_deferred_for_hand_buffer:self_net_damage_buffer_too_low"
    : params.payoffOverride !== "none"
      ? `why_blink_run_allowed_despite_risk:${params.payoffOverride}`
      : blinkRiskShouldAvoidRunSeverity(riskSeverity)
        ? `why_blink_run_blocked:${riskSeverity}`
        : "why_blink_run_allowed_despite_risk:hand_buffer";
  const evidence = [
    "blinkRiskApplied:true",
    `blinkRiskContext:${params.context}`,
    `currentHandCount:${currentHandCount}`,
    `handAfterActionCost:${handAfterActionCost}`,
    `blinkHandBuffer:${handAfterActionCost}`,
    `blinkUsesLikely:${blinkUsesLikely}`,
    `visibleSubroutinesLikely:${visibleSubroutinesLikely}`,
    `randomBreakOrDamageRiskProfile:${riskProfile.profileId}`,
    `randomBreakOrDamageFailureDamageType:${riskProfile.failureDamageType}`,
    `maxSingleFailureDamage:${maxSingleFailureDamage}`,
    `worstCaseDamageEstimate:${worstCaseDamageEstimate}`,
    `lethalOnAnyFailure:${lethalOnAnyFailure}`,
    `lethalOnHighFailure:${lethalOnHighFailure}`,
    `survivesOneFailedBlinkUse:${survivesOneFailedBlinkUse}`,
    `blinkRiskSeverity:${riskSeverity}`,
    `payoffOverride:${params.payoffOverride}`,
    `stableCoverageAvailable:${params.stableCoverageAvailable}`,
    `lethalBlinkFailureRisk:${lethalBlinkFailureRisk}`,
    `blinkPreRunRiskApplied:${params.context === "run_path"}`,
    `blinkPathDependsOnBlink:${pathDependsOnBlink}`,
    `blinkBreakWouldBeExcludedInEncounter:${breakWouldBeExcludedInEncounter}`,
    `blocked_by_blink_hand_buffer:${blockedByHandBuffer}`,
    `blink_no_progress_run:${noProgressRunExpected}`,
    `expected_etr_unbroken:${expectedEtrUnbroken}`,
    `recentBlinkFailure:${recent.recentFailure}`,
    `recentBlinkDamageAmount:${recent.recentDamageAmount}`,
    `sameServerRepeatedBlinkRiskPenalty:${sameServerRepeatedRiskPenalty}`,
    disposition,
    ...(blockedByHandBuffer
      ? [
          "blink_break_unusable_due_to_hand_buffer:true",
          "recommendation:draw_for_damage_buffer",
          "recommendation:find_stable_breaker_first",
        ]
      : []),
    ...(sameServerRepeatedRiskPenalty < 0
      ? ["repeated_no_progress_blink_run:true"]
      : []),
    ...(params.evidence ?? []),
  ];

  return {
    currentHandCount,
    handAfterActionCost,
    blinkUsesLikely,
    visibleSubroutinesLikely,
    maxSingleFailureDamage,
    worstCaseDamageEstimate,
    lethalOnAnyFailure,
    lethalOnHighFailure,
    survivesOneFailedBlinkUse,
    riskSeverity,
    payoffOverride: params.payoffOverride,
    stableCoverageAvailable: params.stableCoverageAvailable,
    pathDependsOnBlink,
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

export function assessBlinkRiskForRunAction(
  input: AiDecisionInput,
  action: LegalAction,
  params: { accessPayoff?: RunnerAccessPayoff; scoreThreat?: boolean } = {},
): BlinkRiskAssessment | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (action.type !== "start_run") return undefined;
  const targetServerId = concretePayloadServerId(action);
  if (!targetServerId) return undefined;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === targetServerId,
  );
  if (!server || server.ice.length <= 0) return undefined;
  const rig = input.playerView.own.rig ?? [];
  const riskProfile = randomBreakOrDamageRiskProfilesForRig(rig)[0];
  if (!riskProfile) return undefined;

  const fullPath = assessKnownRezzedIcePath(
    server.ice,
    rig,
    runnerRunPathCreditBudgetWithVisiblePools(
      input.playerView.own.credits,
      rig,
    ),
    server.root,
  );
  const visibleEndRunSubroutineCount = visibleEndRunSubroutineCountForPath(
    server.ice,
  );
  const blinkCanAttemptVisibleEtrPath = visibleEndRunSubroutineCount > 0;
  if (
    fullPath.assessedKnownIceCount <= 0 ||
    (!fullPath.canReachAccess && !blinkCanAttemptVisibleEtrPath)
  ) {
    return undefined;
  }

  const stableRig = rig.filter(
    (card) => !randomBreakOrDamageRiskProfileForVisibleBreaker(card),
  );
  const stablePath = assessKnownRezzedIcePath(
    server.ice,
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
    currentHandCount - (actionConsumesKnownOwnHandCard(input, action) ? 1 : 0);
  const visibleSubroutinesLikely = Math.max(1, visibleEndRunSubroutineCount);
  const payoffOverride = blinkRiskPayoffOverride(
    params.accessPayoff,
    params.scoreThreat,
  );

  return buildBlinkRiskAssessment({
    currentHandCount,
    handAfterActionCost,
    blinkUsesLikely: visibleSubroutinesLikely,
    visibleSubroutinesLikely,
    payoffOverride,
    stableCoverageAvailable,
    context: "run_path",
    riskProfile,
    targetServerId,
    evidence: [
      `blinkRunTarget:${targetServerId}`,
      `blinkRiskStablePathReachable:${stablePath.canReachAccess}`,
      `blinkRiskFullPathReachable:${fullPath.canReachAccess}`,
      `blinkRiskKnownIceCount:${fullPath.assessedKnownIceCount}`,
      `blinkRiskPathCost:${fullPath.visibleBreakCost ?? 0}`,
      ...recentBlinkFailureEvidence(input, targetServerId),
      ...(params.accessPayoff
        ? [`blinkRiskAccessPayoff:${params.accessPayoff}`]
        : []),
      ...(params.scoreThreat !== undefined
        ? [`blinkRiskScoreThreat:${params.scoreThreat}`]
        : []),
    ],
  });
}

export function blinkRiskShouldAvoidRun(
  assessment: BlinkRiskAssessment | undefined,
): boolean {
  if (!assessment) return false;
  if (
    assessment.blockedByHandBuffer &&
    !blinkRiskHandBufferOverrideAllowed(assessment.payoffOverride)
  ) {
    return true;
  }
  if (assessment.payoffOverride !== "none") return false;
  return blinkRiskShouldAvoidRunSeverity(assessment.riskSeverity);
}

export function blinkRiskScorePenalty(
  assessment: BlinkRiskAssessment | undefined,
): number {
  if (!assessment) return 0;
  const overrideMultiplier =
    assessment.payoffOverride === "none" ||
    (assessment.blockedByHandBuffer &&
      !blinkRiskHandBufferOverrideAllowed(assessment.payoffOverride))
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

function blinkRiskHandBufferOverrideAllowed(
  payoffOverride: BlinkRiskPayoffOverride,
): boolean {
  return (
    payoffOverride === "known_agenda" || payoffOverride === "immediate_win"
  );
}

function recentBlinkFailureEvidence(
  input: AiDecisionInput,
  targetServerId: string,
): string[] {
  const recent = recentBlinkFailureFromEvents(input, targetServerId);
  return [
    `recentBlinkFailure:${recent.recentFailure}`,
    `recentBlinkDamageAmount:${recent.recentDamageAmount}`,
    ...(recent.targetServerId
      ? [`recentBlinkFailureTarget:${recent.targetServerId}`]
      : []),
  ];
}

function recentBlinkFailureForServer(
  targetServerId: string,
  evidence: readonly string[],
): { recentFailure: boolean; recentDamageAmount: number } {
  const evidenceSet = new Set(evidence);
  const recentFailure =
    evidenceSet.has("recentBlinkFailure:true") &&
    evidenceSet.has(`recentBlinkFailureTarget:${targetServerId}`);
  return {
    recentFailure,
    recentDamageAmount: recentFailure
      ? numberEvidenceValue(evidence, "recentBlinkDamageAmount")
      : 0,
  };
}

function recentBlinkFailureFromEvents(
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
      typeof payload.blinkDamageAmount === "number"
        ? payload.blinkDamageAmount
        : typeof payload.damageAmount === "number"
          ? payload.damageAmount
          : typeof payload.amount === "number"
            ? payload.amount
            : 0;
    const blinkFailure =
      payload.blinkBreakSuccess === false ||
      (payload.sourceDefinitionId === BLINK_CARD_ID &&
        payload.damageType === "net" &&
        damageAmount > 0);
    if (!blinkFailure) continue;
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

export function runnerBlinkRecoveryAssessment(
  input: AiDecisionInput,
  targetServerId?: string,
): RunnerBlinkRecoveryAssessment | undefined {
  if (input.side !== "runner") return undefined;
  const riskProfile = BLINK_RANDOM_BREAK_OR_DAMAGE_RISK_PROFILE;
  const currentHandCount = input.playerView.own.gripOrHq.length;
  const recent = targetServerId
    ? recentBlinkFailureFromEvents(input, targetServerId)
    : recentBlinkFailureFromEvents(input);
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
      `recentBlinkFailure:${recent.recentFailure}`,
      `recentBlinkDamageAmount:${recent.recentDamageAmount}`,
      `randomBreakOrDamageRiskProfile:${riskProfile.profileId}`,
      `blinkRecoveryHandCount:${currentHandCount}`,
      `blinkRecoveryHandBufferTooLow:${handBufferTooLow}`,
      `sameServerRepeatedBlinkRiskPenalty:${sameServerRepeatedRiskPenalty}`,
      ...(targetServerId ? [`blinkRecoveryTarget:${targetServerId}`] : []),
      ...(recent.targetServerId
        ? [`blinkRecoveryRecentTarget:${recent.targetServerId}`]
        : []),
      ...(active
        ? [
            "why_draw_for_damage_buffer_over_remote_run:recent_blink_damage",
            "why_blink_run_deferred_for_hand_buffer:recent_blink_damage",
          ]
        : []),
      ...(sameServerRepeatedRiskPenalty < 0
        ? ["repeated_no_progress_blink_run:true"]
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

function visibleEndRunSubroutineCountForPath(
  iceCards: readonly VisibleServerIce[],
): number {
  return iceCards.reduce(
    (sum, ice) => sum + visibleEndRunSubroutineCountForIce(ice),
    0,
  );
}

function visibleEndRunSubroutineCountForIce(ice: VisibleServerIce): number {
  if (!ice.known || ice.rezzed !== true || !ice.definitionId) return 0;
  const quote = ice.effectiveRunQuote;
  if (quote && quote.iceDefinitionId === ice.definitionId) {
    return quote.subroutines.filter(
      (subroutine) =>
        subroutine.type === "end_the_run" ||
        subroutine.type === "end_the_run_unless_runner_pays",
    ).length;
  }
  return (
    DEMO_CARDS_BY_ID[ice.definitionId]?.subroutines?.filter(
      (subroutine) =>
        subroutine.type === "end_the_run" ||
        subroutine.type === "end_the_run_unless_runner_pays",
    ).length ?? 0
  );
}

function blinkRiskPayoffOverride(
  accessPayoff: RunnerAccessPayoff | undefined,
  scoreThreat: boolean | undefined,
): BlinkRiskPayoffOverride {
  if (accessPayoff === "agenda") return "known_agenda";
  if (scoreThreat === true || accessPayoff === "score_threat") {
    return "remote_score_threat";
  }
  return "none";
}

function blinkRiskSeverityFor(params: {
  handAfterActionCost: number;
  worstCaseDamageEstimate: number;
  lethalOnAnyFailure: boolean;
  lethalOnHighFailure: boolean;
}): BlinkRiskSeverity {
  if (params.lethalOnAnyFailure) return "lethal";
  if (params.lethalOnHighFailure) return "high";
  if (params.handAfterActionCost < params.worstCaseDamageEstimate) {
    return "medium";
  }
  return params.worstCaseDamageEstimate > 0 ? "low" : "none";
}

function blinkRiskShouldAvoidRunSeverity(
  riskSeverity: BlinkRiskSeverity,
): boolean {
  return riskSeverity === "lethal" || riskSeverity === "high";
}
