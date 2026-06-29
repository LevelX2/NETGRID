import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { TacticalGoalUtility } from "./tactical-goal-utility";

export type ActionGoalHardGate =
  | "not_in_legal_actions"
  | "hidden_info_required"
  | "cannot_pay"
  | "wrong_timing"
  | "target_context_missing_for_target_profile"
  | "target_context_blocked"
  | "risk_unacceptable"
  | "plan_step_mismatch";

export type ActionGoalHardGateResult = {
  gate: ActionGoalHardGate;
  status: "pass" | "block" | "not_applicable";
  evidence: string[];
};

export type EvaluateActionGoalHardGatesParams = {
  candidate: ActionSemanticCandidate;
  utility: TacticalGoalUtility;
  legalActionIds?: readonly string[];
  availableCredits?: number;
  expectedActionSignals?: readonly string[];
};

export function evaluateActionGoalHardGates(
  params: EvaluateActionGoalHardGatesParams,
): ActionGoalHardGateResult[] {
  return [
    legalActionGate(params),
    hiddenInfoGate(params.candidate),
    costGate(params),
    timingGate(params),
    targetContextGate(params),
    riskGate(params),
    planStepGate(params),
  ];
}

function legalActionGate(
  params: EvaluateActionGoalHardGatesParams,
): ActionGoalHardGateResult {
  if (!params.legalActionIds) {
    return {
      gate: "not_in_legal_actions",
      status: "not_applicable",
      evidence: ["legal_action_ids:not_provided"],
    };
  }
  const legalActionIdSet = new Set(params.legalActionIds);
  const legal = legalActionIdSet.has(params.candidate.actionId);
  return {
    gate: "not_in_legal_actions",
    status: legal ? "pass" : "block",
    evidence: [`action_id:${params.candidate.actionId}`, `legal:${legal}`],
  };
}

function hiddenInfoGate(
  candidate: ActionSemanticCandidate,
): ActionGoalHardGateResult {
  const projectionIssueSet = new Set(candidate.projectionIssues);
  const blocked =
    projectionIssueSet.has("hidden_info_blocked") ||
    candidate.hardGates.some(
      (gate) => gate.gateId === "hidden_info" && gate.status === "block",
    );
  return {
    gate: "hidden_info_required",
    status: blocked ? "block" : "pass",
    evidence: [`hidden_info_blocked:${blocked}`],
  };
}

function costGate(
  params: EvaluateActionGoalHardGatesParams,
): ActionGoalHardGateResult {
  const creditCost = params.candidate.costProfile.creditCost;
  if (creditCost === undefined || params.availableCredits === undefined) {
    return {
      gate: "cannot_pay",
      status: "not_applicable",
      evidence: ["credit_cost_or_available_credits:not_available"],
    };
  }
  const canPay = creditCost <= params.availableCredits;
  return {
    gate: "cannot_pay",
    status: canPay ? "pass" : "block",
    evidence: [`credit_cost:${creditCost}`, `available_credits:${params.availableCredits}`],
  };
}

function timingGate(
  params: EvaluateActionGoalHardGatesParams,
): ActionGoalHardGateResult {
  const blocked =
    params.utility.family === "corp_scoreline" &&
    params.candidate.actorSide !== "corp";
  return {
    gate: "wrong_timing",
    status: blocked ? "block" : "pass",
    evidence: [
      `goal_family:${params.utility.family}`,
      `actor_side:${params.candidate.actorSide}`,
    ],
  };
}

function targetContextGate(
  params: EvaluateActionGoalHardGatesParams,
): ActionGoalHardGateResult {
  const targetContext = params.candidate.targetContext;
  const projectionIssueSet = new Set(params.candidate.projectionIssues);
  const requiresTargetContext =
    params.utility.family === "target_resolution" ||
    ((params.utility.family === "run_access" ||
      params.utility.family === "remote_contest") &&
      projectionIssueSet.has("target_context_unavailable") &&
      (params.candidate.semanticActionType.startsWith("run.") ||
        params.candidate.semanticActionType.startsWith("access.")));
  const hasTargetContext = Boolean(targetContext);
  const contextBlocked =
    targetContext?.hiddenInfoPolicy === "hidden_info_blocked" ||
    targetContext?.targetProfileMatches.some(
      (match) =>
        match.status !== "matched" &&
        match.issues.some(
          (issue) =>
            issue === "hidden_info_blocked" ||
            issue === "target_context_unavailable",
        ),
    ) === true ||
    targetContext?.targetConstraintResults.some(
      (constraint) => constraint.status === "block",
    ) === true;
  if (contextBlocked) {
    return {
      gate: "target_context_blocked",
      status: "block",
      evidence: [
        `hidden_info_policy:${targetContext?.hiddenInfoPolicy ?? "missing"}`,
        `target_profile_blocked:${targetContext?.targetProfileMatches.some((match) => match.status !== "matched") === true}`,
        `target_constraint_blocked:${targetContext?.targetConstraintResults.some((constraint) => constraint.status === "block") === true}`,
      ],
    };
  }
  return {
    gate: "target_context_missing_for_target_profile",
    status: requiresTargetContext && !hasTargetContext ? "block" : "pass",
    evidence: [
      `requires_target_context:${requiresTargetContext}`,
      `has_target_context:${hasTargetContext}`,
    ],
  };
}

function riskGate(
  params: EvaluateActionGoalHardGatesParams,
): ActionGoalHardGateResult {
  const hasHighRisk =
    (params.candidate.costProfile.selfDamage?.length ?? 0) > 0 ||
    params.candidate.risks.some(
      (risk) => risk.severity === "high" || risk.severity === "unknown",
    );
  const unacceptable =
    hasHighRisk &&
    (params.utility.family === "survival" ||
      params.utility.urgency === "critical");
  return {
    gate: "risk_unacceptable",
    status: unacceptable ? "block" : "pass",
    evidence: [
      `high_risk:${hasHighRisk}`,
      `goal_family:${params.utility.family}`,
      `urgency:${params.utility.urgency}`,
    ],
  };
}

function planStepGate(
  params: EvaluateActionGoalHardGatesParams,
): ActionGoalHardGateResult {
  if (!params.expectedActionSignals || params.expectedActionSignals.length === 0) {
    return {
      gate: "plan_step_mismatch",
      status: "not_applicable",
      evidence: ["expected_action_signals:not_provided"],
    };
  }
  const matched = params.expectedActionSignals.some((signal) =>
    candidateMatchesSignal(params.candidate, signal),
  );
  return {
    gate: "plan_step_mismatch",
    status: matched ? "pass" : "block",
    evidence: [
      `expected:${params.expectedActionSignals.join(",")}`,
      `candidate:${params.candidate.semanticActionType}`,
    ],
  };
}

export function candidateMatchesSignal(
  candidate: ActionSemanticCandidate,
  signal: string,
): boolean {
  const actionTacticSignalSet = new Set(candidate.actionTacticSignals);
  const cardContextSignalSet = new Set(candidate.cardContextSignals);
  return (
    candidate.semanticActionType === signal ||
    candidate.semanticActionType.startsWith(`${signal}.`) ||
    actionTacticSignalSet.has(signal) ||
    cardContextSignalSet.has(signal)
  );
}
