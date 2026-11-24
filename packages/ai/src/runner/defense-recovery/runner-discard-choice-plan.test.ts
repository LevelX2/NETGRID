import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { chooseRunnerAction } from "../../index";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import {
  runnerDiscardChoicePlanBinding,
  runnerEmergencyDiscardKeepApplies,
} from "./runner-discard-choice-plan";

afterEach(resetResidentPlanPortfolioMemory);

function applyOffered(
  state: GameState,
  side: Side,
  type: LegalAction["type"],
  selectedChoices?: Record<string, unknown>,
): GameState {
  const offer = getLegalActions(state, side).find(
    (action) => action.type === type,
  )!;
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: offer.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function discardWindow() {
  const runnerDeck = DEMO_DECKS.demo_runner_001;
  let state = createGameAfterSetup({
    seed: "runner-discard-offer",
    runnerDeck,
  });
  state = applyOffered(state, "corp", "mandatory_draw");
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(5);
  state = applyOffered(state, "corp", "end_turn");
  state = applyOffered(state, "runner", "draw_card");
  state = applyOffered(state, "runner", "end_turn");
  const input = buildAiDecisionInput(state, "runner", {
    decisionId: "runner-discard-offer",
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
  return { state, input };
}

describe("runner discard choice plan", () => {
  it("executes the native discard through the bound Runner defense plan", () => {
    const { state, input } = discardWindow();
    const offer = input.legalActions[0]!;
    const choice = input.playerView.pendingChoice!;
    const decision = chooseRunnerAction(input);
    expect(decision.actionId).toBe(offer.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      selectedPlan: {
        moduleId: "runner.defense_and_recovery",
        phase: "discard_window",
      },
      route: { actionId: offer.actionId },
    });
    expect(decision.selectedChoices).toMatchObject({
      choiceId: choice.choiceId,
    });
    const after = applyOffered(
      state,
      "runner",
      "resolve_choice",
      decision.selectedChoices,
    );
    expect(after.runner.grip).toHaveLength(5);
  });

  it.each([
    "timing",
    "expiry",
    "choice-version",
    "missing-option",
    "duplicate-offer",
    "duplicate-card",
  ] as const)("rejects %s before ranking the native discard cards", (kind) => {
    const { input } = discardWindow();
    const action = input.legalActions[0]!;
    const choice = input.playerView.pendingChoice!;
    if (kind === "timing") action.timingPoint = "game.checkpoint";
    if (kind === "expiry") action.expiresAtStateVersion--;
    if (kind === "choice-version") choice.stateVersion--;
    if (kind === "missing-option")
      action.choiceRequirements![0]!.optionIds.pop();
    if (kind === "duplicate-offer") input.legalActions.push({ ...action });
    if (kind === "duplicate-card")
      choice.options[1]!.value = choice.options[0]!.value!;
    const discardKeepScore = vi.fn(() => ({ total: 0 }));
    expect(() =>
      runnerDiscardChoicePlanBinding({
        input,
        candidates: buildActionSemanticCandidates({
          legalActions: input.legalActions,
          stateVersion: input.playerView.stateVersion,
        }),
        discardKeepScore,
      }),
    ).toThrow("missing_plan_module_coverage");
    expect(discardKeepScore).not.toHaveBeenCalled();
  });

  it("protects reviewed flatline prevention only under confirmed danger", () => {
    const arasaka = {
      definitionId: 290,
    };

    expect(runnerEmergencyDiscardKeepApplies("confirmed", arasaka)).toBe(true);
    expect(runnerEmergencyDiscardKeepApplies("critical", arasaka)).toBe(true);
    expect(runnerEmergencyDiscardKeepApplies("suspected", arasaka)).toBe(false);
    expect(runnerEmergencyDiscardKeepApplies("none", arasaka)).toBe(false);
    expect(
      runnerEmergencyDiscardKeepApplies("confirmed", {
        definitionId: 351,
      }),
    ).toBe(false);
  });
});
