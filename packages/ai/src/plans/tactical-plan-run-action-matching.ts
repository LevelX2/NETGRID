import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { candidateSemanticText } from "./tactical-plan-candidate-text";
import { actionServerId } from "./tactical-plan-server-targets";
import type { PlanStep } from "./tactical-plan-types";

export type ActionTypeMatchesStep = (step: PlanStep, actionType: string) => boolean;

export function isRunPlanStep(step: PlanStep): boolean {
  return step.kind === "run_target" || step.kind === "probe_central";
}

export function runPlanStepMatchesAction(
  step: PlanStep,
  candidate: ActionSemanticCandidate,
  action: LegalAction,
  actionTypeMatchesStep: ActionTypeMatchesStep,
): boolean {
  if (!actionTypeMatchesStep(step, candidate.actionType)) return false;
  if (action.type === "start_run") return true;
  if (!actionServerId(action)) return false;
  return actionCandidateCanStartRun(candidate, action);
}

function actionCandidateCanStartRun(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): boolean {
  const text = [
    candidateSemanticText(candidate),
    action.type,
    JSON.stringify(action.payload ?? {}),
  ].join(" ").toLowerCase();
  if (text.includes("path blocked")) return false;
  return /start_run|make_run|make a run|bonus_run|followup_run|run_event|run_action|extra_run|run_bypass|bypass_first_ice|server_specific_|future_run_effect|run_pressure/.test(
    text,
  );
}
