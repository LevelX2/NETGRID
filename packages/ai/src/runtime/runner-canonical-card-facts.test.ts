import { describe, expect, it } from "vitest";

import {
  runnerDebtFinancingProfile,
  runnerDebtFinancingProfileFromPlanningCard,
  runnerInstalledDebtFinancingLiability,
  runnerNoRunRecurringEconomyProfile,
} from "./runner-canonical-card-facts";

describe("Runner canonical card facts", () => {
  it("projects no-run recurring economy from the canonical lifecycle", () => {
    expect(
      runnerNoRunRecurringEconomyProfile(
        "onr_v1_184_top-runners-conference",
      ),
    ).toEqual({ turnStartCredits: 2 });
  });

  it("does not infer the profile for unrelated Runner resources", () => {
    expect(
      runnerNoRunRecurringEconomyProfile("onr_v1_295_night-shift"),
    ).toBeUndefined();
  });

  it("derives the full debt consequence from Loan's canonical lifecycle", () => {
    expect(
      runnerDebtFinancingProfile("onr_v1_168_loan-from-chiba"),
    ).toEqual({
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
            card: [
              { kind: "strategic_exchange", exchange: "debt_financing" },
            ],
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
              end_of_runner_turn: [
                { effects: [{ kind: "trash_source" }] },
              ],
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
            card: [
              { kind: "strategic_exchange", exchange: "debt_financing" },
            ],
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
});
