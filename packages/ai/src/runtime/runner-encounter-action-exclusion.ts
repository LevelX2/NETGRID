import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";

export type RunnerEncounterViabilityAssessment = {
  canLeadToBreak: boolean;
  evidence: string[];
};

export type RunnerEncounterBreakAccessAssessment = {
  canPreserveAccessPath: boolean;
  evidence: string[];
};

export type RunnerEncounterActionExclusionDependencies = {
  blinkBreakExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
  pumpViabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerEncounterViabilityAssessment;
  breakAccessPathAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerEncounterBreakAccessAssessment;
};

export type RunnerEncounterActionExclusionContext = {
  runnerEncounterActionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createRunnerEncounterActionExclusionContext(
  dependencies: RunnerEncounterActionExclusionDependencies,
): RunnerEncounterActionExclusionContext {
  function encounterActionExclusion(
    input: AiDecisionInput,
    action: LegalAction,
  ): SemanticRuntimeExclusion | undefined {
    return runnerEncounterActionExclusion(input, action, dependencies);
  }

  return { runnerEncounterActionExclusion: encounterActionExclusion };
}

export function runnerEncounterActionExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerEncounterActionExclusionDependencies,
): SemanticRuntimeExclusion | undefined {
  if (input.side !== "runner") return undefined;
  if (action.type === "pump_breaker") {
    const assessment = dependencies.pumpViabilityAssessment(input, action);
    if (assessment.canLeadToBreak) return undefined;
    const remotePayoffBlocked = assessment.evidence.includes(
      "encounter_remote_payoff_blocked:true",
    );
    return {
      key: remotePayoffBlocked
        ? "encounter_remote_payoff_unaffordable"
        : "pump_cannot_lead_to_useful_break",
      label: remotePayoffBlocked
        ? "Encounter-Kosten machen Remote-Ziel unbezahlbar"
        : "Pumpen ohne Zugriffspfad",
      reason: sortedUnique([
        "encounter_action:pump_breaker",
        ...assessment.evidence,
      ]).join("|"),
    };
  }
  if (action.type === "break_subroutine") {
    const blinkExclusion = dependencies.blinkBreakExclusion(input, action);
    if (blinkExclusion) return blinkExclusion;
    const assessment = dependencies.breakAccessPathAssessment(input, action);
    if (assessment.canPreserveAccessPath) return undefined;
    const remotePayoffBlocked = assessment.evidence.includes(
      "encounter_remote_payoff_blocked:true",
    );
    return {
      key: remotePayoffBlocked
        ? "encounter_remote_payoff_unaffordable"
        : "break_cannot_preserve_access_path",
      label: remotePayoffBlocked
        ? "Break macht Remote-Ziel unbezahlbar"
        : "Break ohne Zugriffspfad",
      reason: sortedUnique([
        "encounter_action:break_subroutine",
        ...assessment.evidence,
      ]).join("|"),
    };
  }
  return undefined;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
