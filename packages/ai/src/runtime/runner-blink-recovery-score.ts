import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

type RunnerBlinkRecoveryScoreAssessment = {
  active: boolean;
  evidence: string[];
};

export type RunnerBlinkRecoveryScoreDependencies = {
  targetServerId: (action: LegalAction) => string | undefined;
  assessment: (
    input: AiDecisionInput,
    targetServerId: string | undefined,
  ) => RunnerBlinkRecoveryScoreAssessment | undefined;
  rolesForAction: (input: AiDecisionInput, action: LegalAction) => string[];
};

export function runnerBlinkRecoveryScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  dependencies: RunnerBlinkRecoveryScoreDependencies,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  const targetServerId =
    action.type === "start_run" ? dependencies.targetServerId(action) : undefined;
  const assessment = dependencies.assessment(input, targetServerId);
  if (!assessment?.active) return undefined;

  if (action.type === "draw_card") {
    return {
      key: "runner_blink_damage_buffer_recovery",
      label: "Blink-Schadenspuffer",
      value: 1700,
      reason: sortedUnique([
        ...assessment.evidence,
        "blink_recovery_action:draw_card",
      ]).join("|"),
    };
  }

  if (action.type === "install_card") {
    const roles = dependencies.rolesForAction(input, action);
    if (roles.some((role) => role.startsWith("breaker_"))) {
      return {
        key: "runner_blink_stable_coverage_recovery",
        label: "Stabile Breaker-Abdeckung",
        value: 850,
        reason: sortedUnique([
          ...assessment.evidence,
          "blink_recovery_action:stable_breaker_install",
        ]).join("|"),
      };
    }
  }

  if (action.type === "gain_credit") {
    return {
      key: "runner_blink_setup_recovery",
      label: "Blink-Setup-Erholung",
      value: 360,
      reason: sortedUnique([
        ...assessment.evidence,
        "blink_recovery_action:gain_credit",
      ]).join("|"),
    };
  }

  return undefined;
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "de"),
  );
}
