import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { rolesMatch } from "../role-match";
import { scoreActionGoalFit, type ActionGoalFit } from "./action-goal-fit";
import { synthesizeDoctrineTacticalGoals } from "./doctrine-goal-synthesis";
import { buildAiOpportunityProjections } from "./opportunity-projection";
import type { AiOpportunityProjection } from "./opportunity-projection";
import {
  alignRunTargetAction,
  type RunTargetActionAlignmentTarget,
} from "./run-target-action-alignment";
import {
  componentWeight,
  opportunityPriorityBonus,
  resolveSemanticShadowCalibrationProfile,
  semanticShadowCalibrationProfileEnvEnabled,
  threatSeverityBonus,
  type SemanticShadowCalibrationProfile,
  type SemanticShadowCalibrationProfileId,
} from "./semantic-shadow-calibration";
import type { ScoreComponentDelta } from "./score-components";
import type { SemanticDecisionFrame } from "./semantic-decision-frame";
import { synthesizeNeutralTacticalGoals } from "./neutral-goal-synthesis";
import {
  buildTacticalGoalUtilities,
  type TacticalGoalUtility,
} from "./tactical-goal-utility";
import {
  buildAiThreatProjections,
  type AiThreatProjection,
} from "./threat-projection";
import type {
  SemanticDecisionTrace,
  SemanticDecisionTraceDoctrineGoalSummary,
  SemanticDecisionTraceTargetChoiceShadowSummary,
  SemanticRankedAction,
  SemanticRejectedAction,
} from "./semantic-decision-trace";
import {
  buildTargetChoiceShadowReport,
  TARGET_CHOICE_SHADOW_SCHEMA_VERSION,
  targetChoiceRecommendationForTargetFit,
  type TargetChoiceTargetFitRecommendation,
} from "./target-choice-shadow";

export type BuildSemanticShadowDecisionOptions = {
  calibrationProfile?:
    | SemanticShadowCalibrationProfile
    | SemanticShadowCalibrationProfileId;
  includeDoctrineGoalsInTrace?: boolean;
};

export function buildSemanticShadowDecision(
  frame: SemanticDecisionFrame,
  options: BuildSemanticShadowDecisionOptions = {},
): SemanticDecisionTrace {
  const calibrationProfile = resolveSemanticShadowCalibrationProfile(
    options.calibrationProfile,
  );
  const explicitCalibrationProfile = options.calibrationProfile !== undefined;
  const envCalibrationProfile = semanticShadowCalibrationProfileEnvEnabled();
  const tacticalGoals =
    frame.tacticalGoals.length > 0
      ? frame.tacticalGoals
      : synthesizeNeutralTacticalGoals(frame);
  const utilities = buildTacticalGoalUtilities(tacticalGoals);
  const threats = buildAiThreatProjections(frame);
  const opportunities = buildAiOpportunityProjections(frame);
  const rankedActions: SemanticRankedAction[] = [];
  const rejectedActions: SemanticRejectedAction[] = [];

  for (const candidate of frame.actionCandidates) {
    const fit = bestFitForCandidate(
      candidate,
      utilities,
      frame,
      threats,
      opportunities,
    );
    if (!fit || fit.fitStatus === "blocked") {
      rejectedActions.push({
        actionId: candidate.actionId,
        reason: fit ? "blocked_by_action_goal_fit" : "no_tactical_goal_fit",
        blockers: fit?.blockers ?? ["no_tactical_goal_fit"],
        evidence: fit?.components.flatMap((component) => component.evidence) ?? [
          `candidate:${candidate.semanticActionType}`,
        ],
      });
      continue;
    }
    const contextualComponents = contextualProjectionComponents(
      candidate,
      fit,
      threats,
      opportunities,
      calibrationProfile,
    );
    const score = calibratedScore(fit, contextualComponents, calibrationProfile);
    rankedActions.push({
      actionId: candidate.actionId,
      rank: 0,
      score,
      primaryGoalId: fit.goalId,
      components: [...fit.components, ...contextualComponents],
      blockers: fit.blockers,
      explanation: explainRankedAction(candidate, fit, contextualComponents),
    });
  }

  rankedActions.sort(
    (left, right) =>
      right.score - left.score || left.actionId.localeCompare(right.actionId),
  );
  rankedActions.forEach((action, index) => {
    action.rank = index + 1;
  });
  rejectedActions.sort((left, right) =>
    left.actionId.localeCompare(right.actionId),
  );
  const targetChoiceShadow = targetChoiceShadowTraceSummary(
    frame,
    utilities,
    threats,
    opportunities,
  );
  const doctrineGoals = options.includeDoctrineGoalsInTrace
    ? doctrineGoalTraceSummary(frame)
    : undefined;

  return {
    schemaVersion: "semantic-decision-trace-v1",
    frameSummary: {
      side: frame.side,
      stateVersion: frame.stateVersion,
      ...(frame.profileId ? { profileId: frame.profileId } : {}),
      legalActionCount: frame.legalActionIds.length,
      actionCandidateCount: frame.actionCandidates.length,
      tacticalGoalCount: tacticalGoals.length,
      hiddenInfoPolicy: frame.hiddenInfoPolicy,
      ...(explicitCalibrationProfile || envCalibrationProfile
        ? {
            calibrationProfileId: calibrationProfile.profileId,
            calibrationMode: calibrationProfile.mode,
          }
        : {}),
    },
    rankedActions,
    rejectedActions,
    ...(targetChoiceShadow ? { targetChoiceShadow } : {}),
    ...(doctrineGoals ? { doctrineGoals } : {}),
    noRuntimeEffect: true,
  };
}

