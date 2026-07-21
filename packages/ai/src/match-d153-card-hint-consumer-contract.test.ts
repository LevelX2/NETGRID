import { describe, expect, it } from "vitest";

import checkpointJson from "../../../data/scenarios/ai-decision-checkpoints/cp-d153-12-cashout-for-rd-d185.json";
import { buildActionSemanticCandidates } from "./action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "./actions/action-card-semantic-profiles";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { buildDeckCapabilityProfile } from "./deck-capabilities";
import type { AiDecisionCheckpointV1 } from "./evaluation/decision-checkpoints/checkpoint-types";
import { runAiDecisionCheckpoint } from "./evaluation/decision-checkpoints/checkpoint-runner";

const BROKER = "onr_v1_154_broker";
const JUNKYARD = "onr_v1_165_junkyard-bbs";

describe("match D153 card hint consumer contract", () => {
  it("keeps Broker's static hint aligned with its bank semantics", () => {
    const hint = AI_HINTS_BY_CARD.get(BROKER);

    expect(hint).toMatchObject({
      side: "runner",
      cardType: "resource",
      aiSupportStatus: "ai_supported",
      valueHints: { economy: 3 },
      quality: {
        hintReviewed: true,
        needsHumanReview: false,
      },
    });
    expect(hint?.functionSignals).toEqual(
      expect.arrayContaining([
        "economy.action",
        "economy.action_credit",
        "economy.counter",
        "economy.temporary_resource_bank",
      ]),
    );
    expect(hint?.effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "counter_economy",
          amount: 3,
          economyMode: "bank_load",
          resource: "credits",
        }),
        expect.objectContaining({
          kind: "action_economy",
          economyMode: "bank_cashout",
          target: "economy.bank_cashout_all",
        }),
      ]),
    );
  });

  it("binds only the structured Broker actions and selects the payout for R&D funding", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);

    const capabilityProfile = buildDeckCapabilityProfile({
      side: result.input.side,
      playerView: result.input.playerView,
      legalActions: result.input.legalActions,
      deckSnapshot: (structuredClone(checkpointJson) as AiDecisionCheckpointV1)
        .deckSnapshot,
    });
    const broker = capabilityProfile.runner?.economyBankTools.find(
      (tool) => tool.cardId === BROKER,
    );
    const expectedBuildIds = result.input.legalActions
      .filter(
        (action) =>
          action.payload?.cardImplementationAddsHostedCredits === true,
      )
      .map((action) => action.actionId)
      .sort();
    const expectedCashOutIds = result.input.legalActions
      .filter(
        (action) =>
          action.payload?.cardImplementationTakesHostedCredits === true,
      )
      .map((action) => action.actionId)
      .sort();

    expect(broker).toMatchObject({
      currentBankAmount: 12,
      currentBankAmounts: [12],
      portfolioStoredAmount: 12,
      estimatedPayout: 12,
      buildActionIds: expectedBuildIds,
      cashOutActionIds: expectedCashOutIds,
    });
    expect(broker && "maxKnownCapacity" in broker).toBe(false);
    expect(
      capabilityProfile.runner?.economyBankTools.some(
        (tool) => tool.cardId === JUNKYARD,
      ),
    ).toBe(false);
    expect(result.decision?.actionId).toBe(expectedCashOutIds[0]);
    expect(result.decision?.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_bank_cashout_gate",
          value: 1100,
        }),
      ]),
    );

    const visibleCards = [
      ...result.input.playerView.own.gripOrHq,
      ...(result.input.playerView.own.rig ?? []),
      ...result.input.playerView.own.heapOrArchives,
      ...result.input.playerView.own.scoreArea,
      ...result.input.playerView.servers.flatMap((server) => [
        ...server.ice,
        ...server.root,
      ]),
    ];
    const candidates = buildActionSemanticCandidates({
      legalActions: result.input.legalActions,
      observerSide: result.input.side,
      stateVersion: result.input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: Object.fromEntries(
        visibleCards.flatMap((card) =>
          card.definitionId ? [[card.instanceId, card.definitionId]] : [],
        ),
      ),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const selectedCandidate = candidates.find(
      (candidate) => candidate.actionId === result.decision?.actionId,
    );
    expect(selectedCandidate).toMatchObject({
      sourceDefinitionId: BROKER,
      effectTargets: expect.arrayContaining([
        "economy.action_credit",
        "economy.temporary_resource_bank",
      ]),
      actionTacticSignals: expect.arrayContaining([
        "effect:action_economy",
        "effect:counter_economy",
      ]),
    });
  });
});
