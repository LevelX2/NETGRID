import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { assessCorpEconomyAssetPayback } from "./economy-asset-payback";

describe("Corp economy asset payback", () => {
  it("prices a costly campaign against protection and actual remaining withdrawal clicks", () => {
    const input = corpInput(remote("r1", []));
    const quote = (setupActionCost: number) =>
      assessCorpEconomyAssetPayback({
        input,
        serverId: "r1",
        cadence: "finite_pool",
        baselineHorizonTurns: 3,
        finitePoolCredits: 15,
        payoutCreditsPerExecution: 3,
        payoutActionCost: 1,
        setupCreditCost: 4,
        setupActionCost,
      });
    expect(quote(1)).toMatchObject({
      projectedPayoutExecutions: 2,
      projectedNetCredits: -1,
    });
    expect(quote(0)).toMatchObject({
      projectedPayoutExecutions: 3,
      projectedNetCredits: 2,
    });
    input.playerView.own.clicks = 2;
    expect(quote(0)).toMatchObject({
      projectedPayoutExecutions: 2,
      projectedNetCredits: 0,
    });
    input.playerView.servers = [remote("r1", [knownRezzedWall("wall")])];
    expect(quote(1)).toMatchObject({
      protectionState: "protected_not_contestable",
      projectedNetCredits: 5,
    });
  });
  it("empties a protected campaign in 3+2 payouts after a last-click installation", () => {
    const input = corpInput(
      remote("r1", [knownRezzedWall("remote-wall")]),
    );
    input.playerView.own.clicks = 1;
    const quote = (reservedNextTurnClicks = 0) =>
      assessCorpEconomyAssetPayback({
        input,
        serverId: "r1",
        cadence: "finite_pool",
        baselineHorizonTurns: 3,
        finitePoolCredits: 15,
        payoutCreditsPerExecution: 3,
        payoutActionCost: 1,
        setupCreditCost: 4,
        setupActionCost: 1,
        reservedNextTurnClicks,
      });
    expect(quote()).toMatchObject({
      projectedCredits: 15,
      projectedNetCredits: 5,
      projectedPayoutsByTurn: [0, 3, 2],
      projectedExhaustion: { turnsFromNow: 2, remainingFlexibleClicks: 1 },
    });
    expect(quote(2)).toMatchObject({
      projectedCredits: 12,
      projectedPayoutsByTurn: [0, 1, 3],
    });
    input.playerView.own.corpFutureFlexibleClicks = [1, 3];
    expect(quote()).toMatchObject({
      projectedCredits: 12,
      projectedPayoutsByTurn: [0, 1, 3],
    });
    expect(quote()?.projectedExhaustion).toBeUndefined();
    delete input.playerView.own.corpFutureFlexibleClicks;
    expect(quote()?.projectedPayoutsByTurn).toEqual([0]);
  });

  it("counts the last partial withdrawal without inventing credits beyond the finite pool", () => {
    expect(
      assessCorpEconomyAssetPayback({
        input: corpInput(remote("r1", [])),
        serverId: "r1",
        cadence: "finite_pool",
        baselineHorizonTurns: 3,
        finitePoolCredits: 5,
        payoutCreditsPerExecution: 3,
        payoutActionCost: 1,
        setupCreditCost: 0,
        setupActionCost: 0,
      }),
    ).toMatchObject({
      projectedPayoutExecutions: 2,
      projectedCredits: 5,
      projectedNetCredits: 3,
    });
  });
  it("prices an unprotected finite pool only through its immediate payout window", () => {
    expect(
      assessCorpEconomyAssetPayback({
        input: corpInput(remote("r1", [])),
        serverId: "r1",
        cadence: "finite_pool",
        baselineHorizonTurns: 3,
        finitePoolCredits: 16,
        payoutCreditsPerExecution: 2,
        payoutActionCost: 1,
        setupCreditCost: 0,
        setupActionCost: 1,
      }),
    ).toMatchObject({
      protectionState: "unprotected",
      riskAdjustedHorizonTurns: 1,
      projectedPayoutExecutions: 2,
      unadjustedProjectedCredits: 16,
      projectedCredits: 4,
      projectedOpportunityCostCredits: 3,
      projectedNetCredits: 1,
    });
  });

  it("retains the bounded payout horizon behind a known unreachable path", () => {
    expect(
      assessCorpEconomyAssetPayback({
        input: corpInput(remote("r1", [knownRezzedWall("remote-wall")])),
        serverId: "r1",
        cadence: "finite_pool",
        baselineHorizonTurns: 3,
        finitePoolCredits: 16,
        payoutCreditsPerExecution: 2,
        payoutActionCost: 1,
        setupCreditCost: 0,
        setupActionCost: 1,
      }),
    ).toMatchObject({
      protectionState: "protected_not_contestable",
      riskAdjustedHorizonTurns: 3,
      projectedPayoutExecutions: 8,
      projectedCredits: 16,
      projectedOpportunityCostCredits: 9,
      projectedNetCredits: 7,
    });
  });

  it("keeps an already installed finite pool cashable before immediate exposure", () => {
    expect(
      assessCorpEconomyAssetPayback({
        input: corpInput(remote("r1", [])),
        serverId: "r1",
        cadence: "finite_pool",
        baselineHorizonTurns: 3,
        finitePoolCredits: 16,
        payoutCreditsPerExecution: 2,
        payoutActionCost: 1,
        setupCreditCost: 0,
        setupActionCost: 0,
      }),
    ).toMatchObject({
      protectionState: "unprotected",
      riskAdjustedHorizonTurns: 1,
      projectedPayoutExecutions: 3,
      projectedCredits: 6,
      projectedOpportunityCostCredits: 3,
      projectedNetCredits: 3,
    });
  });

  it("prices the current payout capacity using the actual action cost", () => {
    expect(
      assessCorpEconomyAssetPayback({
        input: corpInput(remote("r1", [knownRezzedWall("remote-wall")])),
        serverId: "r1",
        cadence: "finite_pool",
        baselineHorizonTurns: 3,
        finitePoolCredits: 16,
        payoutCreditsPerExecution: 2,
        payoutActionCost: 2,
        setupCreditCost: 0,
        setupActionCost: 1,
      }),
    ).toMatchObject({
      protectionState: "protected_not_contestable",
      projectedPayoutExecutions: 3,
      projectedCredits: 6,
      projectedOpportunityCostCredits: 7,
      projectedNetCredits: -1,
    });
  });
});

function corpInput(
  remoteServer: AiDecisionInput["playerView"]["servers"][number],
): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    playerView: {
      own: { credits: 10, clicks: 3, corpFutureFlexibleClicks: [3, 3] },
      opponent: { credits: 10, clicks: 4, rig: [] },
      servers: [remoteServer],
    },
  } as unknown as AiDecisionInput;
}

function remote(
  id: string,
  ice: VisibleCard[],
): AiDecisionInput["playerView"]["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root: [],
  } as AiDecisionInput["playerView"]["servers"][number];
}

function knownRezzedWall(instanceId: string): VisibleCard {
  return {
    instanceId,
    known: true,
    side: "corp",
    type: "ice",
    rezzed: true,
    definitionId: 449,
    strength: 2,
    subtypes: ["wall"],
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: 449,
      effectiveStrength: 2,
      subroutines: [{ id: `${instanceId}:etr`, type: "end_the_run" }],
    },
  } as VisibleCard;
}
