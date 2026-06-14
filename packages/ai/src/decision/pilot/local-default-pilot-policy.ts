import {
  BASIC_SETUP_PILOT_MODE,
  CORP_SCORE_WINDOW_PILOT_MODE,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  type AiPlayStrengthPilotScope,
} from "./pilot-scope-common";

export const AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV =
  "NETGRID_AI_PLAY_STRENGTH_LOCAL_DEFAULT";

export type LocalDefaultPilotPolicyStatus =
  | "default_off_candidate"
  | "keep_env_gated";

export type LocalDefaultPilotNextStep =
  | "candidate_basic_setup_local_default_env"
  | "keep_runner_safe_access_explicit_env"
  | "keep_corp_score_window_env_gated";

export type LocalDefaultPilotPolicyScope = {
  scope: AiPlayStrengthPilotScope;
  status: LocalDefaultPilotPolicyStatus;
  enabledByDefault: false;
  envGateRequired: true;
  nextStep: LocalDefaultPilotNextStep;
  corpusReadiness:
    | "sufficient_for_local_candidate"
    | "structured_but_requires_explicit_env"
    | "insufficient_for_default";
  falsePositiveRisk: "low" | "medium" | "high";
  hiddenInfoRisk: "low" | "medium" | "high";
  rationale: string;
  evidence: string[];
};

export type LocalDefaultPilotDryRunPolicyInput = {
  scope: AiPlayStrengthPilotScope;
  recommendation:
    | "local_default_dry_run_candidate"
    | "keep_env_gated"
    | "do_not_default";
  badOverrideRisk: number;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
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
        nextStep: "candidate_basic_setup_local_default_env",
        corpusReadiness: "sufficient_for_local_candidate",
        falsePositiveRisk: "low",
        hiddenInfoRisk: "low",
        rationale:
          "Basic setup is a default-off candidate for an explicit local default env, not a global runtime default.",
        evidence: [
          "assessment:basic_setup:default_off_candidate",
          "decision:basic_setup:candidate_local_default_env",
          "corpus_readiness:sufficient_for_local_candidate",
          "false_positive_risk:low",
          "hidden_info_risk:low",
          "enabled_by_default:false",
        ],
      },
      {
        scope: RUNNER_SAFE_ACCESS_PILOT_MODE,
        status: "default_off_candidate",
        enabledByDefault: false,
        envGateRequired: true,
        nextStep: "keep_runner_safe_access_explicit_env",
        corpusReadiness: "structured_but_requires_explicit_env",
        falsePositiveRisk: "medium",
        hiddenInfoRisk: "low",
        rationale:
          "Runner safe access has structured alignment and risk blocks, but remains explicit-env while access-window behavior matures.",
        evidence: [
          "assessment:runner_safe_access:default_off_candidate",
          "decision:runner_safe_access:keep_explicit_env",
          "decision_record:ai-runner-safe-access-explicit-env-record-2026-06-13",
          "structured_alignment:present",
          "risk_blocks:present",
          "false_positive_risk:medium",
          "hidden_info_risk:low",
          "enabled_by_default:false",
        ],
      },
      {
        scope: CORP_SCORE_WINDOW_PILOT_MODE,
        status: "keep_env_gated",
        enabledByDefault: false,
        envGateRequired: true,
        nextStep: "keep_corp_score_window_env_gated",
        corpusReadiness: "insufficient_for_default",
        falsePositiveRisk: "high",
        hiddenInfoRisk: "low",
        rationale: "Corp score window remains env-gated pending broader corpus.",
        evidence: [
          "assessment:corp_score_window:keep_env_gated",
          "decision:corp_score_window:keep_env_gated",
          "corpus_readiness:insufficient_for_default",
          "false_positive_risk:high",
          "hidden_info_risk:low",
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

export function localDefaultPilotScopes(params: {
  explicitPilotEnv: string | undefined;
  localDefaultEnv: string | undefined;
}): AiPlayStrengthPilotScope[] {
  if (params.explicitPilotEnv?.trim()) return [];
  if (params.localDefaultEnv?.trim() !== BASIC_SETUP_PILOT_MODE) return [];
  return [BASIC_SETUP_PILOT_MODE];
}

export function recommendedLocalDefaultScopes(
  reports: readonly LocalDefaultPilotDryRunPolicyInput[],
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
