import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";
import { actionCreditCost } from "./action-cost";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerActionReserveAssessment = {
  actionCost: number;
  immediateCreditGain: number;
  creditsAfterAction: number;
  minimumCreditFloor: number;
  spendingWouldDropBelowReserve: boolean;
  survivalOverride: boolean;
  evidence: string[];
};

export function assessRunnerActionReserve(
  input: AiDecisionInput,
  action: LegalAction,
  candidate?: ActionSemanticCandidate,
): RunnerActionReserveAssessment | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  const actionCost = Math.max(0, actionCreditCost(action));
  const immediateCreditGain = runnerImmediateActionCreditGain(
    action,
    candidate,
  );
  const creditsAfterAction =
    input.playerView.own.credits - actionCost + immediateCreditGain;
  const flatlineRiskLevel =
    runnerDamageThreatAssessment(input).flatlineRisk.level;
  const minimumCreditFloor =
    flatlineRiskLevel === "critical"
      ? 4
      : flatlineRiskLevel === "confirmed"
        ? 3
        : flatlineRiskLevel === "suspected"
          ? 3
          : 2;
  const spendingWouldDropBelowReserve =
    actionCost > 0 && creditsAfterAction < minimumCreditFloor;
  const survivalOverride = runnerActionHasSurvivalOverride(candidate);
  return {
    actionCost,
    immediateCreditGain,
    creditsAfterAction,
    minimumCreditFloor,
    spendingWouldDropBelowReserve,
    survivalOverride,
    evidence: [
      `runner_action_reserve_cost:${actionCost}`,
      `runner_action_reserve_immediate_credit_gain:${immediateCreditGain}`,
      `runner_action_reserve_credits_after:${creditsAfterAction}`,
      `runner_action_reserve_floor:${minimumCreditFloor}`,
      `runner_action_reserve_flatline_risk:${flatlineRiskLevel}`,
      `runner_action_reserve_spending_would_drop:${spendingWouldDropBelowReserve}`,
      `runner_action_reserve_survival_override:${survivalOverride}`,
    ],
  };
}

export function runnerActionReserveExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  candidate?: ActionSemanticCandidate,
  options: { fundedPlanContinuation?: boolean } = {},
): SemanticRuntimeExclusion | undefined {
  if (action.type !== "install_card") return undefined;
  if (
    options.fundedPlanContinuation === true &&
    !runnerActionIsDelayedEconomy(candidate)
  ) {
    return undefined;
  }
  const assessment = assessRunnerActionReserve(input, action, candidate);
  if (
    !assessment?.spendingWouldDropBelowReserve ||
    assessment.survivalOverride
  ) {
    return undefined;
  }
  return {
    key: "runner_install_breaks_credit_floor",
    label: "Installation unterschreitet Credit-Reserve",
    reason: assessment.evidence.join("|"),
  };
}

function runnerActionIsDelayedEconomy(
  candidate: ActionSemanticCandidate | undefined,
): boolean {
  return (candidate?.effectTargets ?? []).some(
    (target) =>
      target.includes("installment_credit") ||
      target.includes("turn_start_credit") ||
      target.includes("deferred_credit"),
  );
}

function runnerImmediateActionCreditGain(
  action: LegalAction,
  candidate: ActionSemanticCandidate | undefined,
): number {
  const payloadGain = Math.max(
    0,
    finiteNumber(action.payload?.gainCreditsAmount),
    finiteNumber(action.payload?.gainedCredits),
  );
  if (payloadGain > 0) return payloadGain;
  if (
    candidate?.semanticActionType === "economy.gain_credit" ||
    candidate?.actionTacticSignals.includes("economy.gain_credit")
  ) {
    return Math.max(0, finiteNumber(action.payload?.amount));
  }
  return 0;
}

function runnerActionHasSurvivalOverride(
  candidate: ActionSemanticCandidate | undefined,
): boolean {
  const signals = [
    ...(candidate?.cardContextSignals ?? []),
    ...(candidate?.actionTacticSignals ?? []),
    ...(candidate?.effectTargets ?? []),
  ];
  return signals.some(
    (signal) =>
      signal === "survival.defense" ||
      signal.includes("damage_prevention") ||
      signal.includes("flatline_prevention"),
  );
}

function finiteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
