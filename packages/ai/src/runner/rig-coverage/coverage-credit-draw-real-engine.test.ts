import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import catalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { assessRunnerHandRotation } from "../../runtime/runner-hand-rotation-assessment";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { coverageSupportActionIds } from "./coverage-support";

const SILICON = "onr_v1_179_silicon-saloon-franchise";
beforeEach(() => resetResidentPlanPortfolioMemory());
function fixture(emptyStack = false) {
  const deck = (side: "runner" | "corp") => {
    const id =
      side === "runner"
        ? "standard_runner_last_call_at_rd"
        : "standard_corp_cheap_bag_tricks";
    const d = catalog.decks.find((d) => d.standardDeckId === id)!;
    return {
      id,
      side,
      name: d.name,
      identity: d.identityCardId,
      cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
    };
  };
  const runnerDeck = deck("runner");
  let state = createGameAfterSetup({
    seed: "native-coverage-credit-draw",
    runnerDeck,
    corpDeck: deck("corp"),
    traceRulesProfile: "modern_open",
  });
  const step = (type: string, side: "corp" | "runner") => {
    const action = getLegalActions(state, side).find((a) => a.type === type)!;
    const result = applyAction(state, {
      matchId: state.matchId,
      side,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!result.ok) throw Error(result.error.message);
    state = result.state;
  };
  step("mandatory_draw", "corp");
  RealEngineFixtureBuilder.forState(state)
    .withRunnerGripSize(0)
    .withCorpHqSize(5)
    .withRunnerProgramInstalled("onr_v1_074_worm")
    .withRunnerProgramInstalled("onr_v1_054_raptor")
    .withRunnerResourceInstalled(SILICON)
    .withRezzedCorpIceOnServer("rd", "onr_v1_270_sleeper")
    .withRezzedCorpIceOnServer("hq", "onr_v1_244_filter")
    .withRunnerCredits(10);
  state.runner.memoryUsed = 2;
  if (!emptyStack) {
    RealEngineFixtureBuilder.forState(state)
      .withRunnerCardInGrip("onr_v1_145_wutech-mem-chip")
      .withRunnerCardInGrip("onr_v1_123_bodyweight-data-creche")
      .withRunnerCardInGrip("onr_v1_094_inside-job")
      .withRunnerCardInGrip("onr_v1_095_jack-n-joe")
      .withRunnerCardInGrip("onr_v1_139_r-and-d-interface");
  }
  if (emptyStack) {
    for (const id of state.runner.stack) {
      state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
      state.cardInstances[id]!.faceup = true;
    }
    state.runner.heap.push(...state.runner.stack);
    state.runner.stack = [];
  }
  state.corp.clicks = 0;
  step("end_turn", "corp");
  state.runner.clicks = 3;
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
  return { state, input };
}

it("admits the native one-card plus credit route under the exact Coverage draw need", () => {
  const { state, input } = fixture();
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const hybrid = candidates.find(
    (c) =>
      c.actionType === "activated_card_ability" &&
      c.sourceDefinitionId === SILICON,
  )!;
  expect(
    hybrid,
    JSON.stringify(
      candidates.map((c) => ({
        id: c.actionId,
        type: c.actionType,
        source: c.sourceDefinitionId,
        projection: c.economyProjection,
      })),
    ),
  ).toBeDefined();
  expect(hybrid.economyProjection).toMatchObject({
    cardsDrawn: 1,
    netLiquidCreditGain: 1,
  });
  const support = coverageSupportActionIds(
    input,
    candidates,
    input.ownDeckCapabilities!,
    "breaker_code_gate",
    { handRotation: assessRunnerHandRotation(input, []) },
  );
  expect(support.drawForAnswerActionIds).toContain(hybrid.actionId);
  const before = hashState(state);
  expect(hashState(state)).toBe(before);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: hybrid.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  expect(result.state.runner.credits).toBe(11);
  expect(result.state.runner.grip).toHaveLength(6);
  expect(result.state.runner.clicks).toBe(2);
  const replay = replayEvents(state, [result.event]);
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(result.state));
});

it("does not admit the same credit ability as a Coverage draw route after the stack is empty", () => {
  const { state, input } = fixture(true);
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const hybrid = candidates.find(
    (c) =>
      c.actionType === "activated_card_ability" &&
      c.sourceDefinitionId === SILICON,
  )!;
  expect(input.playerView.own.stackOrRdCount).toBe(0);
  const support = coverageSupportActionIds(
    input,
    candidates,
    input.ownDeckCapabilities!,
    "breaker_code_gate",
    { handRotation: assessRunnerHandRotation(input, []) },
  );
  expect(support.drawForAnswerActionIds).not.toContain(hybrid.actionId);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: hybrid.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  expect(result.state.runner.credits).toBe(11);
  expect(result.state.runner.grip).toHaveLength(0);
});
