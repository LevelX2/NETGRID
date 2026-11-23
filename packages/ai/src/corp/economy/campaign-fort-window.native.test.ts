import { readFileSync } from "node:fs";
import {
  applyAction,
  createGame,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type {
  GameState,
  LegalAction,
  PlayerAction,
  Side,
} from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDeckStrategyDeckSnapshot } from "../../deck-strategy-snapshot";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { releaseAiMatchRuntime } from "../../runtime/match-runtime-memory";
import { simulationEngineRuntimeOptions } from "../../simulation/engine-selection";
import { assertAiInputIsSideSafe } from "../../simulation/side-safe-input";
import type { EconomyState } from "./economy-types";

const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/meta846-campaign-fort.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  setup: Parameters<typeof createGame>[0];
  corpSnapshot: AiDeckStrategyDeckSnapshot;
  scenarios: {
    matchId: string;
    seed: string;
    stateHash: string;
    commands: [Side, string, PlayerAction["selectedChoices"]?][];
  }[];
};

afterEach(() => {
  for (const scenario of fixture.scenarios)
    releaseAiMatchRuntime(scenario.matchId);
});

function stateAt(scenario: (typeof fixture.scenarios)[number]) {
  let state = createGame({
    ...fixture.setup,
    matchId: scenario.matchId,
    seed: scenario.seed,
  });
  for (const [side, actionId, selectedChoices] of scenario.commands) {
    const result = applyAction(
      state,
      {
        matchId: state.matchId,
        clientKnownStateVersion: state.stateVersion,
        side,
        actionId,
        ...(selectedChoices ? { selectedChoices } : {}),
      },
      { publicEventsMode: "latest" },
    );
    if (!result.ok) throw Error(result.error.code);
    state = result.state;
  }
  expect(hashState(state)).toBe(scenario.stateHash);
  return state;
}

function execute(state: GameState, action: LegalAction) {
  const result = applyAction(state, {
    matchId: state.matchId,
    clientKnownStateVersion: state.stateVersion,
    side: action.side,
    actionId: action.actionId,
  });
  if (!result.ok) throw Error(result.error.code);
  return result.state;
}

it.each([
  { game: 8, index: 0, target: "r1" },
  { game: 14, index: 1, target: "new_remote" },
  { game: 12, index: 2, target: "r1" },
])(
  "compares both legal BBS sites against the score window in game $game",
  ({ index, target }) => {
    const state = stateAt(fixture.scenarios[index]!);
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "hard",
      ownDeckSnapshot: fixture.corpSnapshot,
    });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    const decision = chooseAiAction(
      input,
      simulationEngineRuntimeOptions(state),
    );
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    const offered = input.legalActions.filter(
      (a) => a.type === "install_card" && a.source === action.source,
    );
    expect(offered.map((a) => a.payload?.serverId)).toEqual(
      expect.arrayContaining(["new_remote", "r1"]),
    );
    expect(action).toMatchObject({
      type: "install_card",
      expiresAtStateVersion: state.stateVersion,
      payload: { serverId: target },
    });
    expect(
      input.playerView.own.gripOrHq.find((c) => c.instanceId === action.source)
        ?.title,
    ).toBe("BBS Whispering Campaign");
    expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      selectedPlan: { moduleId: "corp.economy" },
      route: { actionId: action.actionId },
    });
    const campaigns = residentPlanPortfolioSnapshot(input)!
      .instances.filter((p) => p.moduleId === "corp.economy")
      .map((p) => (p.moduleState as EconomyState).signal)
      .filter(
        (s) =>
          s.kind === "develop_campaign" && s.sourceInstanceId === action.source,
      );
    const fortAction = offered.find((a) => a.payload?.serverId === "r1")!;
    expect(
      campaigns.some((c) => c.actionIds.includes(fortAction.actionId)),
    ).toBe(target === "r1");
    const installed = execute(state, action);
    if (target === "r1") {
      const trace = decision.decisionDebug!.planFirstDecision!;
      if (index === 0)
        expect(trace.selectedPlan?.parentNeedId).toBe(
          "score-support:agenda:c2hp:r1",
        );
      const rez = getLegalActions(installed, "corp").find(
        (a) => a.type === "rez_card" && a.source === action.source,
      )!;
      const ready = execute(installed, rez);
      const payout = getLegalActions(ready, "corp").find(
        (a) =>
          a.type === "activated_card_ability" && a.source === action.source,
      )!;
      const funded = execute(ready, payout);
      expect([funded.corp.credits, funded.corp.clicks]).toEqual([
        state.corp.credits + 2,
        1,
      ]);
      expect(
        getLegalActions(funded, "corp").some(
          (a) =>
            a.type === "install_card" &&
            a.payload?.serverId === "r1" &&
            a.payload.rootReplacement === "asset_to_agenda",
        ),
      ).toBe(true);
    } else {
      expect(installed.corp.servers.find((s) => s.id === "r1")!.root).toEqual(
        state.corp.servers.find((s) => s.id === "r1")!.root,
      );
    }
  },
);

