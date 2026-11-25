import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type DeckDefinition,
  type LegalAction,
  type Side,
} from "@netgrid/shared";
import { beforeEach, expect, it } from "vitest";

import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";

const krash = 251;
const priorityWreck = 317;
const wallOfStatic = 491;
const dataWall = 449;

const runnerDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_runner_001,
  id: "denial-window-runner",
  cards: [
    ...DEMO_DECKS.demo_runner_001.cards,
    { id: krash, quantity: 1 },
    { id: priorityWreck, quantity: 1 },
  ],
};
const corpDeck: DeckDefinition = {
  ...DEMO_DECKS.demo_corp_001,
  id: "denial-window-corp",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    { id: wallOfStatic, quantity: 1 },
    { id: dataWall, quantity: 1 },
  ],
};

beforeEach(resetResidentPlanPortfolioMemory);

it.each([
  { source: "replacement", secondIce: true, expected: "continue_run" },
  { source: "replacement", secondIce: false, expected: "pump_breaker" },
  { source: "ordinary", secondIce: true, expected: "break_subroutine" },
] as const)(
  "prices the complete $source route after the current rez (second ICE: $secondIce)",
  ({ source, secondIce, expected }) => {
    let state = createGameAfterSetup({
      seed: `exact-denial-window-${source}-${secondIce}`,
      traceRulesProfile: "modern_open",
      runnerDeck,
      corpDeck,
    });

    function act(
      side: Side,
      type: LegalAction["type"],
      matches: (action: LegalAction) => boolean = () => true,
    ) {
      const action = getLegalActions(state, side).find(
        (candidate) => candidate.type === type && matches(candidate),
      );
      if (!action)
        throw new Error(`Missing legal ${type} in ${state.timingPoint}`);
      const result = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
      });
      if (!result.ok) throw new Error(result.error.message);
      state = result.state;
    }

    act("corp", "mandatory_draw");
    RealEngineFixtureBuilder.forState(state).withCorpHqSize(5);
    act("corp", "end_turn");
    const fixture = RealEngineFixtureBuilder.forState(state)
      .withRunnerCardInGrip(priorityWreck)
      .withRunnerProgramInstalled(krash)
      .withRunnerCredits(13)
      .withRunnerClicks(1)
      .withCorpCredits(22)
      .withRezzedCorpIceOnServer("hq", wallOfStatic);
    state.runner.memoryUsed = 1;
    if (secondIce) fixture.withCorpIceOnServer("hq", dataWall);
    if (source === "replacement") {
      act(
        "runner",
        "play_event",
        (action) =>
          state.cardInstances[action.source ?? ""]?.definitionId ===
          priorityWreck,
      );
    } else {
      act("runner", "start_run", (action) => action.payload?.serverId === "hq");
    }
    if (secondIce) act("corp", "rez_ice");
    expect(state.run?.phase).toBe("encounter_ice");
    expect(state.run?.attackedServerId).toBe("hq");
    expect(state.runner.clicks).toBe(0);

    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      ownDeckSnapshot: {
        deckSnapshotId: runnerDeck.id,
        side: "runner",
        cards: runnerDeck.cards.map(({ id, quantity }) => ({
          cardId: id,
          quantity,
        })),
      },
    });
    expect(input.playerView.run?.successfulRunSpendCreditsToDeny).toBe(
      source === "replacement" ? true : undefined,
    );
    expect(
      getPlayerView(state, "corp").run?.successfulRunSpendCreditsToDeny,
    ).toBeUndefined();
    const before = hashState(state);
    const decision = chooseAiAction(input);
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === decision.actionId,
    );
    expect(action).toMatchObject({
      type: expected,
      side: "runner",
      expiresAtStateVersion: state.stateVersion,
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      moduleId: "runner.convert_run_window",
    });
    expect(decision.fallbackUsed).toBeFalsy();
    expect(hashState(state)).toBe(before);

    if (expected === "continue_run") {
      expect(action?.payload).toMatchObject({
        encounterContinue: true,
        encounterWillEndRun: true,
        encounterFullBreakDamage: 0,
      });
      act(
        "runner",
        "continue_run",
        (candidate) => candidate.actionId === decision.actionId,
      );
      expect(state.run).toBeUndefined();
      expect(state.runner.credits).toBe(13);
      expect(state.winner).toBeNull();
    }
  },
);
