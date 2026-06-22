import { describe, expect, it } from "vitest";

import {
  RUNNER_PLAN_KINDS,
  baseScoreForPlan,
  isRunPlan,
  uncertaintyForPlan,
  visibleBenefitsForPlan,
  visibleRisksForPlan,
  type RunnerPlanKind,
} from "./runner-plan-metadata";

describe("legacy runner plan metadata", () => {
  it("covers every legacy runner plan kind exactly once", () => {
    expect(RUNNER_PLAN_KINDS).toEqual([
      "pressure_rnd",
      "pressure_hq",
      "contest_remote",
      "build_rig",
      "recover_economy",
      "draw_for_answers",
      "trash_asset",
      "safe_probe_run",
    ]);
    expect(new Set(RUNNER_PLAN_KINDS).size).toBe(RUNNER_PLAN_KINDS.length);
  });

  it("keeps base scores stable for all legacy runner plans", () => {
    expect(scoreByKind()).toEqual({
      pressure_rnd: 300,
      pressure_hq: 270,
      contest_remote: 295,
      build_rig: 255,
      recover_economy: 230,
      draw_for_answers: 215,
      trash_asset: 360,
      safe_probe_run: 185,
    });
  });

  it("keeps visible benefit metadata side-safe and deterministic", () => {
    expect(benefitsByKind()).toEqual({
      pressure_rnd: ["benefit:rd_pressure"],
      pressure_hq: ["benefit:hq_pressure"],
      contest_remote: ["benefit:remote_contest"],
      build_rig: ["benefit:rig_setup"],
      recover_economy: ["benefit:credit_reserve"],
      draw_for_answers: ["benefit:more_options"],
      trash_asset: ["benefit:remove_visible_threat"],
      safe_probe_run: ["benefit:low_commitment_information"],
    });
  });

  it("marks only run plans with hidden-corp-card uncertainty", () => {
    const runKinds = RUNNER_PLAN_KINDS.filter(isRunPlan);
    expect(runKinds).toEqual([
      "pressure_rnd",
      "pressure_hq",
      "contest_remote",
      "safe_probe_run",
    ]);

    for (const kind of RUNNER_PLAN_KINDS) {
      expect(uncertaintyForPlan(kind)).toEqual(
        isRunPlan(kind)
          ? ["unknown_corp_cards_remain_unknown", "unrezzed_ice_identity_not_assumed"]
          : ["hidden_corp_information_not_used"],
      );
    }
  });

  it("keeps visible risk metadata dependent only on kind and visible roles", () => {
    expect(visibleRisksForPlan("pressure_rnd", [])).toEqual([
      "risk:unknown_server_contents",
    ]);
    expect(visibleRisksForPlan("build_rig", [])).toEqual(["risk:no_ai_role"]);
    expect(visibleRisksForPlan("build_rig", ["breaker"])).toEqual([]);
    expect(visibleRisksForPlan("recover_economy", [])).toEqual([]);
  });
});

function scoreByKind(): Record<RunnerPlanKind, number> {
  return Object.fromEntries(
    RUNNER_PLAN_KINDS.map((kind) => [kind, baseScoreForPlan(kind)]),
  ) as Record<RunnerPlanKind, number>;
}

function benefitsByKind(): Record<RunnerPlanKind, string[]> {
  return Object.fromEntries(
    RUNNER_PLAN_KINDS.map((kind) => [kind, visibleBenefitsForPlan(kind)]),
  ) as Record<RunnerPlanKind, string[]>;
}
