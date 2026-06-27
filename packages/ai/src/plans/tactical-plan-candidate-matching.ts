import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import {
  actionServerId,
  isServerTargetPayloadKey,
} from "./tactical-plan-server-targets";
import type { PlanStep, TacticalPlan } from "./tactical-plan-types";

export function candidateTargetMatchesPlan(
  plan: TacticalPlan,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  if (!plan.target) return true;
  if (plan.target.kind !== "server") return true;
  const payloadServerId = actionServerId(action);
  if (payloadServerId) return payloadServerId === plan.target.id;
  const selectedServer = candidate.targetContext?.selectedTargets.find(
    (target) => target.targetKind === "server",
  );
  if (selectedServer) return selectedServer.targetId === plan.target.id;
  return !candidate.legalActionRef.originalPayloadKeys.some(isServerTargetPayloadKey);
}

export function bankStepMatchesCandidate(
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  if (step.kind !== "build_bank_counter" && step.kind !== "cash_out_bank") {
    return true;
  }
  const evidence = candidate.evidence.join(" ").toLowerCase();
  const signals = [
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    candidate.semanticActionType,
  ].join(" ").toLowerCase();
  const label = action.label.toLowerCase();
  if (step.kind === "build_bank_counter") {
    return (
      label.includes("auf broker legen") ||
      label.includes("put") && label.includes("bank") ||
      evidence.includes("auf broker legen") ||
      signals.includes("bank") ||
      signals.includes("counter_bank") ||
      signals.includes("temporary_resource_bank")
    );
  }
  return (
    label.includes("von broker nehmen") ||
    label.includes("take") && label.includes("bank") ||
    evidence.includes("von broker nehmen") ||
    signals.includes("cash") ||
    signals.includes("payout") ||
    signals.includes("bank")
  );
}
