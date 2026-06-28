import type { LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
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
  const signals = runStartSignals(candidate, action);
  if (signals.some((signal) => signalHasBoundedPhrase(signal, ["path", "blocked"]))) {
    return false;
  }
  return signals.some(signalMatchesRunStart);
}

const RUN_START_SIGNAL_CODES = new Set([
  "start_run",
  "make_run",
  "bonus_run",
  "followup_run",
  "run_event",
  "run_action",
  "extra_run",
  "run_bypass",
  "bypass_first_ice",
  "future_run_effect",
  "run_pressure",
]);

function runStartSignals(
  candidate: ActionSemanticCandidate,
  action: LegalAction,
): string[] {
  return [
    action.type,
    candidate.semanticActionType,
    candidate.sourceCardId,
    candidate.abilityId,
    ...candidate.cardContextSignals,
    ...candidate.actionTacticSignals,
    ...candidate.strategySupport.map((entry) => `${entry.strategyId}:${entry.role}`),
    ...candidate.conditions.map((entry) => entry.kind),
    ...candidate.risks.map((entry) => entry.kind),
    ...candidate.constraints.map((entry) => entry.kind),
    ...candidate.costProfile.additionalCosts,
    ...(candidate.targetContext?.targetProfileMatches.flatMap((entry) => entry.evidence) ?? []),
    ...candidate.evidence,
    ...payloadRunSignals(action),
  ].filter((entry): entry is string => typeof entry === "string");
}

function payloadRunSignals(action: LegalAction): string[] {
  const signals = action.payload?.runActionSignals;
  if (typeof signals === "string") return [signals];
  if (Array.isArray(signals)) {
    return signals.filter((signal): signal is string => typeof signal === "string");
  }
  return [];
}

function signalMatchesRunStart(signal: string): boolean {
  return (
    signalSegments(signal).some(
      (segment) =>
        RUN_START_SIGNAL_CODES.has(segment) ||
        (segment.startsWith("server_specific_") &&
          segment.length > "server_specific_".length),
    ) || signalHasBoundedPhrase(signal, ["make", "a", "run"])
  );
}

function signalSegments(signal: string): string[] {
  return signal
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9_]+/)
    .filter((segment) => segment.length > 0);
}

function signalHasBoundedPhrase(signal: string, phrase: readonly string[]): boolean {
  const words = signal
    .toLocaleLowerCase("en-US")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0);
  return words.some((_, index) =>
    phrase.every((word, offset) => words[index + offset] === word),
  );
}
