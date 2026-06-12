import type { AiOpportunityProjection } from "./opportunity-projection";
import type { ScoreComponent } from "./score-components";
import type { AiThreatSeverity } from "./threat-projection";

export type SemanticShadowCalibrationProfileId =
  | "baseline_v1"
  | "shadow_calibrated_v1";

export type SemanticShadowCalibrationMode = "baseline" | "shadow_only";

export type SemanticShadowCalibrationProfile = {
  profileId: SemanticShadowCalibrationProfileId;
  mode: SemanticShadowCalibrationMode;
  scope: "semantic_shadow_decision_scoring";
  componentWeights: Record<ScoreComponent, number>;
  opportunityPriorityBonus: Record<AiOpportunityProjection["priority"], number>;
  threatSeverityBonus: Record<AiThreatSeverity, number>;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  evidence: string[];
};

export const SEMANTIC_SHADOW_BASELINE_V1: SemanticShadowCalibrationProfile = {
  profileId: "baseline_v1",
  mode: "baseline",
  scope: "semantic_shadow_decision_scoring",
  componentWeights: {
    goal_fit: 1,
    cost_fit: 1,
    timing_fit: 1,
    risk_adjustment: 1,
    plan_alignment: 1,
    target_fit: 1,
    opportunity: 1,
    threat_response: 1,
    fallback_safety: 1,
  },
  opportunityPriorityBonus: {
    low: 2,
    medium: 6,
    high: 12,
    critical: 18,
  },
  threatSeverityBonus: {
    low: 2,
    medium: 6,
    high: 12,
    critical: 18,
  },
  productiveUseAllowed: false,
  runtimeConsumerStatus: "none",
  noRuntimeEffect: true,
  evidence: ["baseline_v1:current_semantic_shadow_score"],
};

export const SEMANTIC_SHADOW_CALIBRATED_V1: SemanticShadowCalibrationProfile = {
  profileId: "shadow_calibrated_v1",
  mode: "shadow_only",
  scope: "semantic_shadow_decision_scoring",
  componentWeights: {
    goal_fit: 1,
    cost_fit: 1.15,
    timing_fit: 1.1,
    risk_adjustment: 1.25,
    plan_alignment: 1.05,
    target_fit: 1.2,
    opportunity: 1.15,
    threat_response: 1.2,
    fallback_safety: 1,
  },
  opportunityPriorityBonus: {
    low: 3,
    medium: 8,
    high: 16,
    critical: 24,
  },
  threatSeverityBonus: {
    low: 3,
    medium: 8,
    high: 16,
    critical: 24,
  },
  productiveUseAllowed: false,
  runtimeConsumerStatus: "none",
  noRuntimeEffect: true,
  evidence: ["shadow_calibrated_v1:diagnostic_weight_experiment_only"],
};

export function resolveSemanticShadowCalibrationProfile(
  profile:
    | SemanticShadowCalibrationProfile
    | SemanticShadowCalibrationProfileId
    | undefined,
): SemanticShadowCalibrationProfile {
  if (!profile) return SEMANTIC_SHADOW_BASELINE_V1;
  if (typeof profile !== "string") return profile;
  if (profile === "baseline_v1") return SEMANTIC_SHADOW_BASELINE_V1;
  return SEMANTIC_SHADOW_CALIBRATED_V1;
}

export function componentWeight(
  profile: SemanticShadowCalibrationProfile,
  component: ScoreComponent,
): number {
  return profile.componentWeights[component] ?? 1;
}

export function opportunityPriorityBonus(
  profile: SemanticShadowCalibrationProfile,
  priority: AiOpportunityProjection["priority"],
): number {
  return profile.opportunityPriorityBonus[priority];
}

export function threatSeverityBonus(
  profile: SemanticShadowCalibrationProfile,
  severity: AiThreatSeverity,
): number {
  return profile.threatSeverityBonus[severity];
}