function bestFitForCandidate(
  candidate: ActionSemanticCandidate,
  utilities: readonly TacticalGoalUtility[],
  frame: SemanticDecisionFrame,
  threats: readonly AiThreatProjection[],
  opportunities: readonly AiOpportunityProjection[],
): ActionGoalFit | undefined {
  if (utilities.length === 0) return undefined;
  const economyContext = frame.economyContext;
  const targetChoiceRecommendation = targetChoiceRecommendationForCandidate(
    candidate,
    utilities,
    frame,
    threats,
    opportunities,
  );
  return utilities
    .map((utility) =>
      scoreActionGoalFit({
        candidate,
        utility,
        legalActionIds: frame.legalActionIds,
        ...(economyContext?.availableCredits !== undefined
          ? { availableCredits: economyContext.availableCredits }
          : {}),
        ...(economyContext?.creditPressure !== undefined
          ? { creditPressure: economyContext.creditPressure }
          : {}),
        ...(targetChoiceRecommendation
          ? { targetChoiceRecommendation }
          : {}),
      }),
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        fitStatusRank(right.fitStatus) - fitStatusRank(left.fitStatus) ||
        left.goalId.localeCompare(right.goalId),
    )[0];
}

function targetChoiceRecommendationForCandidate(
  candidate: ActionSemanticCandidate,
  utilities: readonly TacticalGoalUtility[],
  frame: SemanticDecisionFrame,
  threats: readonly AiThreatProjection[],
  opportunities: readonly AiOpportunityProjection[],
) {
  const action = syntheticTargetChoiceActionForCandidate(candidate, frame);
  if (!action) return undefined;
  return targetChoiceRecommendationForTargetFit(
    buildTargetChoiceShadowReport({
      action,
      candidate,
      utilityFamilies: utilities.map((utility) => utility.family),
      threats,
      opportunities,
    }),
  );
}

function contextualProjectionComponents(
  candidate: ActionSemanticCandidate,
  fit: ActionGoalFit,
  threats: readonly AiThreatProjection[],
  opportunities: ReturnType<typeof buildAiOpportunityProjections>,
  calibrationProfile: SemanticShadowCalibrationProfile,
): ScoreComponentDelta[] {
  const components: ScoreComponentDelta[] = [];
  const opportunityBonus = opportunities
    .filter((opportunity) => opportunityMatchesCandidate(opportunity, candidate))
    .reduce(
      (sum, opportunity) =>
        sum + opportunityPriorityBonus(calibrationProfile, opportunity.priority),
      0,
    );
  if (opportunityBonus !== 0) {
    components.push({
      component: "opportunity",
      delta: opportunityBonus,
      evidence: [
        `opportunity_bonus:${opportunityBonus}`,
        ...opportunities
          .filter((opportunity) => opportunityMatchesCandidate(opportunity, candidate))
          .flatMap((opportunity) => opportunityAlignmentEvidence(opportunity, candidate)),
      ],
    });
  }
  const threatBonus = threats
    .filter((threat) => threatMatchesFit(threat, fit, candidate))
    .reduce(
      (sum, threat) =>
        sum + threatSeverityBonus(calibrationProfile, threat.severity),
      0,
    );
  if (threatBonus !== 0) {
    components.push({
      component: "threat_response",
      delta: threatBonus,
      evidence: [`threat_response_bonus:${threatBonus}`],
    });
  }
  return components;
}