it("collects the two current BBS payouts before searching for ICE with five cards in HQ", () => {
  const initial = stateAt(fixture.scenarios[0]!);
  let state = initial;
  const fundingNeed = "score-support:agenda:c2hp:r1";
  for (const [step, type] of [
    "install_card",
    "rez_card",
    "activated_card_ability",
    "activated_card_ability",
  ].entries()) {
    const input = buildAiDecisionInput(state, "corp", {
      difficulty: "hard",
      ownDeckSnapshot: fixture.corpSnapshot,
    });
    expect(assertAiInputIsSideSafe(input)).toBe(true);
    const decision = chooseAiAction(
      input,
      simulationEngineRuntimeOptions(state),
    );
    const action = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    )!;
    expect(action).toMatchObject({
      type,
      source: "c37x",
      expiresAtStateVersion: state.stateVersion,
    });
    expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    const trace = decision.decisionDebug!.planFirstDecision!;
    expect(trace).toMatchObject({
      selectedPlan: { moduleId: "corp.economy", parentNeedId: fundingNeed },
      route: { actionId: action.actionId, stateVersion: state.stateVersion },
    });
    if (step === 1 || step === 2) {
      expect(input.playerView.own.gripOrHq).toHaveLength(5);
      const draw = input.legalActions.find((a) => a.type === "draw_card")!;
      expect(trace.dispositions).toContainEqual({
        actionId: draw.actionId,
        ownerModuleId: "corp.defend_servers",
        disposition: "explicitly_nonproductive",
        evidenceCode:
          "corp_draw_admission:defer_for_current_funding:score_defense_answer_search",
      });
    }
    state = execute(state, action);
  }
  expect([state.corp.credits, state.corp.clicks, state.corp.hq.length]).toEqual(
    [8, 0, 5],
  );
  expect(state.cardInstances.c37x?.counters?.bit).toBe(12);

  state = execute(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!,
  );
  const run = getLegalActions(state, "runner").find(
    (a) => a.type === "start_run" && a.payload?.serverId === "r1",
  )!;
  state = execute(state, run);
  // Pass the outer ICE and keep the eight credits for the inner ICE.
  state = execute(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "decline_rez")!,
  );
  state = execute(
    state,
    getLegalActions(state, "runner").find((a) => a.type === "continue_run")!,
  );
  const rez = getLegalActions(state, "corp").find(
    (a) => a.type === "rez_ice" && a.source === "c2u5",
  )!;
  expect(rez.costs).toEqual([{ credits: 8 }]);
  state = execute(state, rez);
  expect(state.corp.credits).toBe(0);
  expect(state.cardInstances.c2u5?.rezzed).toBe(true);
  const replay = replayEvents(
    initial,
    state.eventLog.slice(initial.eventLog.length),
  );
  if (!replay.ok)
    throw Error("Native replay rejected the funding and rez sequence");
  expect(hashState(replay.state)).toBe(hashState(state));
});
