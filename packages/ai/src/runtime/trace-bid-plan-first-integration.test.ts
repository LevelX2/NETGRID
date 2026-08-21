import {
  applyRandomizedTraceBidSelection,
  createGame,
  getLegalActions,
  quoteRandomizedTraceBidSelection,
} from "@netgrid/engine";
import type { CardDefinitionId, GameState } from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";

import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";

describe("Plan-first Blind Trace bid integration", () => {
  beforeEach(() => resetResidentPlanPortfolioMemory());

  it("completes only the already-bound resolve_choice through one Engine-randomized command", () => {
    const state = blindCorpTraceState();
    const resolveChoice = getLegalActions(state, "corp").find(
      (action) => action.type === "resolve_choice",
    );
    if (!resolveChoice || !state.pendingChoice) {
      throw new Error("Expected bound Trace resolve_choice.");
    }
    const input = buildAiDecisionInput(state, "corp", {
      ownDeckSnapshot: deckSnapshot(state),
      decisionId: "plan-first-blind-trace",
      profileId: "plan-first-blind-trace",
    });
    const decision = chooseAiAction(input, {
      persistTacticalPlanMemory: false,
      quoteRandomizedTraceBidSelection: (request) =>
        quoteRandomizedTraceBidSelection(state, request),
    });

    expect(decision.selectionKind).toBe(
      "engine_randomized_trace_bid_selection",
    );
    if (decision.selectionKind !== "engine_randomized_trace_bid_selection")
      return;
    expect(decision.engineCommand.quote).toMatchObject({
      actionId: resolveChoice.actionId,
      choiceId: state.pendingChoice.choiceId,
      side: "corp",
      assessment: {
        traceId: state.trace?.traceId,
        traceRulesProfile: "classic_blind",
      },
    });
    expect(decision.engineCommand.quote.planStepId.length).toBeGreaterThan(0);
    expect(
      decision.engineCommand.quote.candidates.every((candidate) =>
        state.pendingChoice?.options.some(
          (option) =>
            option.id === candidate.optionId && option.value === candidate.bid,
        ),
      ),
    ).toBe(true);

    const applied = applyRandomizedTraceBidSelection(state, {
      ...decision.engineCommand,
      idempotencyKey: "plan-first-blind-trace:apply",
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.receipt.selectedLegalAction.actionId).toBe(
      resolveChoice.actionId,
    );
    expect(applied.receipt.planStepId).toBe(
      decision.engineCommand.quote.planStepId,
    );
    expect(applied.state.trace?.status).toBe("runner_bid");
  });
});

function blindCorpTraceState(): GameState {
  const state = createGame({
    seed: "plan-first-blind-trace",
    setupMode: "completed",
    traceRulesProfile: "classic_blind",
  });
  const sourceCardInstanceId = state.corp.identity;
  const sourceDefinitionId = state.cardInstances[sourceCardInstanceId]
    ?.definitionId as CardDefinitionId | undefined;
  if (!sourceDefinitionId) throw new Error("Corp identity source missing.");
  state.activeSide = "corp";
  state.corp.credits = 5;
  state.trace = {
    traceId: "trace_plan_first_1",
    sourceCardInstanceId,
    sourceDefinitionId,
    traceRulesProfile: "classic_blind",
    traceLimit: 3,
    effectiveTraceLimit: 3,
    corpBidMax: 3,
    status: "corp_bid",
    bidsRevealed: false,
    successEffect: { type: "add_tag", amount: 1 },
  };
  state.pendingChoice = {
    choiceId: `trace_plan_first_1.corp.bid.${state.stateVersion}`,
    side: "corp",
    source: "trace:trace_plan_first_1",
    prompt: "Verdecktes Korp-Gebot wählen",
    kind: "bid_amount",
    options: Array.from({ length: 4 }, (_, bid) => ({
      id: `bid_${bid}`,
      label: `${bid} Credits`,
      publicLabel: "Gebot festlegen",
      value: bid,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "hidden_info_barrier",
  };
  return state;
}

function deckSnapshot(state: GameState): AiDeckStrategyDeckSnapshot {
  const counts = new Map<string, number>();
  for (const instanceId of [
    ...state.corp.hq,
    ...state.corp.rd,
    ...state.corp.archives,
  ]) {
    const definitionId = state.cardInstances[instanceId]?.definitionId;
    if (!definitionId) continue;
    counts.set(definitionId, (counts.get(definitionId) ?? 0) + 1);
  }
  return {
    deckSnapshotId: "plan-first-blind-trace-deck",
    side: "corp",
    cards: [...counts].map(([cardId, quantity]) => ({ cardId, quantity })),
  };
}
