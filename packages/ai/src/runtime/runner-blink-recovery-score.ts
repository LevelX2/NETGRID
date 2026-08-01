import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import { rolesHaveBreakerRole } from "./breaker-role-match";

type RunnerRandomBreakOrDamageRecoveryScoreAssessment = {
  active: boolean;
  evidence: string[];
};

export type RunnerRandomBreakOrDamageRecoveryScoreDependencies = {
  targetServerId: (action: LegalAction) => string | undefined;
  assessment: (
    input: AiDecisionInput,
    targetServerId: string | undefined,
  ) => RunnerRandomBreakOrDamageRecoveryScoreAssessment | undefined;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
};

export function runnerRandomBreakOrDamageRecoveryScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerRandomBreakOrDamageRecoveryScoreDependencies,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  const targetServerId =
    action.type === "start_run"
      ? dependencies.targetServerId(action)
      : undefined;
  const assessment = dependencies.assessment(input, targetServerId);
  if (!assessment?.active) return undefined;

  if (action.type === "draw_card") {
    return {
      key: "runner_random_break_damage_buffer_recovery",
      label: "Zufallsbruch-Schadenspuffer",
      value: 1700,
      reason: sortedUnique([
        ...assessment.evidence,
        "random_break_damage_recovery_action:draw_card",
      ]).join("|"),
    };
  }

  if (action.type === "install_card") {
    const roles = dependencies.rolesForAction(input, action);
    if (rolesHaveBreakerRole(roles)) {
      return {
        key: "runner_random_break_damage_stable_coverage_recovery",
        label: "Stabile Breaker-Abdeckung",
        value: 850,
        reason: sortedUnique([
          ...assessment.evidence,
          "random_break_damage_recovery_action:stable_breaker_install",
        ]).join("|"),
      };
    }
  }

  return undefined;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