function calibratedScore(
  fit: ActionGoalFit,
  contextualComponents: readonly ScoreComponentDelta[],
  calibrationProfile: SemanticShadowCalibrationProfile,
): number {
  if (calibrationProfile.profileId === "baseline_v1") {
    return Math.max(
      0,
      Math.round(
        fit.score +
          contextualComponents.reduce(
            (sum, component) => sum + component.delta,
            0,
          ),
      ),
    );
  }
  const weightedFitScore = fit.components.reduce(
    (sum, component) =>
      sum + component.delta * componentWeight(calibrationProfile, component.component),
    0,
  );
  const weightedContextScore = contextualComponents.reduce(
    (sum, component) =>
      sum + component.delta * componentWeight(calibrationProfile, component.component),
    0,
  );
  return Math.max(0, Math.round(weightedFitScore + weightedContextScore));
}

function opportunityMatchesCandidate(
  opportunity: AiOpportunityProjection,
  candidate: ActionSemanticCandidate,
): boolean {
  const opportunityKind = opportunity.opportunity;
  if (
    opportunityKind === "known_agenda_payoff" ||
    opportunityKind === "safe_central_access" ||
    opportunityKind === "remote_contest_window"
  ) {
    return (
      candidate.semanticActionType === "run.start" &&
      targetSpecificRunAlignment(candidate, opportunity).aligned
    );
  }
  if (opportunityKind === "score_window") {
    return candidate.semanticActionType === "score.agenda";
  }
  if (opportunityKind === "economy_window") {
    return candidate.semanticActionType === "economy.gain_credit";
  }
  if (opportunityKind === "setup_window") {
    return (
      candidate.semanticActionType === "install.card" ||
      candidate.semanticActionType === "draw.card"
    );
  }
  if (opportunityKind === "rez_value_window") {
    return candidate.semanticActionType === "corp_window.rez";
  }
  return false;
}

function threatMatchesFit(
  threat: AiThreatProjection,
  fit: ActionGoalFit,
  candidate: ActionSemanticCandidate,
): boolean {
  if (threat.threat === "runner_economy_starvation") {
    return candidate.semanticActionType === "economy.gain_credit";
  }
  if (threat.threat === "runner_flatline_risk") {
    return (
      rolesMatch([fit.goalId], ["survive"]) ||
      candidate.semanticActionType === "draw.card" ||
      candidate.semanticActionType === "run.jack_out"
    );
  }
  if (threat.threat === "runner_no_coverage") {
    return (
      candidate.semanticActionType === "install.card" ||
      candidate.semanticActionType === "draw.card"
    );
  }
  if (threat.threat === "corp_score_window") {
    return (
      candidate.semanticActionType === "run.start" &&
      targetSpecificRunAlignment(candidate, threat).aligned
    );
  }
  if (threat.threat === "corp_low_rez_reserve") {
    return candidate.semanticActionType === "economy.gain_credit";
  }
  return false;
}

function targetSpecificRunAlignment(
  candidate: ActionSemanticCandidate,
  target: RunTargetActionAlignmentTarget,
) {
  return alignRunTargetAction(candidate, target);
}

function opportunityAlignmentEvidence(
  opportunity: AiOpportunityProjection,
  candidate: ActionSemanticCandidate,
): string[] {
  if (
    opportunity.opportunity !== "known_agenda_payoff" &&
    opportunity.opportunity !== "safe_central_access" &&
    opportunity.opportunity !== "remote_contest_window"
  ) {
    return [`opportunity:${opportunity.opportunity}`];
  }
  return [
    `opportunity:${opportunity.opportunity}`,
    ...targetSpecificRunAlignment(candidate, opportunity).evidence,
  ];
}

function explainRankedAction(
  candidate: ActionSemanticCandidate,
  fit: ActionGoalFit,
  contextualComponents: readonly ScoreComponentDelta[],
): string {
  return [
    `semantic:${candidate.semanticActionType}`,
    `goal:${fit.goalId}`,
    `fit:${fit.fitStatus}`,
    ...(contextualComponents.length > 0
      ? [
          `context:${contextualComponents
            .map((component) => component.component)
            .join(",")}`,
        ]
      : []),
  ].join("|");
}

function fitStatusRank(status: ActionGoalFit["fitStatus"]): number {
  switch (status) {
    case "fit":
      return 4;
    case "partial":
      return 3;
    case "irrelevant":
      return 2;
    case "blocked":
      return 1;
  }
}

