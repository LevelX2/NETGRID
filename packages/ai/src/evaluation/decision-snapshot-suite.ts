import type { SemanticDecisionFrame } from "../decision/semantic-decision-frame";
import { buildSemanticDecisionFrame } from "../decision/semantic-decision-frame";
import type { SemanticDecisionTrace } from "../decision/semantic-decision-trace";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { findForbiddenSemanticPath } from "../diagnostics/semantic-redaction";
import { buildAiOpportunityProjections } from "../decision/opportunity-projection";
import { buildSemanticShadowDecision } from "../decision/semantic-shadow-decision";
import { buildTacticalGoalUtilities } from "../decision/tactical-goal-utility";
import { buildAiThreatProjections } from "../decision/threat-projection";
import type { DecisionSnapshot } from "./decision-snapshot";
import type {
  AiMistakeClass,
  AiMistakeObservation,
} from "./mistake-taxonomy";

export type DecisionSnapshotEvaluation = {
  snapshotId: string;
  passed: boolean;
  observedMistakes: AiMistakeObservation[];
  preferredGoalFamilyMatched: boolean;
  evidence: string[];
};

export function evaluateDecisionSnapshot(params: {
  snapshot: DecisionSnapshot;
  frame: SemanticDecisionFrame;
  trace: SemanticDecisionTrace;
}): DecisionSnapshotEvaluation {
  const observedMistakes = classifyDecisionTraceMistakes(params.frame, params.trace);
  const forbidden = new Set(params.snapshot.expectedProperties.forbiddenMistakes);
  const preferredGoalFamilyMatched = preferredGoalFamilyMatches(params);
  const failedForbiddenMistakes = observedMistakes.filter((mistake) =>
    forbidden.has(mistake.mistakeClass),
  );
  const passed =
    failedForbiddenMistakes.length === 0 &&
    legalActionInvariantHolds(params.frame, params.trace) &&
    preferredGoalFamilyMatched;
  return {
    snapshotId: params.snapshot.snapshotId,
    passed,
    observedMistakes,
    preferredGoalFamilyMatched,
    evidence: [
      `forbidden_mistakes:${[...forbidden].join(",")}`,
      `observed_mistakes:${observedMistakes.map((mistake) => mistake.mistakeClass).join(",")}`,
      `preferred_goal_family_matched:${preferredGoalFamilyMatched}`,
    ],
  };
}

export function buildDecisionSnapshotFrame(
  snapshot: DecisionSnapshot,
): SemanticDecisionFrame {
  const input = snapshot.inputBuilder();
  if (snapshot.frameBuilder) return snapshot.frameBuilder(input);
  return buildSemanticDecisionFrame({
    input,
    actionCandidates: buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: input.side,
      stateVersion: input.playerView.stateVersion,
    }),
  });
}

export function evaluateDecisionSnapshotFromBuilder(
  snapshot: DecisionSnapshot,
): DecisionSnapshotEvaluation {
  const frame = buildDecisionSnapshotFrame(snapshot);
  return evaluateDecisionSnapshot({
    snapshot,
    frame,
    trace: buildSemanticShadowDecision(frame),
  });
}

