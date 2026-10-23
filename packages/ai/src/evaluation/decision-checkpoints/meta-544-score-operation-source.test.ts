import { readFileSync } from "node:fs";
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
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const SYS = "onr_v1_304_systematic-layoffs";
const RETREAT = "onr_v1_195_corporate-retreat";
const MARINE = "onr_v1_206_marine-arcology";
const OVERTIME = "onr_v1_297_overtime-incentives";
afterEach(resetResidentPlanPortfolioMemory);

function native(game: number, decision: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-544-r4-g" +
          game +
          "-d" +
          decision +
          "-score-source.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.keys(cp.validation)).toHaveLength(9);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  return cp;
}
function restore(cp: ReturnType<typeof native>) {
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
}
function decide(cp: ReturnType<typeof native>) {
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]);
  const result = chooseAiAction(cp.input);
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  expect(JSON.stringify([cp.input.playerView, cp.input.legalActions])).toBe(
    before,
  );
  const action = cp.input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(action).toBeDefined();
  expect(action.expiresAtStateVersion).toBe(cp.input.playerView.stateVersion);
  const plan = result.decisionDebug!.planFirstDecision!;
  expect(plan.route?.actionId).toBe(action.actionId);
  expect(plan.route?.stateVersion).toBe(cp.input.playerView.stateVersion);
  expect(plan.route?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
  expect(plan.selectedPlan?.moduleId).toBe("corp.score_agenda");
  expect(plan.rootPlanInstanceId).toBe(plan.selectedPlan?.instanceId);
  return { action, plan };
}
it.each([
  [11, 60, RETREAT],
  [16, 201, "onr_proteus_007_project-venice"],
  [22, 197, RETREAT],
  [35, 170, "onr_proteus_007_project-venice"],
  [40, 214, "onr_proteus_007_project-venice"],
] as const)(
  "does not score the four-counter agenda with one duplicated operation in native G%i D%i",
  (game, decision, definitionId) => {
    const { input } = native(game, decision);
    const target = input.playerView.own.gripOrHq.find(
      (c) => c.definitionId === definitionId,
    )!;
    expect(target.advancementRequirement).toBe(4);
    const operationIds = input.playerView.own.gripOrHq
      .filter((c) => c.definitionId === SYS)
      .map((c) => c.instanceId);
    expect(operationIds).toHaveLength(1);
    expect(
      input.legalActions.filter(
        (a) => a.type === "play_operation" && a.source === operationIds[0],
      ),
    ).toHaveLength(1);
    const paths = corpSameTurnScoreConversionPaths(input);
    expect(paths.some((p) => p.agendaCardId === target.instanceId)).toBe(false);
    for (const path of paths)
      expect(
        path.steps.filter(
          (s) =>
            s.kind === "place_advancement" &&
            s.sourceCardId === operationIds[0],
        ).length,
      ).toBeLessThanOrEqual(1);
  },
);
it("chooses a realizable HQ Zurich closeout instead of the impossible Retreat", () => {
  const cp = native(11, 60);
  restore(cp);
  const { action } = decide(cp);
  expect(action.type).toBe("install_card");
  expect(action.source).toBe("corp_onr_proteus_008_project-zurich_1");
  // This real HQ closeout also relieves the six-card hand and retains Marine.
  // Source validity must not force the cheapest resident target instead.
  const path = corpSameTurnScoreConversionPaths(cp.input).find(
    (p) => p.agendaCardId === action.source,
  )!;
  expect(path).toMatchObject({ clicksRequired: 3, creditsRequired: 6 });
  expect(path.steps.map((s) => s.kind)).toEqual([
    "install_score_target",
    "place_advancement",
    "basic_advance",
    "score_ready",
  ]);
  expect(path.steps.filter((s) => s.kind === "place_advancement")).toHaveLength(
    1,
  );
});
it("preserves that choice across the actual consecutive Corp decision inputs", () => {
  const previous = native(11, 53),
    cp = native(11, 60);
  restore(previous);
  const end = chooseAiAction(previous.input);
  expect(end.actionId).toBe("corp.end_turn");
  const { action } = decide(cp);
  expect(action.type).toBe("install_card");
  expect(action.source).toBe("corp_onr_proteus_008_project-zurich_1");
});
it("keeps the genuine current acceleration when two remaining actions need it", () => {
  const cp = native(11, 61);
  const marine = corpSameTurnScoreConversionPaths(cp.input).find(
    (p) => p.agendaCardId === "corp_onr_v1_206_marine-arcology_1",
  )!;
  expect(marine).toMatchObject({ clicksRequired: 2, creditsRequired: 6 });
  expect(marine.steps.map((s) => s.kind)).toEqual([
    "place_advancement",
    "basic_advance",
    "score_ready",
  ]);
  restore(cp);
  expect(decide(cp).action.source).toBe("corp_onr_v1_304_systematic-layoffs_1");
});
it("retains the funded eleven-credit terminal-defense reserve in native G40", () => {
  const cp = native(40, 214);
  const marine = corpSameTurnScoreConversionPaths(cp.input).find(
    (p) => p.agendaCardId === "corp_onr_v1_206_marine-arcology_1",
  )!;
  expect(marine.creditsRequired).toBe(3);
  expect(cp.input.playerView.own.credits - marine.creditsRequired).toBe(11);
  restore(cp);
  const { action } = decide(cp);
  expect(action.type).toBe("advance_card");
  expect(action.source).toBe("corp_onr_v1_206_marine-arcology_1");
});

