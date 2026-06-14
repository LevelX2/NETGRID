import { describe, expect, it } from "vitest";

import {
  AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV,
  buildLocalDefaultPilotPolicy,
  defaultActiveScopes,
  localDefaultPolicyEnvOverrideRequired,
  localDefaultPilotScopes,
  recommendedLocalDefaultScopes,
} from "./local-default-pilot-policy";
import type { SemanticShadowLeagueLocalDefaultDryRunReport } from "../../evaluation/semantic-shadow-league";

describe("local default pilot policy", () => {
  it("keeps all local default scopes inactive by policy", () => {
    const policy = buildLocalDefaultPilotPolicy();

    expect(policy.productiveUseAllowed).toBe(false);
    expect(policy.runtimeConsumerStatus).toBe("none");
    expect(policy.noRuntimeEffect).toBe(true);
    expect(policy.defaultEnabledScopes).toEqual([]);
    expect(defaultActiveScopes()).toEqual([]);
    expect(policy.scopes.every((scope) => scope.enabledByDefault === false)).toBe(
      true,
    );
    expect(localDefaultPolicyEnvOverrideRequired()).toBe(true);
  });

  it("recommends only clean dry-run candidates and never activates them", () => {
    const reports: SemanticShadowLeagueLocalDefaultDryRunReport[] = [
      dryRun("basic_setup", "do_not_default", 1),
      dryRun("runner_safe_access", "local_default_dry_run_candidate", 0),
      dryRun("corp_score_window", "keep_env_gated", 0),
    ];

    expect(recommendedLocalDefaultScopes(reports)).toEqual([
      "runner_safe_access",
    ]);
    expect(defaultActiveScopes()).toEqual([]);
  });

  it("allows only basic setup as an explicit local default env when pilot env is unset", () => {
    expect(AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV).toBe(
      "NETGRID_AI_PLAY_STRENGTH_LOCAL_DEFAULT",
    );
    expect(
      localDefaultPilotScopes({
        explicitPilotEnv: undefined,
        localDefaultEnv: "basic_setup",
      }),
    ).toEqual(["basic_setup"]);
    expect(
      localDefaultPilotScopes({
        explicitPilotEnv: "runner_safe_access",
        localDefaultEnv: "basic_setup",
      }),
    ).toEqual([]);
    expect(
      localDefaultPilotScopes({
        explicitPilotEnv: undefined,
        localDefaultEnv: "runner_safe_access",
      }),
    ).toEqual([]);
    expect(
      localDefaultPilotScopes({
        explicitPilotEnv: undefined,
        localDefaultEnv: undefined,
      }),
    ).toEqual([]);
  });
});

function dryRun(
  scope: SemanticShadowLeagueLocalDefaultDryRunReport["scope"],
  recommendation: SemanticShadowLeagueLocalDefaultDryRunReport["recommendation"],
  badOverrideRisk: number,
): SemanticShadowLeagueLocalDefaultDryRunReport {
  return {
    scope,
    scenarioCount: 54,
    eligible: 1,
    wouldOverride: 1,
    badOverrideRisk,
    blockedReasons: {},
    knownNoGoCases: [],
    recommendation,
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    noRuntimeEffect: true,
    evidence: [],
  };
}
