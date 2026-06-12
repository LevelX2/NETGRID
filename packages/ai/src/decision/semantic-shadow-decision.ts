import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { scoreActionGoalFit, type ActionGoalFit } from "./action-goal-fit";
import { buildAiOpportunityProjections } from "./opportunity-projection";
import type { AiOpportunityProjection } from "./opportunity-projection";
import {
  alignRunTargetAction,
  type RunTargetActionAlignmentTarget,
} from "./run-target-action-alignment";
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
  SemanticRankedAction,
  SemanticRejectedAction,
} from "./semantic-decision-trace";

export function buildSemanticShadowDecision(
  frame: SemanticDecisionFrame,
): SemanticDecisionTrace {
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
    const fit = bestFitForCandidate(candidate, utilities, frame);
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
    );
    const score = Math.max(
      0,
      Math.round(
        fit.score +
          contextualComponents.reduce(
            (sum, component) => sum + component.delta,
            0,
          ),
      ),
    );
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
    },
    rankedActions,
    rejectedActions,
    noRuntimeEffect: true,
  };
}

function bestFitForCandidate(
  candidate: ActionSemanticCandidate,
  utilities: readonly TacticalGoalUtility[],
  frame: SemanticDecisionFrame,
): ActionGoalFit | undefined {
  if (utilities.length === 0) return undefined;
  const economyContext = frame.economyContext;
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
      }),
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        fitStatusRank(right.fitStatus) - fitStatusRank(left.fitStatus) ||
        left.goalId.localeCompare(right.goalId),
    )[0];
}

function contextualProjectionComponents(
  candidate: ActionSemanticCandidate,
  fit: ActionGoalFit,
  threats: readonly AiThreatProjection[],
  opportunities: ReturnType<typeof buildAiOpportunityProjections>,
): ScoreComponentDelta[] {
  const components: ScoreComponentDelta[] = [];
  const opportunityBonus = opportunities
    .filter((opportunity) => opportunityMatchesCandidate(opportunity, candidate))
    .reduce((sum, opportunity) => sum + priorityBonus(opportunity.priority), 0);
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
    .reduce((sum, threat) => sum + threatBonusForSeverity(threat.severity), 0);
  if (threatBonus !== 0) {
    components.push({
      component: "threat_response",
      delta: threatBonus,
      evidence: [`threat_response_bonus:${threatBonus}`],
    });
  }
  return components;
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
      fit.goalId.includes("survive") ||
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

function priorityBonus(priority: "low" | "medium" | "high" | "critical"): number {
  switch (priority) {
    case "critical":
      return 18;
    case "high":
      return 12;
    case "medium":
      return 6;
    case "low":
      return 2;
  }
}

function threatBonusForSeverity(severity: AiThreatProjection["severity"]): number {
  switch (severity) {
    case "critical":
      return 18;
    case "high":
      return 12;
    case "medium":
      return 6;
    case "low":
      return 2;
  }
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
