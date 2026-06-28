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
  const signals = candidateBankSignals(candidate);
  if (step.kind === "build_bank_counter") {
    return (
      action.payload?.cardImplementationAddsHostedCredits === true ||
      signals.some((signal) => signalHasTerm(signal, "bank"))
    );
  }
  return (
    action.payload?.cardImplementationTakesHostedCredits === true ||
    signals.some(
      (signal) =>
        signalHasTerm(signal, "cash") ||
        signalHasTerm(signal, "payout") ||
        signalHasTerm(signal, "bank"),
    )
  );
}

function candidateBankSignals(candidate: ActionSemanticCandidate): string[] {
  return [
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    candidate.semanticActionType,
  ].map((signal) => signal.toLocaleLowerCase("en-US"));
}

function signalHasTerm(signal: string, term: string): boolean {
  return signal
    .split(/[.:-]+/)
    .some((segment) => signalSegmentHasTerm(segment, term));
}

function signalSegmentHasTerm(segment: string, term: string): boolean {
  if (segment === term) return true;
  return segment.split("_").filter(Boolean).includes(term);
}
