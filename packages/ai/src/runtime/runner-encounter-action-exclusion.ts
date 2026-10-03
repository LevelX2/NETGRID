import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { SemanticRuntimeExclusion } from "./semantic-runtime-types";
import {
  currentEncounteredIceCard,
  currentEncounterNextOnlySubroutineHasNoTarget,
  currentEncounterRequiresFullBreak,
} from "./current-encounter";
import { encounterRunRemainderEffectAssessment } from "./runner-run-remainder-effect-assessment";
import { isUnacceptableImmediateSafetyThreatSubroutine } from "./encounter-subroutine";
import { breakSubroutineIndexesForAction } from "./subroutine-indexes";
import { currentEncounterMitigationForAction } from "./runner-encounter-mitigation";

export type RunnerEncounterViabilityAssessment = {
  canLeadToBreak: boolean;
  evidence: string[];
  constraint?: RunnerEncounterActionConstraint;
};

export type RunnerEncounterBreakAccessAssessment = {
  canPreserveAccessPath: boolean;
  evidence: string[];
  constraint?: RunnerEncounterActionConstraint;
};

export type RunnerEncounterActionConstraint =
  | "remote_payoff_reserve"
  | "turn_reserve";

export type RunnerEncounterActionExclusionDependencies = {
  randomBreakOrDamageBreakExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => SemanticRuntimeExclusion | undefined;
  pumpViabilityAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
    requiredHandFloor?: number,
  ) => RunnerEncounterViabilityAssessment;
  breakAccessPathAssessment: (
    input: AiDecisionInput,
    action: LegalAction,
    requiredHandFloor?: number,
  ) => RunnerEncounterBreakAccessAssessment;
};

export type RunnerEncounterActionExclusionContext = {
  runnerEncounterActionExclusion: (
    input: AiDecisionInput,
    action: LegalAction,
    requiredHandFloor?: number,
  ) => SemanticRuntimeExclusion | undefined;
};

export function createRunnerEncounterActionExclusionContext(
  dependencies: RunnerEncounterActionExclusionDependencies,
): RunnerEncounterActionExclusionContext {
  function encounterActionExclusion(
    input: AiDecisionInput,
    action: LegalAction,
    requiredHandFloor?: number,
  ): SemanticRuntimeExclusion | undefined {
    return runnerEncounterActionExclusion(
      input,
      action,
      dependencies,
      requiredHandFloor,
    );
  }

  return { runnerEncounterActionExclusion: encounterActionExclusion };
}

