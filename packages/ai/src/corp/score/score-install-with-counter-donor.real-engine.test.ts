import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type GameState,
  type LegalAction,
  type PlayerAction,
} from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import catalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../../evaluation/real-engine-fixture-builder";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { releaseAiMatchRuntime } from "../../runtime/match-runtime-memory";

const deck = catalog.decks.find(
  (entry) => entry.standardDeckId === "standard_corp_doppelte_buchfuehrung",
)!;
const matchId = "score-install-with-counter-donor";
const agenda = 66;
const expert = 503;
const donor = 560;

function apply(
  state: GameState,
  action: LegalAction,
  choices?: PlayerAction["selectedChoices"],
) {
  const result = applyAction(state, {
    matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(choices === undefined ? {} : { selectedChoices: choices }),
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function position(counters: number, hasPreparedRemote: boolean) {
  let state = createGameAfterSetup({
    matchId,
    seed: matchId,
    runnerDeck: DEMO_DECKS.demo_runner_001,
    corpDeck: {
      id: deck.standardDeckId,
      side: "corp",
      name: deck.name,
      identity: deck.identityCardId,
      cards: deck.cards.map(({ cardId, quantity }) => ({
        id: cardId,
        quantity,
      })),
    },
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  const fixture = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq(agenda)
    .withCorpCardInHq(expert)
    .withCorpCardInHq(482) // Sleeper can protect the open HQ.
    .withCorpRemoteRoot("r1", donor, counters)
    .withCorpCredits(2)
    .withRunnerCredits(9);
  if (hasPreparedRemote) fixture.withRezzedCorpIceOnServer("r2", 491);
  state.corp.clicks = 2;
  return state;
}

function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: deck.standardDeckId,
      side: "corp",
      cards: deck.cards,
    },
  });
}

afterEach(() => releaseAiMatchRuntime(matchId));

it.each([
  { prepared: false, destination: "new_remote" },
  { prepared: true, destination: "r2" },
])(
  "scores using the donor in a different fort, preferring $destination",
  ({ prepared, destination }) => {
    let state = position(3, prepared);
    const source = state.corp.servers.find((s) => s.id === "r1")!.root[0]!;
    const target = state.corp.hq.find(
      (id) => state.cardInstances[id]!.definitionId === agenda,
    )!;
    let operationExecutor: string | undefined;
    for (const type of [
      "install_card",
      "play_operation",
      "resolve_choice",
      "score_agenda",
    ]) {
      const input = inputFor(state);
      const decision = chooseAiAction(input);
      const action = input.legalActions.find(
        (a) => a.actionId === decision.actionId,
      )!;
      const trace = decision.decisionDebug?.planFirstDecision;
      expect(action.type).toBe(type);
      expect(trace?.stateVersion).toBe(state.stateVersion);
      if (type !== "resolve_choice") {
        expect(trace?.selectedPlan?.moduleId).toBe("corp.score_agenda");
        expect(trace?.route).toMatchObject({
          actionId: action.actionId,
          stateVersion: state.stateVersion,
        });
      }
      if (type === "install_card") {
        expect(action.source).toBe(target);
        expect(action.payload?.serverId).toBe(destination);
      } else if (type === "play_operation") {
        expect(state.cardInstances[action.source]!.definitionId).toBe(expert);
        operationExecutor = trace?.executionOrigin?.leafPlanInstanceId;
        expect(operationExecutor).toBeDefined();
      } else if (type === "resolve_choice") {
        expect(trace?.engineWindowAction?.actionId).toBe(action.actionId);
        expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
          rootForegroundInstanceId: operationExecutor,
          executorInstanceId: operationExecutor,
        });
        expect(decision.selectedChoices).toEqual({
          choiceId: input.playerView.pendingChoice!.choiceId,
          selectedOptionIds: [`move_${source}_${target}_3`],
        });
      } else expect(action.source).toBe(target);
      state = apply(state, action, decision.selectedChoices);
    }
    expect(state.cardInstances[source]!.advancementCounters).toBe(0);
    expect(getPlayerView(state, "corp").own.agendaPoints).toBe(2);
  },
);

it("requires a funded scoring route before treating a new fort as a same-turn alternative", () => {
  const state = position(1, false);
  expect(corpSameTurnScoreConversionPaths(inputFor(state))).toHaveLength(0);
  const input = inputFor(state);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (row) => row.actionId === decision.actionId,
  )!;
  expect(action.payload?.serverId).not.toBe("new_remote");
});
