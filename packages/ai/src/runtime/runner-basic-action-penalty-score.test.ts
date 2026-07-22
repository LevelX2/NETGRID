import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { runnerBasicActionPenaltyScoreComponents } from "./runner-basic-action-penalty-score";

describe("runnerBasicActionPenaltyScoreComponents", () => {
  it("penalizes continuing through an end-the-run subroutine when a break is legal", () => {
    const continueRun = action("continue_run", {
      encounterContinue: true,
      encounterWillEndRun: true,
    });
    const input = inputWithActions([
      continueRun,
      action("break_subroutine", { encounterWillEndRun: false }),
    ]);

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        continueRun,
        "simple_run_choice",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_continue_run_ends_run_with_break_available",
          value: -2500,
          reason: "break_or_pump_available",
        }),
      ]),
    );
  });

  it("penalizes continuing through an end-the-run subroutine when a pump can lead to a break", () => {
    const continueRun = action("continue_run", {
      encounterContinue: true,
      encounterWillEndRun: true,
    });
    const input = inputWithActions([
      continueRun,
      action("pump_breaker", { encounterWillEndRun: false }),
    ]);

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        continueRun,
        "simple_run_choice",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_continue_run_ends_run_with_break_available",
          value: -2500,
          reason: "break_or_pump_available",
        }),
      ]),
    );
  });

  it("does not penalize the only legal continue through an encounter", () => {
    const continueRun = action("continue_run", {
      encounterContinue: true,
      encounterWillEndRun: true,
    });
    const input = inputWithActions([continueRun]);

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        continueRun,
        "simple_run_choice",
      ).some(
        (component) =>
          component.key === "runner_continue_run_ends_run_with_break_available",
      ),
    ).toBe(false);
  });

  it("does not penalize continuing when the legal pump cannot fund a break", () => {
    const continueRun = action("continue_run", {
      encounterContinue: true,
      encounterWillEndRun: true,
    });
    const pump = action("pump_breaker", { encounterWillEndRun: false });
    const input = inputWithActions([continueRun, pump]);

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        continueRun,
        "simple_run_choice",
        {
          encounterActionIsViable: (_input, candidate) => candidate !== pump,
        },
      ).some(
        (component) =>
          component.key === "runner_continue_run_ends_run_with_break_available",
      ),
    ).toBe(false);
  });

  it("does not treat accepting a delayed ICE self-trash as an ordinary avoidable end-run loss", () => {
    const continueRun = action("continue_run", {
      encounterContinue: true,
      encounterWillEndRun: true,
      encounterSourceWillTrashAtEndOfTurn: true,
    });
    const input = inputWithActions([
      continueRun,
      action("pump_breaker", { encounterWillEndRun: false }),
    ]);

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        continueRun,
        "simple_run_choice",
      ).some(
        (component) =>
          component.key === "runner_continue_run_ends_run_with_break_available",
      ),
    ).toBe(false);
  });

  it("does not penalize accepting nonlethal damage when the run ends anyway", () => {
    const continueRun = action("continue_run", {
      encounterContinue: true,
      encounterWillEndRun: true,
    });
    const input = inputWithEncounterActions(
      [continueRun, action("pump_breaker")],
      3,
    );

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        continueRun,
        "simple_run_choice",
      ).some(
        (component) =>
          component.key === "runner_continue_run_ends_run_with_break_available",
      ),
    ).toBe(false);
  });

  it("keeps the continue penalty when the same damage would flatline", () => {
    const continueRun = action("continue_run", {
      encounterContinue: true,
      encounterWillEndRun: true,
    });
    const input = inputWithEncounterActions(
      [continueRun, action("pump_breaker")],
      0,
    );

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        continueRun,
        "simple_run_choice",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_continue_run_ends_run_with_break_available",
        }),
      ]),
    );
  });

  it("penalizes basic setup when a high-priority central pressure goal is ready", () => {
    const gain = action("gain_credit");
    gain.source = "basic_action";
    const run = action("start_run", { serverId: "rd" });
    const input = inputWithActions([gain, run]);
    input.playerView.own.credits = 8;
    (
      input as AiDecisionInput & { ownRunnerTacticalGoals: unknown[] }
    ).ownRunnerTacticalGoals = [
      {
        goalId: "runner.pressure_good_central_target",
        priority: 900,
        targetServerId: "rd",
      },
    ];

    expect(
      runnerBasicActionPenaltyScoreComponents(
        input,
        gain,
        "basic_economy_draw",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_basic_setup_over_ready_pressure",
          value: -1200,
          reason: expect.stringContaining("target:rd"),
        }),
      ]),
    );
  });

  it("penalizes another basic credit when a rich runner can develop", () => {
    const gain = action("gain_credit");
    gain.source = "basic_action";
    const decisionInput = inputWithActions([gain, action("install_card")]);
    decisionInput.playerView.own.credits = 15;

    expect(
      runnerBasicActionPenaltyScoreComponents(
        decisionInput,
        gain,
        "basic_economy_draw",
      ),
    ).toContainEqual(
      expect.objectContaining({
        key: "runner_rich_credit_without_conversion",
        value: -1200,
      }),
    );
  });

  it("does not penalize the only useful action even at a high credit pool", () => {
    const gain = action("gain_credit");
    gain.source = "basic_action";
    const decisionInput = inputWithActions([gain, action("end_turn")]);
    decisionInput.playerView.own.credits = 15;

    expect(
      runnerBasicActionPenaltyScoreComponents(
        decisionInput,
        gain,
        "basic_economy_draw",
      ).some(
        (component) =>
          component.key === "runner_rich_credit_without_conversion",
      ),
    ).toBe(false);
  });

  it("applies the rich-credit conversion penalty to a stronger card ability too", () => {
    const gainTwo = action("activated_card_ability", {
      gainCreditsAmount: 2,
    });
    const basicGain = action("gain_credit");
    basicGain.source = "basic_action";
    const develop = action("install_card");
    const decisionInput = inputWithActions([gainTwo, basicGain, develop]);
    decisionInput.playerView.own.credits = 15;

    const cardComponents = runnerBasicActionPenaltyScoreComponents(
      decisionInput,
      gainTwo,
      "basic_economy_draw",
    );
    const basicComponents = runnerBasicActionPenaltyScoreComponents(
      decisionInput,
      basicGain,
      "basic_economy_draw",
    );

    expect(cardComponents).toContainEqual(
      expect.objectContaining({
        key: "runner_rich_credit_without_conversion",
        value: -1200,
      }),
    );
    expect(basicComponents).toContainEqual(
      expect.objectContaining({
        key: "runner_rich_credit_without_conversion",
        value: -1200,
      }),
    );
  });

  it("only discounts the credit portion of a mixed credit-and-draw action", () => {
    const mixedEconomy = action("play_event", {
      gainCreditsAmount: 2,
      drawCardsAmount: 1,
    });
    const decisionInput = inputWithActions([
      mixedEconomy,
      action("install_card"),
    ]);
    decisionInput.playerView.own.credits = 15;

    expect(
      runnerBasicActionPenaltyScoreComponents(
        decisionInput,
        mixedEconomy,
        "basic_economy_draw",
      ),
    ).toContainEqual(
      expect.objectContaining({
        key: "runner_rich_credit_without_conversion",
        value: -150,
        reason: expect.stringContaining("immediate_draw:1"),
      }),
    );
  });

  it("allows ending a rich turn when every available conversion scores below neutral", () => {
    const endTurn = action("end_turn");
    const decisionInput = inputWithActions([
      endTurn,
      action("activated_card_ability"),
    ]);
    decisionInput.playerView.own.credits = 15;
    decisionInput.playerView.own.clicks = 3;

    expect(
      runnerBasicActionPenaltyScoreComponents(
        decisionInput,
        endTurn,
        "end_turn",
      ).some((component) => component.key === "runner_unused_actions"),
    ).toBe(false);
  });

  it("keeps the unused-action penalty when rich credits are the only option", () => {
    const endTurn = action("end_turn");
    const basicGain = action("gain_credit");
    basicGain.source = "basic_action";
    const decisionInput = inputWithActions([endTurn, basicGain]);
    decisionInput.playerView.own.credits = 15;
    decisionInput.playerView.own.clicks = 3;

    expect(
      runnerBasicActionPenaltyScoreComponents(
        decisionInput,
        endTurn,
        "end_turn",
      ),
    ).toContainEqual(
      expect.objectContaining({
        key: "runner_unused_actions",
        value: -1500,
      }),
    );
  });
});

