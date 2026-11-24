import { planInstanceIdForProposal } from "../../plans/plan-instance";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  replayGameEvents,
} from "@netgrid/engine";
import type { DeckDefinition, GameState, LegalAction } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import catalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { observeRandomizedRunnerRunStart } from "../../runtime/turn-plan-observation";
import {
  applySimulationEngineSelection,
  simulationEngineRuntimeOptions,
} from "../../simulation/engine-selection";

function standardDeck(
  side: DeckDefinition["side"],
  id: string,
): DeckDefinition {
  const deck = catalog.decks.find((entry) => entry.standardDeckId === id);
  if (!deck) throw new Error("Missing standard deck " + id);
  return {
    id,
    side,
    name: deck.name,
    identity: deck.identityCardId,
    cards: deck.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
}

const runnerDeck = standardDeck(
  "runner",
  "standard_runner_inside_forgery_loop",
);
const corpDeck = standardDeck("corp", "standard_corp_mp1ddh7c");

function apply(state: GameState, action: LegalAction) {
  const applied = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!applied.ok) throw new Error(applied.error.message);
  return applied;
}

function fixture(seed: string): GameState {
  let state = createGameAfterSetup({
    seed,
    runnerDeck,
    corpDeck,
    agendaPointsToWin: 7,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find(
      (entry) => entry.type === "mandatory_draw",
    )!,
  ).state;
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(4);
  state = apply(
    state,
    getLegalActions(state, "corp").find((entry) => entry.type === "end_turn")!,
  ).state;

  const builder = RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withRunnerCredits(16)
    .withRunnerClicks(1);
  // The two open routes each offer a single unknown access near matchpoint.
  for (const id of [
    424,
    413,
    426,
  ]) {
    builder.withCorpCardInHq(id);
    const instanceId = state.corp.hq.pop()!;
    state.runner.scoreArea.push(instanceId);
    state.cardInstances[instanceId] = {
      ...state.cardInstances[instanceId]!,
      zone: { side: "runner", zone: "scoreArea" },
      controller: "runner",
      faceup: true,
      rezzed: true,
    };
  }
  return state;
}

function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map((card) => ({
        cardId: card.id,
        quantity: card.quantity,
      })),
    },
  });
}

function variedAccess(state: GameState) {
  resetResidentPlanPortfolioMemory();
  const decision = chooseAiAction(inputFor(state), {
    ...simulationEngineRuntimeOptions(state),
    runnerCentralAccessVariation: true,
  });
  if (decision.selectionKind !== "engine_randomized_turn_plan_selection")
    throw new Error("Expected both certified approaches.");
  expect(
    decision.engineCommand.quote.candidates.map((candidate) => [
      candidate.actionId,
      candidate.weight,
    ]),
  ).toEqual([
    ["rs.hq", 1],
    ["rs.rd", 1],
  ]);

  const result = applySimulationEngineSelection(
    state,
    decision,
    "runner-central-pilot",
  );
  if (!result?.ok || !("opportunityKey" in result.receipt))
    throw new Error("Expected the Engine's certified TurnPlan receipt.");
  return result;
}

afterEach(resetResidentPlanPortfolioMemory);

it("varies equal access lines across paired seeds and binds the actual run owner", () => {
  const chosen = new Set<string>();
  const seeds = Array.from({ length: 8 }, (_, index) => "pilot-" + index);
  for (const seed of seeds) {
    const state = fixture(seed);
    resetResidentPlanPortfolioMemory();
    const fixed = chooseAiAction(
      inputFor(state),
      simulationEngineRuntimeOptions(state),
    );
    expect(fixed).toMatchObject({
      selectionKind: "direct",
      actionId: "rs.hq",
    });

    const result = variedAccess(state);
    const action = result.receipt.selectedLegalAction;
    const serverId = action.payload!.serverId as "hq" | "rd";
    chosen.add(serverId);
    expect(result.state.run?.attackedServerId).toBe(serverId);
    expect(result.receipt.randomDraw).toMatchObject({
      domain: "ai_turn_plan_selection",
      counter: 0,
    });
    expect(result.state.aiTurnPlanRandomCounter).toBe(1);

    const sameRunWithoutSelection = apply(state, action);
    expect(result.state.randomCounter).toBe(
      sameRunWithoutSelection.state.randomCounter,
    );
    expect(replayGameEvents(state, [result.event])).toMatchObject({
      ok: true,
      actualFinalStateHash: result.stateHash,
    });
    const next = inputFor(result.state);
    expect(next.observedRandomizedRunnerRunStart).toMatchObject({
      actionId: action.actionId,
      stateVersionBefore: state.stateVersion,
      stateVersionAfter: result.state.stateVersion,
    });
    expect(
      observeRandomizedRunnerRunStart(result.state, "corp"),
    ).toBeUndefined();
    expect(
      chooseAiAction(next, {
        ...simulationEngineRuntimeOptions(result.state),
        runnerCentralAccessVariation: true,
      }),
    ).toMatchObject({
      selectionKind: "direct",
      actionId: "r0",
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            planInstanceIdForProposal({ moduleId: "runner.pressure_central", dedupeKey: `central:${serverId}` }),
          selectedPlan: { moduleId: "runner.convert_run_window" },
        },
      },
    });
  }
  expect(chosen).toEqual(new Set(["hq", "rd"]));
});

it("reproduces the selected line, RNG draw and state hash for the same seed", () => {
  const state = fixture("pilot-1");
  const first = variedAccess(state);
  const second = variedAccess(state);
  expect(second.receipt).toEqual(first.receipt);
  expect(second.stateHash).toBe(first.stateHash);
});

it("chooses the clearly safer R&D route directly when HQ has ICE", () => {
  const state = fixture("pilot-blocked-hq");
  RealEngineFixtureBuilder.forState(state).withRezzedCorpIceOnServer(
    "hq",
    457,
  );
  const decision = chooseAiAction(inputFor(state), {
    ...simulationEngineRuntimeOptions(state),
    runnerCentralAccessVariation: true,
  });
  expect(decision).toMatchObject({
    selectionKind: "direct",
    actionId: "rs.rd",
  });
  expect(state.aiTurnPlanRandomCounter ?? 0).toBe(0);
});

it("requires the Engine quote for a qualified opt-in choice", () => {
  const state = fixture("pilot-no-provider");
  expect(() =>
    chooseAiAction(inputFor(state), {
      runnerCentralAccessVariation: true,
    }),
  ).toThrow("invalid_support_graph");
});
