import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { corpTurnLiquidityDevelopmentNeed } from "../../plans/corp-economy-domain-signals";
import type { CorpEconomyLiquidityDevelopmentSignal } from "../../plans/corp-core-plan-modules";
import type { ResidentPlanPortfolio } from "../../plans/resident-plan-portfolio";

describe("match 9f8cecdd78b35d0e Corp scoring liveness at decision 60", () => {
  it("keeps one stable cross-turn liquidity target while the bound score milestone is unchanged", () => {
    const observedTargets: Array<number | undefined> = [];
    let previous: ResidentPlanPortfolio | undefined;

    for (const [index, credits] of [11, 14, 17].entries()) {
      const turnSerial = 20 + index;
      const input = decisionInput(credits, turnSerial, 60 + index);
      const signal = corpTurnLiquidityDevelopmentNeed(
        input,
        [basicCreditCandidate(input.playerView.stateVersion)],
        previous,
        `corp:${turnSerial}`,
      );
      observedTargets.push(signal?.targetCredits);
      if (signal) {
        previous = portfolioFor(signal, input.playerView.stateVersion);
      }
    }

    expect(observedTargets).toEqual([14, undefined, undefined]);
  });
});

function portfolioFor(
  signal: CorpEconomyLiquidityDevelopmentSignal,
  stateVersion: number,
): ResidentPlanPortfolio {
  return {
    stateVersion,
    instances: [
      {
        moduleId: "corp.economy",
        dedupeKey: signal.needId,
        moduleState: { kind: "economy", signal },
      },
    ],
  } as unknown as ResidentPlanPortfolio;
}

function decisionInput(
  credits: number,
  turnSerial: number,
  stateVersion: number,
): AiDecisionInput {
  return {
    side: "corp",
    actionNumber: stateVersion,
    legalActions: [
      {
        actionId: "basic-credit",
        side: "corp",
        type: "gain_credit",
        source: "basic_action",
        expiresAtStateVersion: stateVersion,
        targetRequirements: [],
        choiceRequirements: [],
        costs: [{ clicks: 1 }],
      },
      {
        actionId: "bound-score-and-remote-demand",
        side: "corp",
        type: "install_card",
        source: "agenda-1",
        expiresAtStateVersion: stateVersion,
        targetRequirements: [],
        choiceRequirements: [],
        costs: [{ clicks: 1, credits: 0 }],
        payload: {
          placement: "ice",
          serverId: "remote_1",
          postInstallRezQuoteComplete: true,
          postInstallRezQuoteFinalCredits: 14,
        },
      },
    ],
    playerView: {
      stateVersion,
      turnSerial,
      own: {
        credits,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [
          { instanceId: "agenda-1", known: true, type: "agenda" },
          { instanceId: "agenda-2", known: true, type: "agenda" },
        ],
        maxHandSize: 5,
      },
      servers: [
        { id: "hq", ice: [], root: [] },
        { id: "rd", ice: [], root: [] },
        { id: "archives", ice: [], root: [] },
        {
          id: "remote_1",
          ice: [
            { instanceId: "remote-ice-1", known: true, rezzed: false },
            { instanceId: "remote-ice-2", known: true, rezzed: false },
          ],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function basicCreditCandidate(stateVersion: number): ActionSemanticCandidate {
  return {
    actionId: "basic-credit",
    stateVersion,
    sourceKind: "basic_action",
    actionType: "gain_credit",
    semanticActionType: "economy.gain_credit",
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      additionalCosts: [],
    },
    economyProjection: {
      kind: "immediate_liquid",
      timing: "immediate",
      creditRestriction: "general",
      clickCost: 1,
      creditCost: 0,
      grossLiquidCreditGain: 1,
      netLiquidCreditGain: 1,
      cardsDrawn: 0,
      cardsConsumed: 0,
      netHandDelta: 0,
      payoutMode: "fixed",
      repeatable: true,
      reliability: "guaranteed",
      source: "basic_action_contract",
      confidence: "medium",
    },
  } as unknown as ActionSemanticCandidate;
}