export function classifyDecisionTraceMistakes(
  frame: SemanticDecisionFrame,
  trace: SemanticDecisionTrace,
): AiMistakeObservation[] {
  const mistakes: AiMistakeObservation[] = [];
  const legalActionIds = new Set(frame.legalActionIds);
  const topAction = trace.rankedActions[0];
  const topCandidate = topAction
    ? frame.actionCandidates.find((candidate) => candidate.actionId === topAction.actionId)
    : undefined;
  if (!legalActionInvariantHolds(frame, trace)) {
    mistakes.push({
      mistakeClass: "illegal_action",
      ...(topAction?.actionId ? { actionId: topAction.actionId } : {}),
      evidence: ["ranked_or_selected_action_not_in_frame_legal_actions"],
    });
  }
  const hiddenMarkerPath = findForbiddenSemanticPath({ frame, trace }, "snapshot");
  if (hiddenMarkerPath) {
    mistakes.push({
      mistakeClass: "hidden_info_dependency",
      evidence: [`forbidden_marker_path:${hiddenMarkerPath}`],
    });
  }
  const threats = buildAiThreatProjections(frame);
  const opportunities = buildAiOpportunityProjections(frame);
  const topSemantic = topCandidate?.semanticActionType;

  if (
    threats.some((threat) => threat.threat === "runner_economy_starvation") &&
    topSemantic !== "economy.gain_credit" &&
    topSemantic !== "draw.card"
  ) {
    mistakes.push({
      mistakeClass: "economy_starvation",
      ...(topAction?.actionId ? { actionId: topAction.actionId } : {}),
      evidence: [`top_semantic:${topSemantic ?? "none"}`],
    });
  }
  if (
    threats.some(
      (threat) =>
        threat.threat === "runner_flatline_risk" ||
        threat.threat === "runner_no_coverage",
    ) &&
    topSemantic === "run.start"
  ) {
    mistakes.push({
      mistakeClass: "unsafe_run",
      ...(topAction?.actionId ? { actionId: topAction.actionId } : {}),
      evidence: [`top_semantic:${topSemantic}`],
    });
  }
  if (
    opportunities.some((opportunity) => opportunity.opportunity === "safe_central_access") &&
    topSemantic !== "run.start"
  ) {
    mistakes.push({
      mistakeClass: "missed_safe_access",
      ...(topAction?.actionId ? { actionId: topAction.actionId } : {}),
      evidence: [`top_semantic:${topSemantic ?? "none"}`],
    });
  }
  if (
    opportunities.some(
      (opportunity) => opportunity.opportunity === "remote_contest_window",
    ) &&
    topSemantic !== "run.start"
  ) {
    mistakes.push({
      mistakeClass: "ignored_remote_threat",
      ...(topAction?.actionId ? { actionId: topAction.actionId } : {}),
      evidence: [`top_semantic:${topSemantic ?? "none"}`],
    });
  }
  if (
    opportunities.some((opportunity) => opportunity.opportunity === "score_window") &&
    topSemantic !== "score.agenda" &&
    topSemantic !== "score.advance_card"
  ) {
    mistakes.push({
      mistakeClass: "missed_score_window",
      ...(topAction?.actionId ? { actionId: topAction.actionId } : {}),
      evidence: [`top_semantic:${topSemantic ?? "none"}`],
    });
  }
  if (
    threats.some((threat) => threat.threat === "corp_low_rez_reserve") &&
    topSemantic === "corp_window.rez"
  ) {
    mistakes.push({
      mistakeClass: "bad_rez_spend",
      ...(topAction?.actionId ? { actionId: topAction.actionId } : {}),
      evidence: ["corp_low_rez_reserve:top_action_rez"],
    });
  }
  if (
    threats.some((threat) => threat.threat === "runner_flatline_risk") &&
    topSemantic === "run.start"
  ) {
    mistakes.push({
      mistakeClass: "ignored_damage_risk",
      ...(topAction?.actionId ? { actionId: topAction.actionId } : {}),
      evidence: ["flatline_risk:top_action_run"],
    });
  }
  for (const rejected of trace.rejectedActions) {
    const blockerSet = new Set(rejected.blockers);
    if (blockerSet.has("plan_step_mismatch")) {
      mistakes.push({
        mistakeClass: "plan_step_mismatch",
        actionId: rejected.actionId,
        evidence: rejected.evidence,
      });
    }
    if (blockerSet.has("target_context_missing_for_target_profile")) {
      mistakes.push({
        mistakeClass: "target_choice_unavailable",
        actionId: rejected.actionId,
        evidence: rejected.evidence,
      });
    }
  }
  return dedupeMistakes(mistakes.filter((mistake) =>
    mistake.mistakeClass === "illegal_action" ||
    mistake.actionId === undefined ||
    legalActionIds.has(mistake.actionId),
  ));
}

function legalActionInvariantHolds(
  frame: SemanticDecisionFrame,
  trace: SemanticDecisionTrace,
): boolean {
  const legalActionIds = new Set(frame.legalActionIds);
  return (
    trace.rankedActions.every((action) => legalActionIds.has(action.actionId)) &&
    trace.rejectedActions.every((action) => legalActionIds.has(action.actionId)) &&
    (trace.selectedActionId === undefined ||
      legalActionIds.has(trace.selectedActionId))
  );
}

function preferredGoalFamilyMatches(params: {
  snapshot: DecisionSnapshot;
  frame: SemanticDecisionFrame;
  trace: SemanticDecisionTrace;
}): boolean {
  const preferred = params.snapshot.expectedProperties.preferredGoalFamilies;
  if (!preferred || preferred.length === 0) return true;
  const top = params.trace.rankedActions[0];
  if (!top?.primaryGoalId) return false;
  const utilities = buildTacticalGoalUtilities(params.frame.tacticalGoals);
  const topUtility = utilities.find((utility) => utility.goalId === top.primaryGoalId);
  const preferredGoalFamilySet = new Set(preferred);
  return Boolean(topUtility && preferredGoalFamilySet.has(topUtility.family));
}

function dedupeMistakes(
  mistakes: readonly AiMistakeObservation[],
): AiMistakeObservation[] {
  const byKey = new Map<string, AiMistakeObservation>();
  for (const mistake of mistakes) {
    byKey.set(`${mistake.mistakeClass}:${mistake.actionId ?? ""}`, mistake);
  }
  return [...byKey.values()].sort((left, right) =>
    left.mistakeClass.localeCompare(right.mistakeClass) ||
    (left.actionId ?? "").localeCompare(right.actionId ?? ""),
  );
}
