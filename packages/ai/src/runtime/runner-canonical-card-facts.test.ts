import { describe, expect, it } from "vitest";

import {
  runnerDebtFinancingProfile,
  runnerDebtFinancingProfileFromPlanningCard,
  runnerInstalledDebtFinancingLiability,
  runnerNoRunRecurringEconomyProfile,
  runnerNoRunRecurringEconomyProfileFromPlanningCard,
  runnerRunStartTrashSourceProfile,
  runnerRunStartTrashSourceProfileFromPlanningCard,
  runnerStartOfTurnCreditProfile,
  runnerStartOfTurnCreditProfileFromPlanningCard,
} from "./runner-canonical-card-facts";

describe("Runner canonical card facts", () => {
  it("accepts run-start ordering only for a complete pure self-trash lifecycle", () => {
    expect(
      runnerRunStartTrashSourceProfile("onr_v1_184_top-runners-conference"),
    ).toEqual({ sourceEffect: "trash_source" });
    expect(
      runnerRunStartTrashSourceProfileFromPlanningCard({
        planning: {
          side: "runner",
          engine: {
            characteristics: { numeric: {} },
            lifecycle: {
              on_runner_run_start: [
                {
                  effects: [
                    { kind: "trash_source" },
                    {
                      kind: "gain_credits",
                      recipient: "controller",
                      amount: 1,
                    },
                  ],
                },
              ],
            },
          },
        },
      } as never),
    ).toBeUndefined();
  });

  it("projects no-run recurring economy from the canonical lifecycle", () => {
    expect(
      runnerNoRunRecurringEconomyProfile("onr_v1_184_top-runners-conference"),
    ).toEqual({
      installCost: 0,
      turnStartCredits: 2,
      earliestPayout: "start_of_runner_turn",
      invalidatingActionType: "start_run",
    });
  });

  it("does not infer the profile for unrelated Runner resources", () => {
    expect(
      runnerNoRunRecurringEconomyProfile("onr_v1_295_night-shift"),
    ).toBeUndefined();
  });

  it("recognizes a differently named delayed investment from the generic canonical contract", () => {
    expect(
      runnerNoRunRecurringEconomyProfileFromPlanningCard({
        planning: {
          side: "runner",
          planningAnnotations: {
            card: [{ kind: "plan_role", role: "recover_economy" }],
          },
          engine: {
            characteristics: { numeric: { installCost: 1 } },
            lifecycle: {
              start_of_runner_turn: [
                {
                  effects: [
                    {
                      kind: "gain_credits",
                      recipient: "controller",
                      amount: 3,
                    },
                  ],
                },
              ],
              on_runner_run_start: [{ effects: [{ kind: "trash_source" }] }],
            },
          },
        },
      } as never),
    ).toEqual({
      installCost: 1,
      turnStartCredits: 3,
      earliestPayout: "start_of_runner_turn",
      invalidatingActionType: "start_run",
    });
  });

  it("derives the full debt consequence from Loan's canonical lifecycle", () => {
    expect(runnerDebtFinancingProfile("onr_v1_168_loan-from-chiba")).toEqual({
      installCost: 0,
      installCreditGain: 12,
      startOfTurnCreditLoss: 1,
      leavePlayPayCost: 10,
      canTrashAtEndOfRunnerTurn: true,
    });
  });

  it("recognizes a differently named fixture through the generic exchange contract", () => {
    expect(
      runnerDebtFinancingProfileFromPlanningCard({
        planning: {
          side: "runner",
          planningAnnotations: {
            card: [{ kind: "strategic_exchange", exchange: "debt_financing" }],
          },
          engine: {
            characteristics: { numeric: { installCost: 2 } },
            lifecycle: {
              on_install: [
                { kind: "gain_credits", recipient: "controller", amount: 9 },
              ],
              start_of_runner_turn: [
                {
                  effects: [
                    {
                      kind: "lose_credits",
                      recipient: "controller",
                      amount: 2,
                    },
                  ],
                },
              ],
              on_leave_play: [
                {
                  kind: "pay_credits_or_lose_game",
                  payer: "controller",
                  amount: 7,
                  loseSide: "controller",
                },
              ],
              end_of_runner_turn: [{ effects: [{ kind: "trash_source" }] }],
            },
          },
        },
      } as never),
    ).toEqual({
      installCost: 2,
      installCreditGain: 9,
      startOfTurnCreditLoss: 2,
      leavePlayPayCost: 7,
      canTrashAtEndOfRunnerTurn: true,
    });
  });

  it("fails closed when a required debt consequence is absent", () => {
    expect(
      runnerDebtFinancingProfileFromPlanningCard({
        planning: {
          side: "runner",
          planningAnnotations: {
            card: [{ kind: "strategic_exchange", exchange: "debt_financing" }],
          },
          engine: {
            characteristics: { numeric: { installCost: 0 } },
            lifecycle: {
              on_install: [
                { kind: "gain_credits", recipient: "controller", amount: 9 },
              ],
            },
          },
        },
      } as never),
    ).toBeUndefined();
  });

  it("counts two installed debts as two net next-turn credit losses", () => {
    expect(
      runnerInstalledDebtFinancingLiability([
        "onr_v1_168_loan-from-chiba",
        "onr_v1_168_loan-from-chiba",
        "onr_v1_295_night-shift",
      ]),
    ).toEqual({
      instanceCount: 2,
      nextTurnCreditLoss: 2,
      totalLeavePlayPayCost: 20,
    });
  });

  it("profiles a hosted-credit start trigger without identifying the card by name", () => {
    expect(
      runnerStartOfTurnCreditProfile("onr_v1_174_rigged-investments"),
    ).toEqual({
      orderClass: "credit_gain",
      amount: 1,
      sourceEffect: "take_hosted_credits",
    });
    expect(
      runnerStartOfTurnCreditProfileFromPlanningCard({
        planning: {
          side: "runner",
          engine: {
            lifecycle: {
              start_of_runner_turn: [
                {
                  effects: [
                    {
                      kind: "take_hosted_credits",
                      source: "source",
                      recipient: "controller",
                      amount: 2,
                    },
                    { kind: "trash_source_when_empty" },
                  ],
                },
              ],
            },
          },
        },
      } as never),
    ).toEqual({
      orderClass: "credit_gain",
      amount: 2,
      sourceEffect: "take_hosted_credits",
    });
  });
});
