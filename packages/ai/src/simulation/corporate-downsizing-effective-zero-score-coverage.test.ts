import { describe, expect, it } from "vitest";
import { ORIGINALSET_DEFAULT_DECKS } from "@netgrid/shared";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";

import {
  putCorpRootInRemote,
  scoreCorpAgendaForTest,
} from "../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import {
  listMatchProgressionBenchmarkDeckSlots,
  simulateAiGame,
} from "../simulation";
import { resolveBenchmarkDeckSlot } from "./benchmark-deck-slot-resolver";

const SLOT_ID = "strategy_panel_fast_advance_chrome_rush";
const SEED = "ai-behavior-baseline-v1-03";
const CORPORATE_DOWNSIZING = 406;
const EXECUTIVE_EXTRACTION = 413;
const WASHINGTON_GRID = 586;

describe("Corporate Downsizing effective-zero score coverage", () => {
  it("keeps the originating baseline seed on a clean terminal plan-first path", () => {
    const slot = listMatchProgressionBenchmarkDeckSlots().find(
      (candidate) => candidate.slotId === SLOT_ID,
    );
    if (!slot) throw new Error(`Missing benchmark slot ${SLOT_ID}`);
    const resolved = resolveBenchmarkDeckSlot(slot);
    if (!resolved.ok) throw new Error(resolved.reason);

    const summary = simulateAiGame({
      seed: SEED,
      maxActions: 700,
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      ...resolved.config,
    });

    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.replayOk).toBe(true);
    expect(summary.replayErrors).toEqual([]);
    expect(summary.terminationKind).toBe("game_result");
    expect(summary.actionSequence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionType: "score_agenda",
          planKind: "corp.score_agenda",
          reasonCode: "plan_first.corp.score_agenda",
          fallbackUsed: false,
        }),
      ]),
    );
  }, 120_000);

  it("scores the exact unadvanced agenda when three active reductions make it ready", () => {
    const requiredCards = [
      { id: CORPORATE_DOWNSIZING, quantity: 1 },
      { id: EXECUTIVE_EXTRACTION, quantity: 2 },
      { id: WASHINGTON_GRID, quantity: 1 },
    ];
    const corpDeck = {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        ...requiredCards,
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (card) => !requiredCards.some((required) => required.id === card.id),
        ),
      ],
    };
    const beforeDraw = createGameAfterSetup({ seed: "downsizing-zero-score", corpDeck });
    const draw = getLegalActions(beforeDraw, "corp").find(
      (action) => action.type === "mandatory_draw",
    )!;
    const afterDraw = applyAction(beforeDraw, {
      matchId: beforeDraw.matchId,
      side: "corp",
      actionId: draw.actionId,
      clientKnownStateVersion: beforeDraw.stateVersion,
    });
    if (!afterDraw.ok) throw new Error(afterDraw.error.message);

    const state = afterDraw.state;
    scoreCorpAgendaForTest(state, EXECUTIVE_EXTRACTION);
    scoreCorpAgendaForTest(state, EXECUTIVE_EXTRACTION);
    const agenda = putCorpRootInRemote(state, CORPORATE_DOWNSIZING);
    const grid = state.cardInstances[putCorpRootInRemote(state, WASHINGTON_GRID)]!;
    const isAgendaScore = (action: { type: string; source: string }) =>
      action.type === "score_agenda" && action.source === agenda;
    expect(getLegalActions(state, "corp").some(isAgendaScore)).toBe(false);
    grid.rezzed = true;
    grid.faceup = true;

    const input = buildAiDecisionInput(state, "corp", {
      ownDeckSnapshot: {
        deckSnapshotId: "downsizing-zero-score",
        side: "corp",
        cards: corpDeck.cards.map(({ id, quantity }) => ({ cardId: id, quantity })),
      },
    });
    expect(input.playerView.servers.find((server) => server.id === "r1")?.root.find(
      (card) => card.instanceId === agenda,
    )).toMatchObject({
      definitionId: CORPORATE_DOWNSIZING,
      advancementRequirement: 0,
      advancementCounters: 0,
    });
    expect(input.playerView.own.agendaPoints).toBe(2);
    const score = input.legalActions.find(isAgendaScore);
    if (!score) throw new Error("Missing Engine score action for Corporate Downsizing.");
    const decision = chooseAiAction(input);
    expect(decision).toMatchObject({
      actionId: score.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    const scored = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: score.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    if (!scored.ok) throw new Error(scored.error.message);
    expect(scored.state.corp.scoreArea).toContain(agenda);
    expect(getPlayerView(scored.state, "corp").own.agendaPoints).toBe(4);
    expect(scored.state.corp.clicks).toBe(state.corp.clicks);
    const replay = replayEvents(state, scored.state.eventLog.slice(state.eventLog.length));
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(scored.state));
  });
});
