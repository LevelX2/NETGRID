import { describe, expect, it } from "vitest";

import {
  runnerDebtFinancingProfile,
  runnerDebtFinancingProfileFromPlanningCard,
  runnerInstalledDebtFinancingLiability,
  runnerNoRunRecurringEconomyProfile,
  runnerNoRunRecurringEconomyProfileFromPlanningCard,
  runnerRunStartTrashSourceProfile,
  runnerRunStartTrashSourceProfileFromPlanningCard,
  runnerRunStartRandomStrengthSourceProfile,
  runnerRunStartRandomStrengthSourceProfileFromPlanningCard,
  runnerStartOfTurnCreditProfile,
  runnerStartOfTurnCreditProfileFromPlanningCard,
  runnerStartOfTurnDelayedInstallCountdownProfile,
  runnerStartOfTurnDelayedInstallCountdownProfileFromPlanningCard,
  runnerStartOfTurnOptionalInstalledCardConversionProfile,
  runnerStartOfTurnOptionalInstalledCardConversionProfileFromPlanningCard,
  runnerStartOfTurnRandomEffectProfile,
  runnerStartOfTurnRandomEffectProfileFromPlanningCard,
  runnerVoluntarySelfTrashLifecycleProfile,
} from "./runner-canonical-card-facts";

describe("Runner canonical card facts", () => {
  it("derives the voluntary self-trash tradeoff from the complete lifecycle", () => {
    expect(
      runnerVoluntarySelfTrashLifecycleProfile("onr_classic_044_crash-space"),
    ).toEqual({
      turnStartCreditGain: 1,
      leavePlayCreditLoss: 2,
      exposesRunnerToAutomaticTraceSuccess: true,
    });
  });

  it("recognizes only a complete run-start random-strength breaker", () => {
    expect(
      runnerRunStartRandomStrengthSourceProfile("onr_v1_002_ai-boon"),
    ).toEqual({ sourceEffect: "random_run_strength", dieSides: 6 });
    expect(
      runnerRunStartRandomStrengthSourceProfileFromPlanningCard({
        planning: {
          side: "runner",
          engine: {
            characteristics: { strength: { kind: "random_die", dieSides: 6 } },
            icebreakerAbilities: [],
          },
        },
      } as never),
    ).toBeUndefined();
  });

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

  it("profiles a complete public Runner start-turn random table without identifying the card by name", () => {
    expect(
      runnerStartOfTurnRandomEffectProfile(
        "onr_classic_048_omnitech-spinal-tap-cybermodem",
      ),
    ).toEqual({
      orderClass: "random_effect",
      dieFaces: 6,
      maximumDamage: 2,
      maximumExtraActions: 0,
      sourceEffect: "start_turn_random_effect_table",
    });
    expect(
      runnerStartOfTurnRandomEffectProfileFromPlanningCard({
        planning: {
          side: "runner",
          engine: {
            runnerUtilityLongtail: {
              kind: "start_turn_random_effect_table",
              dieFaces: 6,
              randomPurpose: "runner_start_turn_source",
              outcomes: [
                {
                  roll: 1,
                  kind: "unpreventable_damage",
                  damageType: "net",
                  amount: 1,
                },
                {
                  roll: 6,
                  kind: "trash_source_and_grant_persistent_extra_action",
                  extraActions: 1,
                },
              ],
              defaultOutcome: { kind: "no_effect" },
              visibility: "public",
            },
          },
        },
      } as never),
    ).toEqual({
      orderClass: "random_effect",
      dieFaces: 6,
      maximumDamage: 1,
      maximumExtraActions: 1,
      sourceEffect: "start_turn_random_effect_table",
    });
  });

  it("profiles an optional installed-card conversion from the complete canonical contract", () => {
    expect(
      runnerStartOfTurnOptionalInstalledCardConversionProfile(
        "onr_v1_180_smiths-pawnshop",
      ),
    ).toEqual({
      orderClass: "optional_installed_card_conversion",
      gainCredits: 2,
      sourceEffect: "start_turn_trash_for_credits",
    });
    expect(
      runnerStartOfTurnOptionalInstalledCardConversionProfileFromPlanningCard({
        planning: {
          side: "runner",
          engine: {
            uniqueDirectLongtail: {
              kind: "start_turn_trash_for_credits",
              gainCredits: 2,
              visibility: "public",
            },
          },
        },
      } as never),
    ).toEqual({
      orderClass: "optional_installed_card_conversion",
      gainCredits: 2,
      sourceEffect: "start_turn_trash_for_credits",
    });
  });

  it("fails closed for an incomplete optional installed-card conversion", () => {
    expect(
      runnerStartOfTurnOptionalInstalledCardConversionProfileFromPlanningCard({
        planning: {
          side: "runner",
          engine: {
            uniqueDirectLongtail: {
              kind: "start_turn_trash_for_credits",
              gainCredits: 2,
              visibility: "private",
            },
          },
        },
      } as never),
    ).toBeUndefined();
  });

  it("profiles a delayed-install countdown from the canonical hidden replacement contract", () => {
    expect(
      runnerStartOfTurnDelayedInstallCountdownProfile(
        "onr_v1_176_the-shell-traders",
      ),
    ).toEqual({
      orderClass: "delayed_install_countdown",
      sourceEffect: "remove_delayed_install_counter",
    });
    expect(
      runnerStartOfTurnDelayedInstallCountdownProfileFromPlanningCard({
        planning: {
          side: "runner",
          engine: {
            hiddenReplacementLongtail: {
              kind: "delayed_install_with_counter_countdown",
              visibility: "public",
            },
          },
        },
      } as never),
    ).toBeUndefined();
  });
});
