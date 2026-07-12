import { describe, expect, it } from "vitest";
import type { LegalAction, PlayerView, VisibleCard } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "./input-dto";

describe("AI input DTO score-conversion contract", () => {
  it("preserves exact public score-conversion capabilities and drops unknown payload data", () => {
    const action = conversionAction();
    const input = buildAiDecisionInputDto({
      side: "corp",
      playerView: playerView(action),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "score-conversion-dto",
      decisionId: "score-conversion-dto:corp:1",
      actionNumber: 1,
      profileId: "score-conversion-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      scoreConversionCapability: "move_advancement",
      scoreConversionAdvancementMaximum: "all",
      scoreConversionSourceMode: "source_card",
      scoreConversionTargetMode: "chosen_installed_advanceable_card",
      scoreConversionTiming: "immediate",
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      scoreConversionCapability: "move_advancement",
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty("privateProbe");
  });

  it("preserves side-safe hosted-credit and run-action semantics", () => {
    const action = runnerSemanticAction();
    const input = buildAiDecisionInputDto({
      side: "runner",
      playerView: playerView(action, "runner"),
      eventTail: [],
      legalActions: [action],
      difficulty: "normal",
      seed: "runner-action-semantics-dto",
      decisionId: "runner-action-semantics-dto:runner:1",
      actionNumber: 1,
      profileId: "runner-action-semantics-dto-test",
    });

    expect(input.legalActions[0]?.payload).toMatchObject({
      cardImplementationAddsHostedCredits: true,
      hostedCreditAddAmount: 3,
      cardImplementationTakesHostedCredits: false,
      hostedCreditTakeAmount: 0,
      hostedCreditTakeMode: "all",
      runnerEventRun: true,
    });
    expect(input.playerView.legalActions[0]?.payload).toMatchObject({
      cardImplementationAddsHostedCredits: true,
      runnerEventRun: true,
    });
    expect(input.legalActions[0]?.payload).not.toHaveProperty("privateProbe");
  });
});

function conversionAction(): LegalAction {
  return {
    actionId: "corp.score-conversion.move",
    side: "corp",
    type: "activated_card_ability",
    label: "Advancement-Counter bewegen",
    source: "corp-conversion-source",
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload: {
      cardId: "corp-conversion-source",
      scoreConversionCapability: "move_advancement",
      scoreConversionAdvancementMaximum: "all",
      scoreConversionSourceMode: "source_card",
      scoreConversionTargetMode: "chosen_installed_advanceable_card",
      scoreConversionTiming: "immediate",
      privateProbe: "must-not-cross-dto",
    },
  };
}

function runnerSemanticAction(): LegalAction {
  return {
    actionId: "runner.hosted-credit.build",
    side: "runner",
    type: "activated_card_ability",
    label: "Credit-Bank laden",
    source: "runner-bank",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1, credits: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    payload: {
      cardId: "runner-bank",
      cardImplementationAddsHostedCredits: true,
      hostedCreditAddAmount: 3,
      cardImplementationTakesHostedCredits: false,
      hostedCreditTakeAmount: 0,
      hostedCreditTakeMode: "all",
      runnerEventRun: true,
      privateProbe: "must-not-cross-dto",
    },
  };
}

function playerView(
  action: LegalAction,
  side: "corp" | "runner" = "corp",
): PlayerView {
  const corpIdentity = identity("corp");
  const runnerIdentity = identity("runner");
  return {
    side,
    stateVersion: 1,
    timingPoint: side === "corp" ? "corp_action.main" : "runner_action.main",
    activeSide: side,
    phase: "action",
    own: {
      identity: side === "corp" ? corpIdentity : runnerIdentity,
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 40,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: side === "corp" ? runnerIdentity : corpIdentity,
      credits: 5,
      clicks: 4,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      coreDamage: 0,
      deckCount: 40,
      discardCount: 0,
      discardCards: [],
      scoreArea: [],
      rig: [],
      memoryUsed: 0,
      memoryLimit: 4,
    },
    servers: [],
    publicEvents: [],
    legalActions: [action],
    winner: null,
    agendaPointsToWin: 7,
  } as unknown as PlayerView;
}

function identity(side: "corp" | "runner"): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}
