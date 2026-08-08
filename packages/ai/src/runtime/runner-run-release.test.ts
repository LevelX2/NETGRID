import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import { runnerRunReleaseForEvaluation } from "./runner-run-release";

describe("runner run release", () => {
  it("releases a bounded unknown-ICE probe with a funded known route", () => {
    const release = runnerRunReleaseForEvaluation(
      runnerInput(),
      evaluation({
        route: "conditional_access",
        conditionalReasons: ["unknown_ice_on_route"],
        unknownIceCount: 1,
        fundingGap: 0,
        accessPayoff: "unknown",
      }),
    );

    expect(release).toMatchObject({
      status: "released_conditional",
      reason: "bounded_unknown_ice_probe",
      acceptedRisks: ["conditional:unknown_ice_on_route"],
    });
  });

  it("blocks an under-reserved unknown-ICE probe against a rich Corp", () => {
    const release = runnerRunReleaseForEvaluation(
      runnerInput(7),
      evaluation({
        route: "conditional_access",
        conditionalReasons: ["unknown_ice_on_route"],
        unknownIceCount: 2,
        fundingGap: 0,
        accessPayoff: "score_threat",
        pathPassability: "blocked_unpayable",
        recommendation: "gain_credits_first",
        unrezzedIceRiskUnderfunded: true,
        creditsAfterRun: 0,
      }),
    );

    expect(release).toMatchObject({
      status: "blocked",
      reason: "unknown_ice_risk_underfunded",
    });
  });

  it("blocks an under-reserved score-threat probe even at one visible Corp credit", () => {
    const release = runnerRunReleaseForEvaluation(
      runnerInput(1),
      evaluation({
        route: "conditional_access",
        conditionalReasons: ["unknown_ice_on_route"],
        unknownIceCount: 2,
        fundingGap: 0,
        accessPayoff: "score_threat",
        recommendation: "gain_credits_first",
        unrezzedIceRiskUnderfunded: true,
        creditsAfterRun: 0,
      }),
    );

    expect(release).toMatchObject({
      status: "blocked",
      reason: "unknown_ice_risk_underfunded",
    });
  });

  it("blocks a conditional access-bonus run without an explicit probe-only route", () => {
    const release = runnerRunReleaseForEvaluation(
      runnerInput(),
      evaluation({
        route: "conditional_access",
        conditionalReasons: ["visible_access_preventing_effect_not_guaranteed"],
        fundingGap: 1,
        accessPayoff: "access_bonus",
      }),
    );

    expect(release).toMatchObject({
      status: "blocked",
      reason: "conditional_route_not_accepted",
    });
  });

  it("allows an explicit agenda risk but never a visible pre-access flatline", () => {
    const agenda = evaluation({
      route: "conditional_access",
      conditionalReasons: ["visible_access_preventing_effect_not_guaranteed"],
      fundingGap: 1,
      accessPayoff: "agenda",
      pathPassability: "blocked_unbreakable",
    });
    expect(runnerRunReleaseForEvaluation(runnerInput(), agenda)).toMatchObject({
      status: "released_conditional",
      reason: "agenda_risk_explicitly_accepted",
    });

    const lethal = structuredClone(agenda);
    lethal.routeQuote!.effects = [
      {
        kind: "damage",
        timing: "before_access",
        amount: 3,
        preventsAccess: false,
        canEndGameBeforeAccess: true,
        evidence: [],
      },
    ];
    expect(runnerRunReleaseForEvaluation(runnerInput(), lethal)).toMatchObject({
      status: "blocked",
      reason: "flatline_risk_before_access",
    });
  });
});

function evaluation(params: {
  route: NonNullable<RunnerRunTargetEvaluation["routeQuote"]>["reachability"];
  conditionalReasons: string[];
  fundingGap: number;
  accessPayoff: RunnerRunTargetEvaluation["accessPayoff"];
  unknownIceCount?: number;
  pathPassability?: RunnerRunTargetEvaluation["pathPassability"];
  recommendation?: RunnerRunTargetEvaluation["recommendation"];
  unrezzedIceRiskUnderfunded?: boolean;
  creditsAfterRun?: number;
}): RunnerRunTargetEvaluation {
  return {
    targetServerId: "rd",
    targetKind: "rd",
    accessServerId: "rd",
    accessTargetKind: "rd",
    actionId: "run-rd",
    accessPayoff: params.accessPayoff,
    knownAccessState: "unknown",
    pathPassability: params.pathPassability ?? "reachable",
    creditsAfterRun: params.creditsAfterRun ?? 3,
    unrezzedIceRiskUnderfunded: params.unrezzedIceRiskUnderfunded ?? false,
    scoreThreat: false,
    recommendation: params.recommendation ?? "run_now",
    routeQuote: {
      reachability: params.route,
      knownCost: 4,
      guaranteedKnownCost: 5,
      availableCredits: 4,
      fundingGap: params.fundingGap,
      unknownIceCount: params.unknownIceCount ?? 0,
      effects: [],
      conditionalReasons: params.conditionalReasons,
      evidence: [],
    },
  } as unknown as RunnerRunTargetEvaluation;
}

function runnerInput(corpCredits = 0): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: { agendaPoints: 5, scoreArea: [] },
      opponent: { credits: corpCredits },
      agendaPointsToWin: 7,
    },
  } as unknown as AiDecisionInput;
}
