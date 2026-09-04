import type { RunnerRunTargetEvaluation } from "../run-analysis/runner-run-target-types";
import { describe, expect, it } from "vitest";
import {
  assessRunnerRecurringEconomyRunHorizon,
  assessRunnerRestrictedRunEconomyInvestment,
} from "./runner-recurring-economy-investment";

describe("assessRunnerRestrictedRunEconomyInvestment", () => {
  it("admits a quickly amortizing recurring breaker-credit engine", () => {
    expect(
      assessRunnerRestrictedRunEconomyInvestment({
        engineLineActive: true,
        providerMatches: true,
        installedCompatibleBreakerCount: 1,
        installCost: 4,
        recurringCredits: 2,
        clicksRemaining: 4,
        runnerDeckCount: 30,
        urgentRunAvailable: false,
        productiveCentralRunAvailable: false,
      }),
    ).toMatchObject({
      decision: "install",
      priorityClass: "P4",
      value: 300,
      projectedBreakEvenRuns: 2,
      evidenceCodes: expect.arrayContaining([
        "runner_restricted_run_economy_install_ready",
        "runner_restricted_run_economy_break_even_runs:2",
      ]),
    });
  });

  it("holds until a compatible breaker can actually consume the credits", () => {
    expect(
      assessRunnerRestrictedRunEconomyInvestment({
        engineLineActive: true,
        providerMatches: true,
        installedCompatibleBreakerCount: 0,
        installCost: 4,
        recurringCredits: 2,
        clicksRemaining: 4,
        runnerDeckCount: 30,
        urgentRunAvailable: false,
        productiveCentralRunAvailable: false,
      }),
    ).toMatchObject({
      decision: "hold",
      priorityClass: "P5",
      value: 0,
      evidenceCodes: expect.arrayContaining([
        "runner_restricted_run_economy_requires_installed_compatible_breaker",
      ]),
    });
  });

  it("does not displace an urgent access window", () => {
    expect(
      assessRunnerRestrictedRunEconomyInvestment({
        engineLineActive: true,
        providerMatches: true,
        installedCompatibleBreakerCount: 2,
        installCost: 4,
        recurringCredits: 2,
        clicksRemaining: 4,
        runnerDeckCount: 30,
        urgentRunAvailable: true,
        productiveCentralRunAvailable: false,
      }),
    ).toMatchObject({
      decision: "hold",
      priorityClass: "P5",
      evidenceCodes: expect.arrayContaining([
        "runner_restricted_run_economy_yields_to_urgent_run",
      ]),
    });
  });

  it("does not displace a productive central-pressure run", () => {
    expect(
      assessRunnerRestrictedRunEconomyInvestment({
        engineLineActive: true,
        providerMatches: true,
        installedCompatibleBreakerCount: 2,
        installCost: 4,
        recurringCredits: 2,
        clicksRemaining: 4,
        runnerDeckCount: 30,
        urgentRunAvailable: false,
        productiveCentralRunAvailable: true,
      }),
    ).toMatchObject({
      decision: "hold",
      priorityClass: "P5",
      evidenceCodes: expect.arrayContaining([
        "runner_restricted_run_economy_yields_to_productive_central_run",
      ]),
    });
  });
});

describe("assessRunnerRecurringEconomyRunHorizon", () => {
  it("waits for the first payout even when a weak run is legal", () => {
    expect(assess({ score: 150, payoutStillUnrealized: true })).toMatchObject({
      decision: "wait",
      bestVisibleRunPayoff: 150,
    });
  });

  it("keeps building after a payout when another payout beats the weak run", () => {
    expect(
      assess({
        score: 180,
        payoutStillUnrealized: false,
        realizedValue: 2,
      }),
    ).toMatchObject({
      decision: "wait",
      bestVisibleRunPayoff: 180,
    });
  });

  it("releases a weak ready run after the finite investment horizon is recouped", () => {
    expect(
      assess({
        score: 180,
        payoutStillUnrealized: false,
        realizedValue: 4,
        installCost: 0,
      }),
    ).toMatchObject({
      decision: "allow_run",
      bestVisibleRunPayoff: 180,
      evidenceCodes: expect.arrayContaining([
        "runner_recurring_economy_investment_horizon_recouped:4:4",
      ]),
    });
  });

  it("allows a valuable run after the first payout", () => {
    expect(assess({ score: 450, payoutStillUnrealized: false })).toMatchObject({
      decision: "allow_run",
      bestVisibleRunPayoff: 450,
    });
  });

  it("lets an urgent agenda run preempt before amortization", () => {
    expect(
      assess({
        score: 900,
        payoutStillUnrealized: true,
        accessPayoff: "agenda",
        scoreThreat: true,
      }),
    ).toMatchObject({
      decision: "preempt_for_urgent_run",
      bestVisibleRunPayoff: 900,
    });
  });

  it("lets a recommended reachable run preempt when the opponent is at matchpoint", () => {
    expect(
      assess({
        score: 100,
        payoutStillUnrealized: false,
        opponentAgendaPoints: 5,
      }),
    ).toMatchObject({
      decision: "preempt_for_urgent_run",
      bestVisibleRunPayoff: 100,
      evidenceCodes: expect.arrayContaining([
        "runner_recurring_economy_preempting_opponent_matchpoint",
      ]),
    });
  });
});

function assess(params: {
  score: number;
  payoutStillUnrealized: boolean;
  accessPayoff?: RunnerRunTargetEvaluation["accessPayoff"];
  scoreThreat?: boolean;
  opponentAgendaPoints?: number;
  realizedValue?: number;
  installCost?: number;
}) {
  return assessRunnerRecurringEconomyRunHorizon({
    runTargets: [
      {
        actionId: "generic-run",
        pathPassability: "reachable",
        recommendation: "run_now",
        score: params.score,
        accessPayoff: params.accessPayoff ?? "fresh",
        scoreThreat: params.scoreThreat ?? false,
      } as RunnerRunTargetEvaluation,
    ],
    legalRunActionIds: new Set(["generic-run"]),
    runnerAgendaPoints: 0,
    opponentAgendaPoints: params.opponentAgendaPoints ?? 0,
    agendaPointsToWin: 7,
    installCost: params.installCost ?? 0,
    futureValueAtRisk: 2,
    realizedValue: params.realizedValue ?? 0,
    payoutStillUnrealized: params.payoutStillUnrealized,
  });
}