export function runnerEncounterActionExclusion(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerEncounterActionExclusionDependencies,
  requiredHandFloor?: number,
): SemanticRuntimeExclusion | undefined {
  if (input.side !== "runner") return undefined;
  if (action.type === "pump_breaker") {
    const assessment = dependencies.pumpViabilityAssessment(
      input,
      action,
      requiredHandFloor,
    );
    if (assessment.canLeadToBreak) return undefined;
    return {
      key:
        assessment.constraint === "remote_payoff_reserve"
          ? "encounter_remote_payoff_reserve_would_break"
          : assessment.constraint === "turn_reserve"
            ? "encounter_reserve_would_break"
            : "pump_cannot_lead_to_useful_break",
      label:
        assessment.constraint === "remote_payoff_reserve"
          ? "Encounter-Kosten unterschreiten die gebundene Remote-Reserve"
          : assessment.constraint === "turn_reserve"
            ? "Encounter-Kosten unterschreiten die Zugreserve"
            : "Pumpen ohne Zugriffspfad",
      reason: sortedUnique([
        "encounter_action:pump_breaker",
        ...assessment.evidence,
      ]).join("|"),
    };
  }
  if (action.type === "break_subroutine") {
    const deferred =
      encounterRunRemainderEffectAssessment(input, action)
        .deferredFullBreakSubroutineIndexes ?? [];
    const targetIndexes = breakSubroutineIndexesForAction(action);
    if (
      targetIndexes.size > 0 &&
      [...targetIndexes].every((index) => deferred.includes(index))
    ) {
      return {
        key: "break_effect_has_cheaper_full_break_continuation",
        label: "Der vollständige Folge-Break erfüllt den Effekt günstiger",
        reason:
          "encounter_action:break_subroutine|conditional_damage_mitigated_by_payable_next_full_break",
      };
    }
    if (
      action.payload?.breakSubroutinePurpose ===
      "zero_damage_no_secondary_effect"
    ) {
      return {
        key: "break_has_no_damage_or_secondary_purpose",
        label: "Nullschaden ohne weiteren Break-Effekt",
        reason:
          "encounter_action:break_subroutine|engine_certified_zero_damage_no_secondary_effect",
      };
    }
    if (breakOnlyPreventsAbsentNextEncounter(input, action)) {
      return {
        key: "break_targets_absent_next_encounter",
        label: "Die Subroutine hat kein folgendes Encounter als Ziel",
        reason:
          "encounter_action:break_subroutine|remaining_inner_ice:0|target_effect:next_encounter_only",
      };
    }
    const randomBreakExclusion = dependencies.randomBreakOrDamageBreakExclusion(
      input,
      action,
    );
    if (randomBreakExclusion) return randomBreakExclusion;
    if (
      breakMissesAvailableImmediateSafetyThreat(
        input,
        action,
        requiredHandFloor,
      )
    ) {
      return {
        key: "break_does_not_mitigate_visible_safety_threat",
        label: "Break löst die sichtbare unmittelbare Gefahr nicht",
        reason:
          "encounter_action:break_subroutine|visible_safety_threat_has_exact_break_route:true",
      };
    }
    const assessment = dependencies.breakAccessPathAssessment(
      input,
      action,
      requiredHandFloor,
    );
    if (assessment.canPreserveAccessPath) return undefined;
    return {
      key:
        assessment.constraint === "remote_payoff_reserve"
          ? "encounter_remote_payoff_reserve_would_break"
          : "break_cannot_preserve_access_path",
      label:
        assessment.constraint === "remote_payoff_reserve"
          ? "Break unterschreitet die gebundene Remote-Reserve"
          : "Break ohne Zugriffspfad",
      reason: sortedUnique([
        "encounter_action:break_subroutine",
        ...assessment.evidence,
      ]).join("|"),
    };
  }
  return undefined;
}

function breakOnlyPreventsAbsentNextEncounter(
  input: AiDecisionInput,
  action: LegalAction,
): boolean {
  const ice = currentEncounteredIceCard(input);
  if (!ice || action.payload?.iceId !== ice.instanceId) return false;
  const subroutines = ice.effectiveRunQuote?.subroutines;
  if (!subroutines?.length) return false;
  const indexes = breakSubroutineIndexesForAction(action);
  return (
    indexes.size > 0 &&
    [...indexes].every((index) => {
      return currentEncounterNextOnlySubroutineHasNoTarget(
        input,
        subroutines[index]?.type,
      );
    })
  );
}

function breakMissesAvailableImmediateSafetyThreat(
  input: AiDecisionInput,
  action: LegalAction,
  requiredHandFloor?: number,
): boolean {
  // Pump admission and break admission consume the same funded current-loss
  // projection. An independent trace may remain harmful, but must not reject
  // the exact damage/program break that the existing run owner is paying for.
  // Random costs, full-break duties and the access-path assessment stay intact.
  if (
    currentEncounterMitigationForAction(input, action, requiredHandFloor)
      ?.supportsCurrentAction
  )
    return false;
  const subroutines =
    currentEncounteredIceCard(input)?.effectiveRunQuote?.subroutines;
  if (!subroutines?.length) return false;
  const threatenedIndexes = new Set(
    subroutines.flatMap((subroutine, index) =>
      isUnacceptableImmediateSafetyThreatSubroutine(
        input,
        subroutine,
        requiredHandFloor,
      )
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
