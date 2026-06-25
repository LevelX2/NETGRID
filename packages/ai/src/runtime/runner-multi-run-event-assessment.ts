import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";

export type RunnerMultiRunEventAssessment = {
  sourceDefinitionId: string;
  targetServerId: string;
  phase: "first_run" | "followup_run";
  canTakeRun: boolean;
  payoffClass: string;
  value: number;
  evaluation?: RunnerRunTargetEvaluation;
  evidence: string[];
};

export type RunnerMultiRunEventAssessmentDependencies = {
  allNighterDefinitionId: string;
  sourceDefinitionIdForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => string | undefined;
  targetServerId: (action: LegalAction) => string | undefined;
  targetEvaluation: (
    input: AiDecisionInput,
    action: LegalAction,
    targetServerId: string,
  ) => RunnerRunTargetEvaluation | undefined;
  payoffClass: (evaluation: RunnerRunTargetEvaluation | undefined) => string;
  canTakeRun: (evaluation: RunnerRunTargetEvaluation | undefined) => boolean;
  scoreValue: (
    phase: RunnerMultiRunEventAssessment["phase"],
    payoffClass: string,
    canTakeRun: boolean,
  ) => number;
};

export function runnerMultiRunEventAssessment(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerMultiRunEventAssessmentDependencies,
): RunnerMultiRunEventAssessment | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  const sourceDefinitionId = dependencies.sourceDefinitionIdForAction(
    input,
    action,
  );
  const isAllNighterPlay =
    action.type === "play_event" &&
    sourceDefinitionId === dependencies.allNighterDefinitionId;
  const isAllNighterFollowup =
    action.type === "start_run" && action.payload?.bonusRunNoClick === true;
  if (!isAllNighterPlay && !isAllNighterFollowup) return undefined;

  const phase = isAllNighterFollowup ? "followup_run" : "first_run";
  const targetServerId = dependencies.targetServerId(action) ?? "unknown";
  const evaluation =
    targetServerId === "unknown"
      ? undefined
      : dependencies.targetEvaluation(input, action, targetServerId);
  const payoffClass = dependencies.payoffClass(evaluation);
  const canTakeRun = dependencies.canTakeRun(evaluation);
  const evidence = [
    `multiRunEvent:${phase}`,
    `multiRunEvent:source:${sourceDefinitionId || "bonus_run"}`,
    `multiRunEvent:target:${targetServerId}`,
    `multiRunEvent:payoff:${payoffClass}`,
    `multiRunEvent:plausible_run:${canTakeRun}`,
    ...(evaluation
      ? [
          `multiRunEvent:recommendation:${evaluation.recommendation}`,
          `multiRunEvent:path:${evaluation.pathPassability}`,
          `multiRunEvent:access_payoff:${evaluation.accessPayoff}`,
          `multiRunEvent:known_access:${evaluation.knownAccessState}`,
          `multiRunEvent:credits_after:${evaluation.creditsAfterRun}`,
          ...evaluation.evidence.slice(0, 8),
        ]
      : ["multiRunEvent:no_run_target_evaluation"]),
    ...(canTakeRun
      ? [
          payoffClass === "high_payoff"
            ? "multiRunEvent:allowed_high_payoff"
            : "multiRunEvent:allowed_unknown_probe",
        ]
      : phase === "followup_run"
        ? ["multiRunEvent:followup_declined_no_payoff"]
        : ["multiRunEvent:no_plausible_first_run"]),
  ];

  return {
    sourceDefinitionId: sourceDefinitionId || "bonus_run",
    targetServerId,
    phase,
    canTakeRun,
    payoffClass,
    value: dependencies.scoreValue(phase, payoffClass, canTakeRun),
    ...(evaluation ? { evaluation } : {}),
    evidence,
  };
}
