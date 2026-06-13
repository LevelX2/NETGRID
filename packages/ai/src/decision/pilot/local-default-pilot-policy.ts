import {
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  type AiPlayStrengthPilotScope,
} from "./pilot-scope-common";
import type { SemanticShadowLeagueLocalDefaultDryRunReport } from "../../evaluation/semantic-shadow-league";

export type LocalDefaultPilotPolicyStatus =
  | "default_off_candidate"
  | "keep_env_gated";

export type LocalDefaultPilotPolicyScope = {
  scope: AiPlayStrengthPilotScope;
  status: LocalDefaultPilotPolicyStatus;
  enabledByDefault: false;
  envGateRequired: true;
  rationale: string;
  evidence: string[];
};

export type LocalDefaultPilotPolicy = {
  version: "ai-play-strength-local-default-pilot-policy-v1";
  scope: "local_default_pilot_policy_report_only";
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  noRuntimeEffect: true;
  defaultEnabledScopes: [];
  scopes: LocalDefaultPilotPolicyScope[];
  evidence: string[];
};

export function buildLocalDefaultPilotPolicy(): LocalDefaultPilotPolicy {
  return {
    version: "ai-play-strength-local-default-pilot-policy-v1",
    scope: "local_default_pilot_policy_report_only",
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    defaultEnabledScopes: [],
    scopes: [
      {
        scope: BASIC_SETUP_PILOT_MODE,
        status: "default_off_candidate",
        enabledByDefault: false,
        envGateRequired: true,
        rationale: "Basic setup is a local default-off candidate only.",
        evidence: [
          "assessment:basic_setup:default_off_candidate",
          "enabled_by_default:false",
        ],
      },
      {
        scope: RUNNER_SAFE_ACCESS_PILOT_MODE,
        status: "default_off_candidate",
        enabledByDefault: false,
        envGateRequired: true,
        rationale: "Runner safe access is a local default-off candidate only.",
        evidence: [
          "assessment:runner_safe_access:default_off_candidate",
          "enabled_by_default:false",
        ],
      },
      {
        scope: CORP_SCORE_WINDOW_PILOT_MODE,
        status: "keep_env_gated",
        enabledByDefault: false,
        envGateRequired: true,
        rationale: "Corp score window remains env-gated pending broader corpus.",
        evidence: [
          "assessment:corp_score_window:keep_env_gated",
          "enabled_by_default:false",
        ],
      },
    ],
    evidence: [
      "local_default_pilot_policy:report_only",
      "runtime_consumer:none",
      "productive_use_allowed:false",
      "default_enabled_scope_count:0",
    ],
  };
}

export function defaultActiveScopes(): [] {
  return [];
}

export function recommendedLocalDefaultScopes(
  reports: readonly SemanticShadowLeagueLocalDefaultDryRunReport[],
): AiPlayStrengthPilotScope[] {
  return reports
    .filter(
      (report) =>
        report.recommendation === "local_default_dry_run_candidate" &&
        report.badOverrideRisk === 0 &&
        report.productiveUseAllowed === false &&
        report.runtimeConsumerStatus === "none",
    )
    .map((report) => report.scope)
    .sort();
}

export function localDefaultPolicyEnvOverrideRequired(): true {
  return true;
}
