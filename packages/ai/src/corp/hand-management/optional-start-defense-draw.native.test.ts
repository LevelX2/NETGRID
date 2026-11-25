import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
} from "@netgrid/engine";
import { ORIGINALSET_DEFAULT_DECKS, type GameState } from "@netgrid/shared";
import { beforeEach, expect, it } from "vitest";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { corpOptionalStartDrawTakenInEventTailThisTurn } from "../../runtime/corp-economy/corp-defensive-draw";
import { removeEverywhere } from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";

const corpCards = [
  { id: 411, quantity: 1 },
  { id: 417, quantity: 1 },
  { id: 5, quantity: 3 },
  { id: 21, quantity: 2 },
  { id: 22, quantity: 2 },
  { id: 567, quantity: 2 },
  { id: 570, quantity: 2 },
  { id: 450, quantity: 2 },
  { id: 99, quantity: 2 },
  { id: 492, quantity: 2 },
];
const runnerCards = [
  { id: 141, quantity: 2 },
  { id: 351, quantity: 2 },
  { id: 320, quantity: 8 },
];
const runnerDeck = { ...ORIGINALSET_DEFAULT_DECKS.runner, cards: runnerCards };
const corpDeck = { ...ORIGINALSET_DEFAULT_DECKS.corp, cards: corpCards };

function decisionInput(state: GameState) {
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      side: "corp",
      deckSnapshotId: corpDeck.id,
      cards: corpCards.map(({ id: cardId, quantity }) => ({
        cardId,
        quantity,
      })),
    },
  });
  return { ...input, ...buildAiDecisionInputDto(input) };
}

function fixture(variant: "open" | "ice_in_hq" | "stopped_rnd") {
  let state = createGameAfterSetup({
    seed: "optional-start-central-defense",
    traceRulesProfile: "modern_open",
    runnerDeck,
    corpDeck,
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = 0;

  for (const [definitionId, side] of [
    [411, "corp"],
    [417, "runner"],
    [5, "runner"],
  ] as const) {
    const card = Object.values(state.cardInstances).find(
      (instance) => instance.definitionId === definitionId,
    )!;
    removeEverywhere(state, card.instanceId);
    card.zone = { side, zone: "scoreArea" };
    card.faceup = true;
    state[side].scoreArea.push(card.instanceId);
  }
  const fixture = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(567)
    .withCorpCardInHq(570)
    .withCorpCardInHq(variant === "ice_in_hq" ? 492 : 22)
    .withCorpCredits(16)
    .withRunnerCredits(9)
    .withRunnerProgramInstalled(141)
    .withRezzedCorpIceOnServer("rd", 450)
    .withCorpIceOnServer("rd", 99);
  if (variant === "stopped_rnd") fixture.withRezzedCorpIceOnServer("rd", 492);

  const start = getLegalActions(state, "runner").find(
    (action) => action.type === "end_turn",
  )!;
  const transition = applyAction(state, {
    side: "runner",
    matchId: state.matchId,
    actionId: start.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!transition.ok) throw new Error(transition.error.message);
  state = transition.state;
  return state;
}

beforeEach(resetResidentPlanPortfolioMemory);

it.each([
  ["open", "draw"],
  ["ice_in_hq", "skip"],
  ["stopped_rnd", "skip"],
] as const)(
  "%s central draw need chooses %s in the Hand window",
  (variant, expected) => {
    const state = fixture(variant);
    const input = decisionInput(state);
    const action = input.legalActions.find(
      (candidate) => candidate.type === "resolve_choice",
    )!;
    const choice = input.playerView.pendingChoice!;
    const before = hashState(state);

    expect(choice.corpStartDrawQuote).toMatchObject({
      observedAtStateVersion: state.stateVersion,
      additionalDrawCount: 1,
      committedDrawCount: 1,
      mandatoryDrawCount: 1,
    });
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(action.actionId);
    expect(decision.selectedChoices).toEqual({
      choiceId: choice.choiceId,
      selectedOptionIds: [expected],
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      moduleId: "corp.hand_and_agenda_management",
      phase: "optional_start_draw_window",
    });
    expect(decision.fallbackUsed).toBe(false);
    expect(hashState(state)).toBe(before);

    if (expected !== "draw") return;
    const selectedChoices = decision.selectedChoices;
    if (!selectedChoices) throw new Error("Missing bound draw choice");
    const selected = applyAction(state, {
      side: "corp",
      matchId: state.matchId,
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices,
    });
    if (!selected.ok) throw new Error(selected.error.message);
    const draw = getLegalActions(selected.state, "corp").find(
      (candidate) => candidate.type === "mandatory_draw",
    )!;
    const result = applyAction(selected.state, {
      side: "corp",
      matchId: state.matchId,
      actionId: draw.actionId,
      clientKnownStateVersion: selected.state.stateVersion,
    });
    if (!result.ok) throw new Error(result.error.message);
    expect(result.state.corp.clicks).toBe(3);
    expect(result.state.corp.hq).toHaveLength(5);
    expect(
      corpOptionalStartDrawTakenInEventTailThisTurn(
        decisionInput(result.state),
      ),
    ).toBe(true);
  },
);
