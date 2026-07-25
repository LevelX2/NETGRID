import type { RunnerRunTargetEvaluation } from "../run-analysis/runner-run-target-types";
import { safeRuntimeRunTarget } from "../semantic-ai-runtime-cutover.test-support";
import { describe, expect, it } from "vitest";
import {
  assessRunnerRunFundingAdmission,
  runnerRunTargetIsDirectlyConvertible,
} from "./runner-run-funding-admission";

describe("runner run funding admission", () => {
  it("rejects funding when the target already converts while preserving the floor", () => {
    const target = runTarget("run-remote", "remote_1", {
      pathPassability: "reachable",
      pathCost: 6,
      creditsAfterRun: 3,
      score: 500,
      scoreThreat: true,
      accessPayoff: "score_threat",
      recommendation: "gain_credits_first",
      runCommitment: "probe_only",
      routeQuote: routeQuote(0),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: false,
      reasonCode: "target_already_directly_convertible",
      concreteFundingGap: 0,
      targetDirectlyConvertible: true,
    });
  });

  it("requires a concrete route or post-run floor gap", () => {
    const target = runTarget("run-rd", "rd", {
      score: -40,
      creditsAfterRun: 6,
      recommendation: "gain_credits_first",
      routeQuote: routeQuote(0),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: false,
      reasonCode: "no_concrete_funding_gap",
      concreteFundingGap: 0,
      targetDirectlyConvertible: false,
    });
  });

  it("rejects nonurgent funding while another positive route converts now", () => {
    const target = runTarget("run-rd", "rd", {
      pathPassability: "blocked_unpayable",
      pathCost: 8,
      creditsAfterRun: -2,
      score: 120,
      recommendation: "gain_credits_first",
      routeQuote: routeQuote(2),
    });
    const direct = runTarget("run-archives", "archives", {
      pathPassability: "reachable",
      pathCost: 0,
      creditsAfterRun: 6,
      score: 160,
      recommendation: "run_if_free",
      routeQuote: routeQuote(0),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target, direct],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: false,
      reasonCode: "nonurgent_funding_yields_to_direct_run",
      concreteFundingGap: 5,
      alternativeDirectlyConvertibleActionIds: ["run-archives"],
    });
  });

  it("keeps an acute score-threat funding route despite a direct alternative", () => {
    const target = runTarget("run-remote", "remote_1", {
      pathPassability: "blocked_unpayable",
      pathCost: 8,
      creditsAfterRun: -2,
      score: 500,
      scoreThreat: true,
      accessPayoff: "score_threat",
      recommendation: "gain_credits_first",
      routeQuote: routeQuote(2),
    });
    const direct = runTarget("run-archives", "archives", {
      creditsAfterRun: 6,
      score: 160,
      recommendation: "run_if_free",
      routeQuote: routeQuote(0),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target, direct],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: true,
      reasonCode: "concrete_funding_gap_admitted",
      urgentScoreThreat: true,
      alternativeDirectlyConvertibleActionIds: ["run-archives"],
    });
  });

  it("rejects urgent funding when a sibling route converts on the same server", () => {
    const funded = runTarget("inside-job-rd", "rd", {
      pathPassability: "blocked_unpayable",
      pathCost: 8,
      creditsAfterRun: -2,
      score: 500,
      scoreThreat: true,
      accessPayoff: "score_threat",
      recommendation: "gain_credits_first",
      routeQuote: routeQuote(2),
    });
    const direct = runTarget("basic-rd", "rd", {
      pathPassability: "reachable",
      pathCost: 3,
      creditsAfterRun: 1,
      score: 220,
      scoreThreat: true,
      accessPayoff: "score_threat",
      recommendation: "gain_credits_first",
      routeQuote: routeQuote(0),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target: funded,
        runTargets: [funded, direct],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: false,
      reasonCode: "same_server_direct_route_blocks_funding",
      urgentScoreThreat: true,
      sameServerDirectlyConvertibleActionIds: ["basic-rd"],
    });
  });

  it("lets an exact urgent route spend below the floor when it stays nonnegative", () => {
    const target = runTarget("run-hq", "hq", {
      pathPassability: "reachable",
      pathCost: 5,
      creditsAfterRun: 1,
      score: 500,
      scoreThreat: true,
      accessPayoff: "score_threat",
      recommendation: "gain_credits_first",
      routeQuote: routeQuote(0),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: false,
      reasonCode: "target_already_directly_convertible",
      routeFundingGap: 0,
      postRunFloorGap: 2,
      targetDirectlyConvertible: true,
    });
  });

  it("does not call a nonurgent gain-credits-first route directly convertible", () => {
    const target = runTarget("run-remote", "remote_1", {
      pathPassability: "reachable",
      pathCost: 16,
      creditsAfterRun: 3,
      score: 120,
      recommendation: "gain_credits_first",
      routeQuote: routeQuote(0),
    });

    expect(
      runnerRunTargetIsDirectlyConvertible({
        target,
        economy: { minimumCreditFloor: 3 },
      }),
    ).toBe(false);
    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: false,
      reasonCode: "no_concrete_funding_gap",
      targetDirectlyConvertible: false,
      urgentScoreThreat: false,
    });
  });

  it("admits the exact contest-reserve gap required by a score-threat plan", () => {
    const target = runTarget("run-remote", "remote_1", {
      pathPassability: "reachable",
      pathCost: 0,
      creditsAfterRun: 6,
      score: 500,
      scoreThreat: true,
      accessPayoff: "score_threat",
      recommendation: "gain_credits_first",
      runCommitment: "probe_only",
      routeQuote: routeQuote(0),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target],
        economy: { minimumCreditFloor: 3 },
        requiredPostRunReserve: 8,
      }),
    ).toMatchObject({
      admitted: true,
      reasonCode: "concrete_funding_gap_admitted",
      concreteFundingGap: 2,
      routeFundingGap: 0,
      postRunFloorGap: 0,
      requiredPostRunReserve: 8,
      requiredPostRunReserveGap: 2,
      targetDirectlyConvertible: false,
    });
  });

  it.each([
    [
      "a positive route gap",
      {
        creditsAfterRun: 1,
        routeQuote: routeQuote(1),
      },
      2,
    ],
    [
      "negative post-run credits",
      {
        creditsAfterRun: -1,
        routeQuote: routeQuote(0),
      },
      4,
    ],
  ])(
    "does not hide %s behind the urgent floor override",
    (_label, overrides, expectedGap) => {
      const target = runTarget("run-hq", "hq", {
        pathPassability: "reachable",
        pathCost: 5,
        score: 500,
        scoreThreat: true,
        accessPayoff: "score_threat",
        recommendation: "gain_credits_first",
        ...overrides,
      });

      expect(
        assessRunnerRunFundingAdmission({
          target,
          runTargets: [target],
          economy: { minimumCreditFloor: 3 },
        }),
      ).toMatchObject({
        admitted: true,
        reasonCode: "concrete_funding_gap_admitted",
        concreteFundingGap: expectedGap,
        targetDirectlyConvertible: false,
      });
    },
  );

  it("accepts an explicit terminal-plan urgency witness without mutating the target", () => {
    const target = runTarget("run-hq", "hq", {
      pathPassability: "blocked_unpayable",
      creditsAfterRun: -1,
      score: 120,
      recommendation: "gain_credits_first",
      routeQuote: routeQuote(1),
    });
    const direct = runTarget("run-archives", "archives", {
      creditsAfterRun: 6,
      score: 160,
      routeQuote: routeQuote(0),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target, direct],
        economy: { minimumCreditFloor: 3 },
        urgentScoreThreat: true,
      }),
    ).toMatchObject({
      admitted: true,
      urgentScoreThreat: true,
      alternativeDirectlyConvertibleActionIds: ["run-archives"],
    });
    expect(target.scoreThreat).toBe(false);
  });

  it("admits a negative local route score only with an exact urgency witness", () => {
    const target = runTarget("run-remote", "remote_1", {
      pathPassability: "blocked_unpayable",
      creditsAfterRun: -5,
      score: -120,
      accessPayoff: "score_threat",
      recommendation: "do_not_run_now",
      routeQuote: routeQuote(5),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target],
        economy: { minimumCreditFloor: 3 },
        urgentScoreThreat: true,
      }),
    ).toMatchObject({
      admitted: true,
      reasonCode: "concrete_funding_gap_admitted",
      concreteFundingGap: 8,
      urgentScoreThreat: true,
    });
  });

  it("keeps a negative local route score fail-closed without urgency", () => {
    const target = runTarget("run-remote", "remote_1", {
      pathPassability: "blocked_unpayable",
      creditsAfterRun: -5,
      score: -120,
      recommendation: "do_not_run_now",
      routeQuote: routeQuote(5),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: false,
      reasonCode: "target_not_credit_convertible",
      urgentScoreThreat: false,
    });
  });

  it("admits an ordinary concrete gap when no direct alternative exists", () => {
    const target = runTarget("run-hq", "hq", {
      pathPassability: "blocked_unpayable",
      pathCost: 6,
      creditsAfterRun: -1,
      score: 120,
      recommendation: "gain_credits_first",
      routeQuote: routeQuote(1),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: true,
      reasonCode: "concrete_funding_gap_admitted",
      concreteFundingGap: 4,
      urgentScoreThreat: false,
    });
  });

  it("does not treat missing coverage as a credit-convertible gap", () => {
    const target = runTarget("run-remote", "remote_1", {
      pathPassability: "blocked_missing_coverage",
      creditsAfterRun: -2,
      score: 500,
      scoreThreat: true,
      accessPayoff: "score_threat",
      recommendation: "find_breaker_first",
      routeQuote: routeQuote(5),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: false,
      reasonCode: "target_not_credit_convertible",
    });
  });

  it("does not fund a path whose evaluated outcome is nonproductive", () => {
    const target = runTarget("run-hq", "hq", {
      pathPassability: "reachable",
      creditsAfterRun: 0,
      score: -40,
      recommendation: "gain_credits_first",
      routeQuote: routeQuote(0),
    });

    expect(
      assessRunnerRunFundingAdmission({
        target,
        runTargets: [target],
        economy: { minimumCreditFloor: 3 },
      }),
    ).toMatchObject({
      admitted: false,
      reasonCode: "target_not_credit_convertible",
    });
  });

  it("ignores negative and known-empty alternatives when checking direct conversion", () => {
    const negative = runTarget("run-negative", "archives", {
      creditsAfterRun: 8,
      score: -10,
    });
    const knownEmpty = runTarget("run-known-empty", "hq", {
      creditsAfterRun: 8,
      score: 200,
      knownAccessState: "known_no_current_payoff",
    });

    expect(
      runnerRunTargetIsDirectlyConvertible({
        target: negative,
        economy: { minimumCreditFloor: 3 },
      }),
    ).toBe(false);
    expect(
      runnerRunTargetIsDirectlyConvertible({
        target: knownEmpty,
        economy: { minimumCreditFloor: 3 },
      }),
    ).toBe(false);
  });
});

function runTarget(
  actionId: string,
  targetServerId: string,
  overrides: Partial<RunnerRunTargetEvaluation> = {},
): RunnerRunTargetEvaluation {
  const base = safeRuntimeRunTarget(actionId, targetServerId);
  return {
    ...base,
    ...overrides,
    targetKind: targetKind(targetServerId),
    accessTargetKind: targetKind(targetServerId),
    targetServerId,
    accessServerId: targetServerId,
  } as RunnerRunTargetEvaluation;
}

function targetKind(
  serverId: string,
): RunnerRunTargetEvaluation["targetKind"] {
  if (serverId === "rd" || serverId === "hq" || serverId === "archives") {
    return serverId;
  }
  return "remote";
}

function routeQuote(
  fundingGap: number,
): NonNullable<RunnerRunTargetEvaluation["routeQuote"]> {
  return {
    reachability: fundingGap > 0 ? "no_access" : "guaranteed_access",
    knownCost: fundingGap,
    guaranteedKnownCost: fundingGap,
    availableCredits: 0,
    fundingGap,
    unknownIceCount: 0,
    effects: [],
    conditionalReasons: [],
    evidence: [`test_funding_gap:${fundingGap}`],
  };
}
