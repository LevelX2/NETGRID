import { describe, expect, it } from "vitest";

import checkpointJson from "../../../data/scenarios/ai-decision-checkpoints/cp-d153-12-cashout-for-rd-d185.json";
import { buildActionSemanticCandidates } from "./action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "./actions/action-card-semantic-profiles";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { buildDeckCapabilityProfile } from "./deck-capabilities";
import { bindHistoricalRunEventCadence } from "./evaluation/decision-checkpoints/checkpoint-cadence-fixture.test-support";
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

  it("binds every visible Broker instance before selecting its matching payout", () => {
    const checkpoint = bindHistoricalRunEventCadence(
      structuredClone(checkpointJson) as AiDecisionCheckpointV1,
    );
    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);

    const capabilityProfile = buildDeckCapabilityProfile({
      side: result.input.side,
      playerView: result.input.playerView,
      legalActions: result.input.legalActions,
      deckSnapshot: checkpoint.deckSnapshot,
    });
    const brokers = (capabilityProfile.runner?.economyBankTools ?? [])
      .filter((tool) => tool.cardId === BROKER)
      .sort((left, right) =>
        (left.sourceCardInstanceId ?? "").localeCompare(
          right.sourceCardInstanceId ?? "",
        ),
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

    expect(brokers).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: "runner_onr_v1_154_broker_1",
        buildActionIds: [
          "runner.activated_card_ability.runner_onr_v1_154_broker_1.runner_onr_v1_154_broker_1.activated.onr_v1_154_broker:store_credits",
        ],
        cashOutActionIds: [],
      }),
      expect.objectContaining({
        sourceCardInstanceId: "runner_onr_v1_154_broker_2",
        currentBankAmount: 12,
        currentBankAmounts: [12],
        portfolioStoredAmount: 12,
        estimatedPayout: 12,
        buildActionIds: [
          "runner.activated_card_ability.runner_onr_v1_154_broker_2.runner_onr_v1_154_broker_2.activated.onr_v1_154_broker:store_credits",
        ],
        cashOutActionIds: [
          "runner.activated_card_ability.runner_onr_v1_154_broker_2.runner_onr_v1_154_broker_2.activated.onr_v1_154_broker:withdraw_credits",
        ],
      }),
    ]);
    expect(brokers.flatMap((tool) => tool.buildActionIds).sort()).toEqual(
      expectedBuildIds,
    );
    expect(brokers.flatMap((tool) => tool.cashOutActionIds).sort()).toEqual(
      expectedCashOutIds,
    );
    expect(brokers.every((tool) => !("maxKnownCapacity" in tool))).toBe(true);
    expect(
      capabilityProfile.runner?.economyBankTools.some(
        (tool) => tool.cardId === JUNKYARD,
      ),
    ).toBe(false);
    expect(result.decision?.actionId).toBe(
      "runner.activated_card_ability.runner_onr_v1_154_broker_2.runner_onr_v1_154_broker_2.activated.onr_v1_154_broker:withdraw_credits",
    );
    expect(result.decision?.fallbackUsed).toBe(false);
    expect(result.decision?.decisionDebug?.planKind).toBe("runner.credit_bank");
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:credit_bank_cash_out",
        "plan_assessment_evidence:runner_credit_bank_cashout_for_click_efficient_liquidity",
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
    const cashOutCandidate = candidates.find(
      (candidate) => candidate.actionId === expectedCashOutIds[0],
    );
    expect(cashOutCandidate).toMatchObject({
      sourceDefinitionId: BROKER,
      effectTargets: expect.arrayContaining([
        "economy.bank_load",
        "economy.bank_cashout_all",
      ]),
      actionTacticSignals: expect.arrayContaining([
        "effect:action_economy",
        "economy.hosted_credit_cashout",
      ]),
    });
  });
});