function inputWithActions(legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: "runner",
    legalActions,
    playerView: { own: { clicks: 1, credits: 0 } },
  } as unknown as AiDecisionInput;
}

function inputWithEncounterActions(
  legalActions: LegalAction[],
  gripSize: number,
): AiDecisionInput {
  const ice = {
    instanceId: "mobile-barricade",
    known: true,
    effectiveRunQuote: {
      iceInstanceId: "mobile-barricade",
      effectiveStrength: 3,
      subroutines: [
        {
          id: "mobile-barricade.net_damage",
          type: "do_damage" as const,
          amount: 1,
          unbrokenRunEffect: { causesDamageOrProgramTrash: true },
        },
        { id: "mobile-barricade.end_the_run", type: "end_the_run" as const },
      ],
    },
  };
  return {
    side: "runner",
    legalActions,
    playerView: {
      own: {
        clicks: 1,
        credits: 8,
        gripOrHq: Array.from({ length: gripSize }, (_, index) => ({
          instanceId: `grip-${index}`,
          known: true,
        })),
      },
      servers: [{ id: "remote_1", label: "Remote 1", ice: [ice], root: [] }],
      run: {
        phase: "encounter_ice",
        encounteredIce: ice,
      },
    },
  } as unknown as AiDecisionInput;
}

function action(
  type: LegalAction["type"],
  payload: Record<string, unknown> = {},
): LegalAction {
  return {
    actionId: `runner.${type}`,
    side: "runner",
    type,
    payload,
  } as LegalAction;
}
