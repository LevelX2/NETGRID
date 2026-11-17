import { expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import { ORIGINALSET_DEFAULT_DECKS, type LegalAction } from "@netgrid/shared";
import {
  apply,
  scoreCorpAgendaForTest,
  scoreRunnerAgendaForTest,
} from "../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

const CORPORATE_COUP = 405;
const TYCHO_EXTENSION = 432;
const SECURITY_NET_OPTIMIZATION = 427;
const FIRE_WALL = 457;
const CRYSTAL_WALL = 444;
const WALL_OF_STATIC = 491;

it("finishes Corporate Coup's five-advance campaign before the second Runner window", () => {
  const requiredCards = [
    CORPORATE_COUP,
    TYCHO_EXTENSION,
    SECURITY_NET_OPTIMIZATION,
    FIRE_WALL,
    CRYSTAL_WALL,
    WALL_OF_STATIC,
  ];
  const corpDeck = {
    ...ORIGINALSET_DEFAULT_DECKS.corp,
    cards: [
      ...requiredCards.map((id) => ({ id, quantity: 1 })),
      ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
        (card) => !requiredCards.includes(card.id),
      ),
    ],
  };
  let state = apply(
    createGameAfterSetup({ seed: "score-milestone-completion", corpDeck }),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  state.turnSerial = 54;
  scoreCorpAgendaForTest(state, TYCHO_EXTENSION);
  scoreRunnerAgendaForTest(state, SECURITY_NET_OPTIMIZATION);
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(CORPORATE_COUP)
    .withCorpCredits(18)
    .withRunnerCredits(3)
    .withRunnerGripSize(3)
    .withRezzedCorpIceOnServer("hq", CRYSTAL_WALL)
    .withRezzedCorpIceOnServer("rd", WALL_OF_STATIC)
    .withRezzedCorpIceOnServer("r1", FIRE_WALL);
  const initial = structuredClone(state);
  resetResidentPlanPortfolioMemory();
  const coup = state.corp.hq.find(
    (id) => state.cardInstances[id]?.definitionId === CORPORATE_COUP,
  );
  if (!coup) throw new Error("Missing Corporate Coup in HQ.");
  const root = `plan:corp.score_agenda:${encodeURIComponent(`agenda:${coup}:r1`)}`;
  const ownDeckSnapshot = {
    deckSnapshotId: "score-milestone-completion",
    side: "corp" as const,
    cards: corpDeck.cards.map(({ id, quantity }) => ({ cardId: id, quantity })),
  };
  const selectedTypes: LegalAction["type"][] = [];
  let advances = 0;
  const corp = () => {
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "hard",
      ownDeckSnapshot,
      decisionId: `score-milestone:${state.stateVersion}`,
    });
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    const action = input.legalActions.find(
      (candidate) => candidate.actionId === decision.actionId,
    );
    if (!action) throw new Error("Missing the exact Corp action.");
    if (action.payload?.cardId === coup) {
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: root,
        leafExecutorInstanceId: root,
      });
      if (action.type === "advance_card") advances++;
    }
    selectedTypes.push(action.type);
    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(decision.selectedChoices
        ? { selectedChoices: decision.selectedChoices }
        : {}),
    });
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  };
  for (let i = 0; i < 10 && state.activeSide === "corp"; i++) corp();
  expect(state.activeSide).toBe("runner");
  expect(advances).toBe(2);
  for (let i = 0; i < 8 && state.activeSide === "runner"; i++) {
    state = apply(state, "runner", (action) =>
      action.type === (state.runner.clicks > 0 ? "gain_credit" : "end_turn"),
    );
  }
  for (
    let i = 0;
    i < 10 &&
    state.activeSide === "corp" &&
    getPlayerView(state, "corp").own.agendaPoints < 6;
    i++
  )
    corp();
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(6);
  expect(getPlayerView(state, "runner").own.agendaPoints).toBe(3);
  expect(state.turnSerial).toBe(56);
  expect(advances).toBe(5);
  expect(state.corp.scoreArea).toContain(coup);
  expect(selectedTypes).not.toContain("draw_card");
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  expect(replay.ok).toBe(true);
  expect(hashGameState(replay.state)).toBe(hashGameState(state));
});
