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
import { beforeEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../plans/tactical-plan-corp-score-conversion";
import { buildAiDecisionInput } from "./ai-decision-input";

const SUPPORT = "onr_v1_312_chicago-branch",
  AGENDA = "onr_v1_205_main-office-relocation";
const corpDeck = {
  ...DEMO_DECKS.demo_corp_001,
  id: "repeatable-score-proof",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards,
    { id: SUPPORT, quantity: 1 },
    { id: AGENDA, quantity: 1 },
  ],
};
function apply(
  state: GameState,
  action: LegalAction,
  selectedChoices?: PlayerAction["selectedChoices"],
): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `proof:${state.stateVersion}`,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.state;
}
function fixture(credits = 28, clicks = 3) {
  let state = createGameAfterSetup({
    matchId: "repeatable-score-proof",
    seed: "repeatable-score-proof",
    agendaPointsToWin: 7,
    runnerDeck: DEMO_DECKS.demo_runner_001,
    corpDeck,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(credits)
    .withCorpCardInHq(AGENDA)
    .withCorpRemoteRoot("remote_1", SUPPORT);
  state.corp.clicks = clicks;
  return state;
}
function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    decisionId: `proof:${state.stateVersion}`,
    profileId: "repeatable-score",
    ownDeckSnapshot: {
      deckSnapshotId: "repeatable-score",
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
beforeEach(() => resetResidentPlanPortfolioMemory());

it("executes two native activations with one rez and exact choices under the same Score executor", () => {
  let state = fixture();
  const path = corpSameTurnScoreConversionPaths(inputFor(state)).find(
    (p) => p.targetServerId === "new_remote",
  )!;
  expect(path).toBeDefined();
  expect(path).toMatchObject({ clicksRequired: 3, creditsRequired: 8 });
  expect(path.steps.map((s) => s.kind)).toEqual([
    "install_score_target",
    "rez_score_support",
    "place_advancement",
    "place_advancement",
    "score_ready",
  ]);
  const types: string[] = [];
  let executor: string | undefined, target: string | undefined;
  for (let n = 0; n < 7; n++) {
    const input = inputFor(state),
      decision = chooseAiAction(input),
      action = input.legalActions.find(
        (a) => a.actionId === decision.actionId,
      )!;
    expect(action).toBeDefined();
    expect(decision.fallbackUsed).toBe(false);
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    if (n === 0) {
      executor = portfolio.executorInstanceId;
      target = action.source;
    }
    if (n === 1) {
      const installedServer = state.corp.servers.find((s) =>
        s.root.includes(target!),
      )!;
      expect(portfolio.executorInstanceId).toBe(
        executor!.replace("%3Anew_remote", `%3A${installedServer.id}`),
      );
      executor = portfolio.executorInstanceId;
    }
    expect(portfolio.executorInstanceId).toBe(executor);
    if (action.type === "activated_card_ability")
      expect(action.payload?.scoreConversionRepeatable).toBe(true);
    if (action.type === "resolve_choice") {
      const option = input.playerView.pendingChoice!.options.find(
        (o) => o.value === `${target}:2`,
      )!;
      expect(decision.selectedChoices).toEqual({
        choiceId: input.playerView.pendingChoice!.choiceId,
        selectedOptionIds: [option.id],
      });
    } else expect(decision.reasonCode).toBe("plan_first.corp.score_agenda");
    types.push(action.type);
    state = apply(state, action, decision.selectedChoices);
  }
  expect(types).toEqual([
    "install_card",
    "rez_card",
    "activated_card_ability",
    "resolve_choice",
    "activated_card_ability",
    "resolve_choice",
    "score_agenda",
  ]);
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(3);
  expect(state.corp.credits).toBe(20);
  expect(state.corp.clicks).toBe(0);
  expect(
    state.corp.servers.find((s) => s.id === "remote_1")!.root,
  ).toHaveLength(1);
});

it.each([
  [7, 3],
  [28, 2],
])(
  "does not claim an unfunded repeated score at %i credits and %i clicks",
  (credits, clicks) => {
    expect(
      corpSameTurnScoreConversionPaths(inputFor(fixture(credits, clicks))),
    ).toEqual([]);
  },
);

it("does not use the support after replacing its own root", () => {
  const input = inputFor(fixture());
  expect(
    corpSameTurnScoreConversionPaths(input).some(
      (p) => p.targetServerId === "remote_1",
    ),
  ).toBe(false);
});