function targetChoiceShadowTraceSummary(
  frame: SemanticDecisionFrame,
  utilities: readonly TacticalGoalUtility[],
  threats: readonly AiThreatProjection[],
  opportunities: readonly AiOpportunityProjection[],
): SemanticDecisionTraceTargetChoiceShadowSummary | undefined {
  const reports = frame.actionCandidates.flatMap((candidate) => {
    const action = syntheticTargetChoiceActionForCandidate(candidate, frame);
    if (!action) return [];
    return [
      buildTargetChoiceShadowReport({
        action,
        candidate,
        utilityFamilies: utilities.map((utility) => utility.family),
        threats,
        opportunities,
      }),
    ];
  });
  if (reports.length === 0) return undefined;
  const recommendations = reports
    .map(targetChoiceRecommendationForTargetFit)
    .filter(
      (
        recommendation,
      ): recommendation is TargetChoiceTargetFitRecommendation =>
        Boolean(recommendation),
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.actionId.localeCompare(right.actionId) ||
        left.optionId.localeCompare(right.optionId),
    );
  const topReport = reports[0];
  const topOption = topReport?.rankedOptions[0];
  const topRecommendation = recommendations[0];
  const rankedOptionCount = reports.reduce(
    (sum, report) => sum + report.rankedOptions.length,
    0,
  );
  const blockedRequirementCount = reports.reduce(
    (sum, report) => sum + report.blockedRequirements.length,
    0,
  );
  return {
    schemaVersion: TARGET_CHOICE_SHADOW_SCHEMA_VERSION,
    scope: "target_choice_shadow_trace_summary",
    reportOnly: true,
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    actionCount: reports.length,
    rankedOptionCount,
    blockedRequirementCount,
    targetFitRecommendationCount: recommendations.length,
    ...(topReport ? { topActionId: topReport.actionId } : {}),
    ...(topOption ? { topOptionId: topOption.optionId } : {}),
    ...(topRecommendation
      ? { topRecommendationActionId: topRecommendation.actionId }
      : {}),
    ...(topRecommendation
      ? { topRecommendationOptionId: topRecommendation.optionId }
      : {}),
    selectionOutput: {
      selectedChoicesCreated: false,
      selectedTargetsCreated: false,
    },
    evidence: [
      "target_choice_shadow:trace_summary",
      `target_choice_shadow_action_count:${reports.length}`,
      `target_choice_shadow_ranked_option_count:${rankedOptionCount}`,
      `target_choice_shadow_blocked_requirement_count:${blockedRequirementCount}`,
      `target_choice_target_fit_recommendation_count:${recommendations.length}`,
      "selected_choices_created:false",
      "selected_targets_created:false",
    ],
  };
}

function syntheticTargetChoiceActionForCandidate(
  candidate: ActionSemanticCandidate,
  frame: SemanticDecisionFrame,
): LegalAction | undefined {
  const context = candidate.targetContext;
  if (!context || context.hiddenInfoPolicy === "hidden_info_blocked") {
    return undefined;
  }
  const requirementKind = legalTargetRequirementKind(context.targetKind);
  if (!requirementKind) return undefined;
  const side = candidate.actorSide === "corp" ? "corp" : frame.side;
  return {
    actionId: candidate.actionId,
    side,
    type: candidate.actionType as LegalAction["type"],
    label: candidate.actionType,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [
      {
        id: "candidate_target",
        kind: requirementKind,
        visibility: "known_to_actor",
      },
    ],
    visibility: "private_to_actor",
    expiresAtStateVersion: frame.stateVersion,
  };
}

function legalTargetRequirementKind(
  targetKind: NonNullable<ActionSemanticCandidate["targetContext"]>["targetKind"],
): LegalAction["targetRequirements"][number]["kind"] | undefined {
  if (targetKind === "card") return "card";
  if (targetKind === "server") return "server";
  if (targetKind === "subroutine") return "subroutine";
  return undefined;
}

function doctrineGoalTraceSummary(
  frame: SemanticDecisionFrame,
): SemanticDecisionTraceDoctrineGoalSummary | undefined {
  const goals = synthesizeDoctrineTacticalGoals(frame.doctrineDiagnostic);
  if (goals.length === 0) return undefined;
  return {
    scope: "doctrine_goal_trace_summary",
    reportOnly: true,
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    goalCount: goals.length,
    goals: goals.map((goal) => ({
      goalId: goal.goalId,
      family: goal.family,
      priority: goal.priority,
      ...(goal.source ? { source: goal.source } : {}),
      evidence: [...(goal.evidence ?? [])],
    })),
    evidence: [
      "doctrine_goals:trace_summary",
      `doctrine_goal_count:${goals.length}`,
      "productive_use_allowed:false",
    ],
  };
}
