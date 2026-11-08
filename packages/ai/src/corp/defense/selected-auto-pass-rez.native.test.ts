import { runAiDecisionCheckpoint } from "../../evaluation/decision-checkpoints/checkpoint-runner";
import {
  simulationEngineRuntimeOptions,
  applySimulationEngineSelection,
} from "../../simulation/engine-selection";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayGameEvents,
  quoteRandomizedTraceBidSelection,
  applyRandomizedTraceBidSelection,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type DeckDefinition,
  type GameState,
  type Side,
} from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";

const ICE = "onr_v1_261_quandary";
const SOCIAL = "onr_v1_111_social-engineering";
const corpDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_001,
  id: "bypass-rez-corp",
  cards: [...DEMO_DECKS.demo_corp_001.cards, { id: ICE, quantity: 1 }],
};
const runnerDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_runner_001,
  id: "bypass-rez-runner",
  cards: [...DEMO_DECKS.demo_runner_001.cards, { id: SOCIAL, quantity: 1 }],
};

function scenario(
  bypass: boolean | "guess",
  seed = "manual-social-rez",
  hiddenAmount = 2,
  credits = 8,
) {
  let state = createGameAfterSetup({
    seed,
    corpDeck,
    runnerDeck,
  });
  RealEngineFixtureBuilder.forState(state)
    .withCorpIceOnServer("hq", ICE)
    .withCorpCredits(10)
    .withRunnerCredits(credits)
    .withRunnerClicks(4)
    .withRunnerCardInGrip(SOCIAL);
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.turnSerial = 1;
  state.corp.clicks = 0;
  const initial = structuredClone(state);
  const iceId = state.corp.servers.find((s) => s.id === "hq")!.ice[0]!;
  const apply = (side: Side, actionId: string, optionId?: string) => {
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(optionId
        ? {
            selectedChoices: {
              choiceId: state.pendingChoice!.choiceId,
              selectedOptionIds: [optionId],
            },
          }
        : {}),
    });
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  };
  if (bypass) {
    const event = getLegalActions(state, "runner").find(
      (a) =>
        a.type === "play_event" &&
        state.cardInstances[a.source]?.definitionId === SOCIAL,
    )!;
    apply("runner", event.actionId);
    apply("runner", "runner.resolve_choice", "hide_" + hiddenAmount);
    if (bypass === "guess")
      return { initial, state: () => state, apply, iceId };
    expect(getPlayerView(state, "corp")).not.toHaveProperty(
      "secretSpendGuessRunSecret",
    );
    apply("corp", "corp.resolve_choice", "guess_3");
    const target = state.pendingChoice!.options.find(
      (o) => o.value === "hq|" + iceId,
    )!;
    apply("runner", "runner.resolve_choice", target.id);
  } else {
    apply("runner", "runner.start_run.hq");
  }
  return { initial, state: () => state, apply, iceId };
}
function input(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    decisionId: "bypass-rez:" + state.stateVersion,
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: corpDeck.id,
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
beforeEach(() => resetResidentPlanPortfolioMemory());
describe("public selected auto-pass and Corp rez", () => {
  it("preserves the chosen public ICE through Engine view and AI DTO, declines its encounter cost and replays", () => {
    const s = scenario(true);
    const before = hashState(s.state());
    expect(getPlayerView(s.state(), "corp").run?.pendingAutoPassIceId).toBe(
      s.iceId,
    );
    const actorInput = input(s.state());
    expect(actorInput.playerView.run?.pendingAutoPassIceId).toBe(s.iceId);
    expect(actorInput.playerView.opponent).not.toHaveProperty("gripOrHq");
    const decision = chooseAiAction(actorInput);
    if (decision.selectionKind !== "direct")
      throw new Error("Expected the bound direct rez-window action");
    expect(decision.actionId).toBe("corp.decline_rez");
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toContain("corp.defend_servers");
    expect(hashState(s.state())).toBe(before);
    s.apply("corp", decision.actionId);
    s.apply("runner", "runner.continue_run");
    expect(s.state().corp.credits).toBe(10);
    const replay = replayGameEvents(
      s.initial,
      s.state().eventLog.slice(s.initial.eventLog.length),
    );
    expect(replay.errors).toEqual([]);
    expect(hashState(replay.state)).toBe(hashState(s.state()));
  });
  it("still rezzes the same stopping ICE during an ordinary run", () => {
    const s = scenario(false);
    expect(
      getPlayerView(s.state(), "corp").run?.pendingAutoPassIceId,
    ).toBeUndefined();
    const decision = chooseAiAction(input(s.state()));
    expect(decision.actionId).toContain("corp.rez_ice");
    expect(decision.fallbackUsed).toBe(false);
  });
  it("mixes legal secret guesses through the replayable AI RNG domain", () => {
    const selected = new Set<number>();
    for (let seed = 0; seed < 12; seed++) {
      resetResidentPlanPortfolioMemory();
      const s = scenario("guess", "manual-guess-" + seed);
      const before = hashState(s.state());
      const counter = s.state().randomCounter;
      const decision = chooseAiAction(
        input(s.state()),
        simulationEngineRuntimeOptions(s.state()),
      );
      if (decision.selectionKind !== "engine_randomized_trace_bid_selection")
        throw new Error("Expected atomic secret guess");
      expect(decision.engineCommand.quote.assessment).toMatchObject({
        kind: "secret_guess",
        policy: "uniform_access_denial_v1",
      });
      expect(decision.engineCommand.quote.candidates).toHaveLength(6);
      expect(hashState(s.state())).toBe(before);
      const result = applySimulationEngineSelection(
        s.state(),
        decision,
        "native-relay-" + seed,
      );
      if (!result)
        throw new Error("Missing simulation Engine selection result");
      if (!result.ok) throw new Error(result.error.message);
      if (!("bid" in result.receipt.selectedCandidate))
        throw new Error("Expected the actual guess receipt");
      selected.add(result.receipt.selectedCandidate.bid);
      expect(result.receipt.randomDraw).toMatchObject({
        domain: "ai_turn_plan_selection",
        counter: 0,
      });
      expect(result.state.randomCounter).toBe(counter);
      expect(result.state.aiTurnPlanRandomCounter).toBe(1);
      const replay = replayGameEvents(
        s.initial,
        result.state.eventLog.slice(s.initial.eventLog.length),
      );
      expect(replay.errors).toEqual([]);
      expect(hashState(replay.state)).toBe(hashState(result.state));
    }
    expect(selected.size).toBeGreaterThan(1);
  });
  it("keeps the guess independent of the opponent's hidden amount", () => {
    const bids: number[] = [];
    for (const hidden of [2, 3]) {
      resetResidentPlanPortfolioMemory();
      const s = scenario("guess", "hidden-twin-guess", hidden);
      const decision = chooseAiAction(input(s.state()), {
        quoteRandomizedTraceBidSelection: (request) =>
          quoteRandomizedTraceBidSelection(s.state(), request),
      });
      if (decision.selectionKind !== "engine_randomized_trace_bid_selection")
        throw new Error("Expected atomic guess");
      const applied = applyRandomizedTraceBidSelection(
        s.state(),
        decision.engineCommand,
      );
      if (!applied.ok) throw new Error(applied.error.message);
      bids.push(applied.receipt.selectedCandidate.bid);
    }
    expect(bids[0]).toBe(bids[1]);
  });
  it("rejects a forged candidate distribution before consuming randomness", () => {
    const s = scenario("guess");
    const before = hashState(s.state());
    const decision = chooseAiAction(input(s.state()), {
      quoteRandomizedTraceBidSelection: (request) =>
        quoteRandomizedTraceBidSelection(s.state(), request),
    });
    if (decision.selectionKind !== "engine_randomized_trace_bid_selection")
      throw new Error("Expected atomic guess");
    const command = structuredClone(decision.engineCommand);
    command.quote.candidates[0]!.weight = 2;
    const result = applyRandomizedTraceBidSelection(s.state(), command);
    expect(result.ok).toBe(false);
    expect(hashState(result.state)).toBe(before);
  });
  it("fails closed without an Engine selection provider and needs no draw for a sole legal guess", () => {
    const s = scenario("guess");
    expect(() => chooseAiAction(input(s.state()))).toThrow(
      "invalid_support_graph",
    );
    resetResidentPlanPortfolioMemory();
    const sole = scenario("guess", "sole-guess", 2, 3);
    const decision = chooseAiAction(input(sole.state()));
    expect(decision.selectionKind).toBe("direct");
    expect(decision.selectedChoices).toMatchObject({
      selectedOptionIds: ["guess_2"],
    });
    expect(sole.state().aiTurnPlanRandomCounter).toBe(0);
  });
  it("resolves the actual Engine choice in the checkpoint harness", () => {
    const s = scenario("guess");
    const state = s.state();
    const actor = input(state);
    const before = hashState(state);
    const result = runAiDecisionCheckpoint({
      schemaVersion: "ai-decision-checkpoint-v1",
      checkpointId: "manual-secret-guess-component",
      source: {
        kind: "synthetic_companion",
        findingId: "manual-secret-guess",
        capturedAt: "2026-11-08T00:00:00.000Z",
        matchId: state.matchId,
        stateVersion: state.stateVersion,
      },
      compatibility: {
        engineSchemaVersion: state.baseline.engineSchemaVersion,
        aiRuntimeCheckpointVersion: "ai-runtime-checkpoint-v1",
      },
      actor: "corp",
      difficulty: "hard",
      profileId: "corp-ai-v0.9-hard",
      deckSnapshot: actor.ownDeckSnapshot!,
      engine: {
        stateVersion: state.stateVersion,
        stateHash: before,
        testOnlyGameState: state,
        eventPrefix: actor.eventTail,
      },
      runtime: { schemaVersion: "ai-runtime-checkpoint-v1" },
      expectation: { acceptableActions: [{ type: "resolve_choice" }] },
    });
    expect(result.ok, result.message).toBe(true);
    expect(result.decision?.actionId).toBe("corp.resolve_choice");
    expect(result.decision?.selectedChoices?.selectedOptionIds).toHaveLength(1);
    expect(hashState(state)).toBe(before);
  });
});
