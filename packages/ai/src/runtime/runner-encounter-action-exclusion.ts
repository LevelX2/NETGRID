import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";
import { currentEncounteredIceCard } from "./current-encounter";
import { isUnacceptableImmediateSafetyThreatSubroutine } from "./encounter-subroutine";
import { breakSubroutineIndexesForAction } from "./subroutine-indexes";

export type RunnerEncounterViabilityAssessment = {
  canLeadToBreak: boolean;
  evidence: string[];
};

export type RunnerEncounterBreakAccessAssessment = {
  canPreserveAccessPath: boolean;
  evidence: string[];
};

export type RunnerEncounterActionExclusionDependencies = {
  randomBreakOrDamageBreakExclusion: (
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
    const evidence = new Set(assessment.evidence);
    const remotePayoffBlocked = evidence.has(
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
    const randomBreakExclusion = dependencies.randomBreakOrDamageBreakExclusion(
      input,
      action,
    );
    if (randomBreakExclusion) return randomBreakExclusion;
    if (breakMissesAvailableImmediateSafetyThreat(input, action)) {
      return {
        key: "break_does_not_mitigate_visible_safety_threat",
        label: "Break löst die sichtbare unmittelbare Gefahr nicht",
        reason:
          "encounter_action:break_subroutine|visible_safety_threat_has_exact_break_route:true",
      };
    }
    const assessment = dependencies.breakAccessPathAssessment(input, action);
    if (assessment.canPreserveAccessPath) return undefined;
    const evidence = new Set(assessment.evidence);
    const remotePayoffBlocked = evidence.has(
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

function breakMissesAvailableImmediateSafetyThreat(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const subroutines =
    currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines;
  if (!subroutines?.length) return false;
  const threatenedIndexes = new Set(
    subroutines.flatMap((subroutine, index) =>
      isUnacceptableImmediateSafetyThreatSubroutine(input, subroutine)
        ? [index]
        : [],
    ),
  );
  if (threatenedIndexes.size === 0) return false;
  const actionBreakIndexes = breakSubroutineIndexesForAction(action);
  if ([...actionBreakIndexes].some((index) => threatenedIndexes.has(index))) {
    return false;
  }
  return input.legalActions.some((candidate) => {
    if (candidate.type !== "break_subroutine") return false;
    return [...breakSubroutineIndexesForAction(candidate)].some((index) =>
      threatenedIndexes.has(index),
    );
  });
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
