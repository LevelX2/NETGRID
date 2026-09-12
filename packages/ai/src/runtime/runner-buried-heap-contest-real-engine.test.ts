import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import type { DeckDefinition, GameState, PlayerAction } from "@netgrid/shared";
import { expect, it } from "vitest";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import checkpoint from "../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-buried-heap-answer-d375.json";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";
import type { AiDeckStrategyDeckSnapshot } from "../deck-strategy-snapshot";

function apply(
  state: GameState,
  side: "runner" | "corp",
  actionId: string,
  selectedChoices?: PlayerAction["selectedChoices"],
) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `heap:${state.stateVersion}:${actionId}`,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw new Error(`${actionId}: ${result.error.message}`);
  return result.state;
}
function run() {
  resetResidentPlanPortfolioMemory();
  const deck = (id: string): DeckDefinition => {
    const d = catalog.decks.find((d) => d.standardDeckId === id)!;
    return {
      id: d.standardDeckId,
      name: d.name,
      side: d.side as "runner" | "corp",
      identity: d.identityCardId,
      cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
    };
  };
  let state = createGameAfterSetup({
    seed: "pairing-422-buried-heap-proof",
    matchId: "test-buried-heap-contest",
    agendaPointsToWin: 7,
    runnerDeck: deck("standard_runner_rent_i_con_shellspiel_2026_07_17"),
    corpDeck: deck("standard_corp_rent_to_own_war_engine"),
  });
  state = apply(
    state,
    "corp",
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!
      .actionId,
  );
  RealEngineFixtureBuilder.forState(state).withCorpHqSize(5);
  state = apply(
    state,
    "corp",
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!.actionId,
  );
  const fixture = RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(8)
    .withRunnerClicks(4)
    .withRunnerGripSize(0)
    .withRunnerResourceInstalled("onr_v1_165_junkyard-bbs")
    .withRunnerResourceInstalled("onr_proteus_128_airport-locker")
    .withRunnerProgramInstalled("onr_v1_071_vewy-vewy-quiet")
    .withRunnerProgramInstalled("onr_v1_011_cloak")
    .withCorpCredits(7)
    .withCorpRemoteRoot("remote_1", "onr_v1_208_on-call-solo-team", 1)
    .withRezzedCorpIceOnServer("remote_1", "onr_v1_244_filter")
    .withRezzedCorpIceOnServer("remote_1", "onr_v1_243_fetch-4-0-1")
    .withRezzedCorpIceOnServer("remote_1", "onr_v1_237_data-wall");
  for (const def of [
    "onr_v1_114_temple-microcode-outlet",
    "onr_v1_035_invisibility",
    "onr_proteus_133_chiba-bank-account",
    "onr_proteus_134_cortical-cybermodem",
    "onr_v1_176_the-shell-traders",
  ])
    fixture.withRunnerCardInGrip(def);
  state.runner.memoryUsed = 2;
  for (const [definitionId, side] of [
    ["onr_v1_220_tycho-extension", "runner"],
    ["onr_v1_196_corporate-war", "corp"],
    ["onr_v1_194_corporate-downsizing", "corp"],
  ] as const) {
    const [id, card] = Object.entries(state.cardInstances).find(
      ([, c]) => c.definitionId === definitionId,
    )!;
    state.corp.rd = state.corp.rd.filter((x) => x !== id);
    state.corp.hq = state.corp.hq.filter((x) => x !== id);
    state[side].scoreArea.push(id);
    state.cardInstances[id] = {
      ...card,
      zone: { side, zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
  }
  for (const id of state.runner.rig.programs)
    state.cardInstances[id]!.counters = {
      bit: state.cardInstances[id]!.definitionId === "onr_v1_011_cloak" ? 3 : 2,
    };
  for (const [id, card] of Object.entries(state.cardInstances).filter(
    ([, c]) =>
      c.definitionId === "onr_classic_031_rent-i-con" ||
      c.definitionId === "onr_classic_042_panzer-run",
  )) {
    state.runner.grip = state.runner.grip.filter((x) => x !== id);
    state.runner.stack = state.runner.stack.filter((x) => x !== id);
    state.runner.heap.push(id);
    state.cardInstances[id] = {
      ...card,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
  }
  // Exactly one obstruction above the nearest breaker; the other Panzer is below it.
  const topPanzer = state.runner.heap
    .filter(
      (id) =>
        state.cardInstances[id]!.definitionId === "onr_classic_042_panzer-run",
    )
    .at(-1)!;
  state.runner.heap = [
    ...state.runner.heap.filter(
      (id) =>
        id !== topPanzer &&
        state.cardInstances[id]!.definitionId !== "onr_classic_031_rent-i-con",
    ),
    ...state.runner.heap.filter(
      (id) =>
        state.cardInstances[id]!.definitionId === "onr_classic_031_rent-i-con",
    ),
    topPanzer,
  ];
  const selected: Array<{
    type: string;
    target: string | undefined;
    owner: string | undefined;
  }> = [];
  for (let step = 0; step < 40 && !state.winner; step++) {
    const runnerActions = getLegalActions(state, "runner");
    if (runnerActions.length === 0) {
      const decline = getLegalActions(state, "corp").find(
        (a) => a.type === "decline_rez",
      );
      if (!decline)
        throw new Error("Unexpected Corp reply in fully known route");
      state = apply(state, "corp", decline.actionId);
      continue;
    }
    const input = buildAiDecisionInput(state, "runner", {
      difficulty: "hard",
      decisionId: `heap:${state.stateVersion}`,
      profileId: "heap-contest",
      ownDeckSnapshot: checkpoint.input
        .ownDeckSnapshot as AiDeckStrategyDeckSnapshot,
    });
    const decision = chooseAiAction(input);
    if (!decision.actionId) throw new Error("Expected direct action");
    const action = runnerActions.find((a) => a.actionId === decision.actionId)!;
    selected.push({
      type: action.type,
      target:
        typeof action.payload?.targetCardId === "string"
          ? state.cardInstances[action.payload.targetCardId]?.definitionId
          : undefined,
      owner: decision.decisionDebug?.planKind,
    });
    expect(decision.fallbackUsed).toBe(false);
    state = apply(state, "runner", decision.actionId, decision.selectedChoices);
    if (action.type === "end_turn") break;
  }
  return {
    selected,
    winner: state.winner,
    points: getPlayerView(state, "runner").own.agendaPoints,
    clicks: state.runner.clicks,
    hash: state.eventLog.at(-1)?.stateHashAfter,
  };
}
it("recovers twice, installs and contests through real LegalActions with stable replay", () => {
  const first = run();
  expect(run()).toEqual(first);
  expect(first.selected.slice(0, 4).map((x) => x.type)).toEqual([
    "activated_card_ability",
    "activated_card_ability",
    "install_card",
    "start_run",
  ]);
  expect(
    first.selected
      .slice(0, 3)
      .every((x) => x.owner === "runner.rig_and_coverage"),
  ).toBe(true);
  expect(first.points).toBe(7);
  expect(first.clicks).toBe(0);
});
