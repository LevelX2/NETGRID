import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { assessCorpEconomyAssetPayback } from "./corp-economy-asset-payback";

describe("Corp economy asset payback", () => {
  it("prices an unprotected finite pool only through its immediate payout window", () => {
    expect(
      assessCorpEconomyAssetPayback({
        input: corpInput(remote("remote_1", [])),
        serverId: "remote_1",
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
      unadjustedProjectedCredits: 8,
      projectedCredits: 4,
      projectedOpportunityCostCredits: 3,
      projectedNetCredits: 1,
    });
  });

  it("retains the bounded payout horizon behind a known unreachable path", () => {
    expect(
      assessCorpEconomyAssetPayback({
        input: corpInput(remote("remote_1", [knownRezzedWall("remote-wall")])),
        serverId: "remote_1",
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
      projectedPayoutExecutions: 4,
      projectedCredits: 8,
      projectedOpportunityCostCredits: 5,
      projectedNetCredits: 3,
    });
  });

  it("keeps an already installed finite pool cashable before immediate exposure", () => {
    expect(
      assessCorpEconomyAssetPayback({
        input: corpInput(remote("remote_1", [])),
        serverId: "remote_1",
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
});

function corpInput(
  remoteServer: AiDecisionInput["playerView"]["servers"][number],
): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    playerView: {
      own: { credits: 10, clicks: 3 },
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
    definitionId: "onr_v1_237_data-wall",
    strength: 2,
    subtypes: ["wall"],
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_237_data-wall",
      effectiveStrength: 2,
      subroutines: [{ id: `${instanceId}:etr`, type: "end_the_run" }],
    },
  } as VisibleCard;
}