const corpDeck = {
  ...DEMO_DECKS.demo_corp_001,
  id: "score-operation-source-proof",
  cards: [
    ...DEMO_DECKS.demo_corp_001.cards.filter(
      (c) => ![SYS, RETREAT, MARINE, OVERTIME].includes(c.id),
    ),
    { id: SYS, quantity: 2 },
    { id: RETREAT, quantity: 1 },
    { id: MARINE, quantity: 1 },
    { id: OVERTIME, quantity: 1 },
  ],
};
function apply(
  state: GameState,
  action: LegalAction,
  selectedChoices?: PlayerAction["selectedChoices"],
) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "source-proof:" + state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.state;
}
function engineFixture(
  credits: number,
  copies: number,
  clicks = 3,
  resident = true,
  overtime = false,
) {
  let state = createGameAfterSetup({
    matchId: "score-operation-source-proof",
    seed: "score-operation-source-proof",
    agendaPointsToWin: 7,
    runnerDeck: DEMO_DECKS.demo_runner_001,
    corpDeck,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  const builder = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(credits)
    .withCorpCardInHq(RETREAT);
  if (resident) builder.withCorpRemoteRoot("remote_1", MARINE);
  if (overtime) builder.withCorpCardInHq(OVERTIME);
  const sources = state.corp.rd
    .filter((id) => state.cardInstances[id]!.definitionId === SYS)
    .slice(0, copies);
  if (sources.length !== copies)
    throw new Error("Real operation copies missing from engine fixture");
  for (const id of sources) {
    state.corp.rd = state.corp.rd.filter((c) => c !== id);
    state.corp.hq.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "corp", zone: "hq" },
      faceup: false,
      rezzed: false,
    };
  }
  state.corp.clicks = clicks;
  return state;
}
function inputFor(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    decisionId: "source-proof:" + state.stateVersion,
    profileId: "score-source",
    ownDeckSnapshot: {
      deckSnapshotId: "score-source",
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
function retreatPath(state: GameState) {
  const input = inputFor(state),
    target = input.playerView.own.gripOrHq.find(
      (c) => c.definitionId === RETREAT,
    )!;
  return corpSameTurnScoreConversionPaths(input).find(
    (p) => p.agendaCardId === target.instanceId,
  );
}
it.each([
  [10, true],
  [9, false],
] as const)(
  "budgets two genuine native copies at %i credits",
  (credits, expected) => {
    const state = engineFixture(credits, 2),
      path = retreatPath(state);
    expect(path !== undefined).toBe(expected);
    if (expected) {
      expect(path?.creditsRequired).toBe(10);
      expect(
        new Set(
          path?.steps
            .filter((s) => s.kind === "place_advancement")
            .map((s) => s.sourceCardId),
        ).size,
      ).toBe(2);
    }
  },
);
it.each([
  [7, true],
  [6, false],
] as const)(
  "retains a currently nonlegal prospective operation at %i credits",
  (credits, expected) => {
    const state = engineFixture(credits, 1, 4, false),
      input = inputFor(state);
    const source = input.playerView.own.gripOrHq.find(
      (c) => c.definitionId === SYS,
    )!;
    expect(
      input.legalActions.some(
        (a) => a.type === "play_operation" && a.source === source.instanceId,
      ),
    ).toBe(false);
    const path = retreatPath(state);
    expect(path !== undefined).toBe(expected);
    if (expected) expect(path?.creditsRequired).toBe(7);
  },
);
it.each([
  [11, true],
  [10, false],
] as const)(
  "retains real action-capacity financing at %i credits",
  (credits, expected) => {
    const path = retreatPath(engineFixture(credits, 1, 3, true, true));
    expect(path !== undefined).toBe(expected);
    if (expected)
      expect(path).toMatchObject({ creditsRequired: 11, clicksGenerated: 2 });
  },
);
it("executes the two distinct copies through actual Engine choices and consumes both once", () => {
  let state = engineFixture(10, 2);
  expect(retreatPath(state)).toBeDefined();
  const install = getLegalActions(state, "corp").find(
    (a) =>
      a.type === "install_card" &&
      state.cardInstances[a.source!]!.definitionId === RETREAT &&
      a.payload?.serverId === "new_remote",
  )!;
  expect(install).toBeDefined();
  const target = install.source!;
  state = apply(state, install);
  const used = new Set<string>();
  for (let n = 0; n < 2; n++) {
    const play = getLegalActions(state, "corp").find(
      (a) =>
        a.type === "play_operation" &&
        state.cardInstances[a.source!]!.definitionId === SYS,
    )!;
    expect(play).toBeDefined();
    expect(used.has(play.source!)).toBe(false);
    used.add(play.source!);
    state = apply(state, play);
    const choice = getPlayerView(state, "corp").pendingChoice!;
    const option = choice.options.find((o) => o.value === target + ":2")!;
    expect(option).toBeDefined();
    state = apply(
      state,
      getLegalActions(state, "corp").find((a) => a.type === "resolve_choice")!,
      { choiceId: choice.choiceId, selectedOptionIds: [option.id] },
    );
  }
  const score = getLegalActions(state, "corp").find(
    (a) => a.type === "score_agenda" && a.source === target,
  )!;
  expect(score).toBeDefined();
  state = apply(state, score);
  expect(used.size).toBe(2);
  expect(state.corp.credits).toBe(0);
  expect(state.corp.clicks).toBe(0);
  expect(getPlayerView(state, "corp").own.agendaPoints).toBe(3);
});
