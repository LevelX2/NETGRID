import {
  RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import { expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { RunnerExactFundingRouteRequest } from "../plans/runner-funding-service-contract";
import { runnerExactFundingRouteContract } from "./runner-exact-funding-routes";

it.each([
  [1, "uncovered"],
  [2, "covered_guaranteed"],
] as const)(
  "accounts for funding and Puffer-Draw with %i available Stack cards",
  (stackOrRdCount, status) => {
    const action = (
      actionId: string,
      type: LegalAction["type"],
      source: string,
      payload: LegalAction["payload"] = {},
    ): LegalAction => ({
      actionId,
      type,
      source,
      payload,
      side: "runner",
      label: actionId,
      timingPoint: "runner_action.main",
      expiresAtStateVersion: 9,
      costs: [{ clicks: 1, credits: 0 }],
      targetRequirements: [],
      visibility: "public",
    });
    const fund = action("fund", "play_event", "fund-card");
    const draw = action("draw", "draw_card", "basic_action", {
      runnerDrawProjectionSchemaVersion: RUNNER_DRAW_PROJECTION_SCHEMA_VERSION,
      projectedGrossDrawCount: 1,
      projectedPostDrawDispositionCount: 0,
      projectedNetHandDelta: 1,
      visibleDrawTaxSourceCount: 0,
    });
    const run = action("run", "start_run", "basic_action", { serverId: "rd" });
    const candidate = {
      actionId: fund.actionId,
      actionType: fund.type,
      sourceCardInstanceId: fund.source,
      risks: [],
      functionalEffects: [],
      effectTargets: [],
      costProfile: {
        creditCost: 0,
        clickCost: 1,
        costKnownStatus: "known",
        additionalCosts: [],
      },
      economyProjection: {
        kind: "immediate_liquid",
        timing: "immediate",
        creditRestriction: "general",
        netLiquidCreditGain: 2,
        grossLiquidCreditGain: 2,
        clickCost: 1,
        creditCost: 0,
        netHandDelta: 0,
        cardsConsumed: 1,
        cardsDrawn: 1,
        drawPileCardsConsumed: 1,
        drawPileCardsReplenished: 0,
        netDrawPileDelta: -1,
        reliability: "guaranteed",
        source: "legal_action_payload",
        confidence: "high",
        payoutMode: "fixed",
        evidence: [],
      },
    } as unknown as ActionSemanticCandidate;
    const input = {
      side: "runner",
      legalActions: [fund, draw, run],
      playerView: {
        stateVersion: 9,
        timingPoint: "runner_action.main",
        own: {
          credits: 1,
          clicks: 3,
          maxHandSize: 5,
          stackOrRdCount,
          gripOrHq: [{ instanceId: fund.source }, { instanceId: "other-card" }],
        },
      },
    } as unknown as AiDecisionInput;
    const request = {
      demandId: "card-budget",
      targetCredits: 3,
      remainingClicks: 2,
      purpose: "current_run",
      priority: "direct_run_funding",
      hardness: "hard",
      deadline: "end_of_current_turn",
      sourcePlanId: "p",
      paymentWindowTarget: {
        actionId: run.actionId,
        targetServerId: "rd",
        runActionProjection: { structure: "direct_start_run" },
        prerunReserveQuote: { requiredHandBuffer: 3 },
      },
    } as unknown as RunnerExactFundingRouteRequest;
    const result = runnerExactFundingRouteContract(input, [candidate], request);
    expect(result.routeAssessment.status).toBe(status);
    expect(result.routeActionIds).toEqual(stackOrRdCount === 1 ? [] : ["fund"]);
  },
);
