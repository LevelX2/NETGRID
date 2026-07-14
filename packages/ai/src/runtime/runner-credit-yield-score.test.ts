import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { runnerCreditYieldScoreComponent } from "./runner-credit-yield-score";

describe("runnerCreditYieldScoreComponent", () => {
  it("scores visible runner economy events by structured credit gain", () => {
    const component = runnerCreditYieldScoreComponent(
      input(),
      legalAction({
        actionId: "play-livewire",
        type: "play_event",
        source: "runner_onr_v1_097_livewires-contacts_1",
      }),
      {
        sourceDefinitionIdForAction: () => "onr_v1_097_livewires-contacts",
        hintForDefinitionId: () => ({
          effects: [
            {
              amount: 3,
              kind: "economy",
              resource: "credits",
              scope: "runner",
              timing: "action",
            },
          ],
        }),
        actionCreditCost: () => 0,
      },
    );

    expect(component).toEqual({
      key: "runner_credit_action_yield",
      label: "Marginaler Credit-Nutzen",
      value: 1800,
      reason:
        "net_gain:3|gross_gain:3|action:play_event|source:onr_v1_097_livewires-contacts",
    });
  });

  it("leaves the basic credit action to existing credit-need scoring", () => {
    const component = runnerCreditYieldScoreComponent(
      input(),
      legalAction({
        actionId: "runner.gain_credit",
        type: "gain_credit",
        source: "basic_action",
      }),
      {
        sourceDefinitionIdForAction: () => "",
        hintForDefinitionId: () => undefined,
        actionCreditCost: () => 0,
      },
    );

    expect(component).toBeUndefined();
  });

  it("does not treat generic action amounts as credit gain", () => {
    const component = runnerCreditYieldScoreComponent(
      input(),
      legalAction({
        actionId: "draw-three",
        type: "draw_card",
        payload: { amount: 3 },
      }),
      {
        sourceDefinitionIdForAction: () => "",
        hintForDefinitionId: () => undefined,
        actionCreditCost: () => 0,
      },
    );

    expect(component).toBeUndefined();
  });

  it("damps repeatable credit yield above reserve when development is legal", () => {
    const economy = legalAction({
      actionId: "newsgroup",
      type: "activated_card_ability",
      payload: { gainCreditsAmount: 2 },
    });
    const decisionInput = input();
    decisionInput.playerView.own.credits = 53;
    decisionInput.legalActions = [
      economy,
      legalAction({ actionId: "draw", type: "draw_card" }),
    ];

    const component = runnerCreditYieldScoreComponent(
      decisionInput,
      economy,
      dependencies("onr_v1_045_newsgroup-filter"),
    );

    expect(component).toMatchObject({
      key: "runner_credit_action_yield",
      value: -240,
      reason: expect.stringContaining("marginal_multiplier:0.1"),
    });
    expect(component?.reason).toContain(
      "repeatable_saturation_opportunity_penalty:360",
    );
  });

  it("keeps repeatable economy positive while the reserve is only moderately exceeded", () => {
    const economy = legalAction({
      actionId: "newsgroup",
      type: "activated_card_ability",
      payload: { gainCreditsAmount: 2 },
    });
    const decisionInput = input();
    decisionInput.playerView.own.credits = 8;
    decisionInput.legalActions = [
      economy,
      legalAction({ actionId: "develop", type: "install_card" }),
    ];

    expect(
      runnerCreditYieldScoreComponent(
        decisionInput,
        economy,
        dependencies("onr_v1_045_newsgroup-filter"),
      ),
    ).toMatchObject({ value: 600 });
  });

  it("keeps full repeatable credit yield below reserve", () => {
    const economy = legalAction({
      actionId: "newsgroup",
      type: "activated_card_ability",
      payload: { gainCreditsAmount: 2 },
    });
    const decisionInput = input();
    decisionInput.playerView.own.credits = 2;
    decisionInput.legalActions = [
      economy,
      legalAction({ actionId: "draw", type: "draw_card" }),
    ];

    expect(
      runnerCreditYieldScoreComponent(
        decisionInput,
        economy,
        dependencies("onr_v1_045_newsgroup-filter"),
      ),
    ).toMatchObject({ value: 1200 });
  });

  it("keeps full repeatable credit yield when no conversion action exists", () => {
    const economy = legalAction({
      actionId: "newsgroup",
      type: "activated_card_ability",
      payload: { gainCreditsAmount: 2 },
    });
    const decisionInput = input();
    decisionInput.playerView.own.credits = 53;
    decisionInput.legalActions = [economy];

    expect(
      runnerCreditYieldScoreComponent(
        decisionInput,
        economy,
        dependencies("onr_v1_045_newsgroup-filter"),
      ),
    ).toMatchObject({ value: 1200 });
  });
});

function dependencies(sourceDefinitionId: string) {
  return {
    sourceDefinitionIdForAction: () => sourceDefinitionId,
    hintForDefinitionId: () => undefined,
    actionCreditCost: () => 0,
  };
}

function input(): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: 1,
      side: "runner",
      activeSide: "runner",
      phase: "runner_action_phase",
      timingPoint: "runner_action.main",
      own: {
        identity: visibleCard("runner", "runner"),
        credits: 4,
        clicks: 4,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 30,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleCard("corp", "corp"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 30,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [],
    difficulty: "normal",
    seed: "runner-credit-yield-score-test",
    decisionId: "runner-credit-yield-score-test",
    actionNumber: 1,
    profileId: "runner-credit-yield-score-test",
  };
}

function legalAction(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "play_event",
    label: "Action",
    source: "runner-source",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    ...overrides,
  } as LegalAction;
}

function visibleCard(instanceId: string, definitionId: string) {
  return {
    instanceId,
    definitionId,
    title: definitionId,
    owner: "runner",
    controller: "runner",
    type: "identity",
    known: true,
  } as AiDecisionInput["playerView"]["own"]["identity"];
}
