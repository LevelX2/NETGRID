import type { SemanticDecisionTrace } from "../semantic-decision-trace";

export const AI_PLAY_STRENGTH_PILOT_ENV = "NETGRID_AI_PLAY_STRENGTH_PILOT";
export const BASIC_SETUP_PILOT_MODE = "basic_setup";
export const RUNNER_SAFE_ACCESS_PILOT_MODE = "runner_safe_access";
export const CORP_SCORE_WINDOW_PILOT_MODE = "corp_score_window";

export type AiPlayStrengthPilotScope =
  | typeof BASIC_SETUP_PILOT_MODE
  | typeof RUNNER_SAFE_ACCESS_PILOT_MODE
  | typeof CORP_SCORE_WINDOW_PILOT_MODE;

export type PilotScopeDecision = {
  scope: AiPlayStrengthPilotScope;
  allowed: boolean;
  reason: string;
  evidence: string[];
};

export type RankedAction = SemanticDecisionTrace["rankedActions"][number];

export function decision(
  scope: AiPlayStrengthPilotScope,
  allowed: boolean,
  reason: string,
  evidence: string[],
): PilotScopeDecision {
  return {
    scope,
    allowed,
    reason,
    evidence: [`pilot_scope_allowed:${allowed}`, ...evidence],
  };
}

export function allow(
  scope: AiPlayStrengthPilotScope,
  reason: string,
  evidence: string[],
): PilotScopeDecision {
  return decision(scope, true, reason, evidence);
}

export function block(
  scope: AiPlayStrengthPilotScope,
  reason: string,
  evidence: string[],
): PilotScopeDecision {
  return decision(scope, false, reason, evidence);
}

export function hasUtilityFamily(top: RankedAction, family: string): boolean {
  return top.components.some(
    (component) =>
      component.component === "goal_fit" &&
      component.evidence.some((entry) => entry === `utility_family:${family}`),
  );
}

export function utilityFamilyEvidence(top: RankedAction): string[] {
  return top.components
    .filter((component) => component.component === "goal_fit")
    .flatMap((component) =>
      component.evidence.filter((entry) => entry.startsWith("utility_family:")),
    );
}
