import { readFileSync } from "node:fs";
import {
  applyAction,
  createGame,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState, PlayerAction, Side } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDeckStrategyDeckSnapshot } from "../../deck-strategy-snapshot";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { releaseAiMatchRuntime } from "../../runtime/match-runtime-memory";
import { simulationEngineRuntimeOptions } from "../../simulation/engine-selection";
import { assertAiInputIsSideSafe } from "../../simulation/side-safe-input";

type Command = [Side, string, PlayerAction["selectedChoices"]?];
type Position = { matchId: string; seed: string; stateHash: string };

const campaign = JSON.parse(
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
  scenarios: (Position & { commands: Command[] })[];
};
const checkpoint = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/meta846-first-advance-timing.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as Position & { commandsAfterCampaign: Command[] };

afterEach(() => releaseAiMatchRuntime(checkpoint.matchId));

function execute(state: GameState, [side, actionId, selectedChoices]: Command) {
  const result = applyAction(
    state,
    {
      matchId: state.matchId,
      side,
      clientKnownStateVersion: state.stateVersion,
      actionId,
      ...(selectedChoices ? { selectedChoices } : {}),
    },
    { publicEventsMode: "latest" },
  );
  if (!result.ok) throw Error(result.error.code);
  return result.state;
}

function position() {
  const prefix = campaign.scenarios.find(
    (entry) =>
      entry.matchId === checkpoint.matchId && entry.seed === checkpoint.seed,
  )!;
  const initial = createGame({
    ...campaign.setup,
    matchId: checkpoint.matchId,
    seed: checkpoint.seed,
  });
  const campaignState = prefix.commands.reduce(execute, initial);
  expect(hashState(campaignState)).toBe(prefix.stateHash);
  const state = checkpoint.commandsAfterCampaign.reduce(execute, campaignState);
  expect(hashState(state)).toBe(checkpoint.stateHash);
  return { initial, state };
}

function decide(state: GameState) {
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: campaign.corpSnapshot,
  });
  expect(assertAiInputIsSideSafe(input)).toBe(true);
  const decision = chooseAiAction(input, simulationEngineRuntimeOptions(state));
  expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  return {
    input,
    action: input.legalActions.find((a) => a.actionId === decision.actionId)!,
    trace: decision.decisionDebug!.planFirstDecision!,
    portfolio: residentPlanPortfolioSnapshot(input)!,
  };
}

it("uses the last click to fund a quoted rez for the installed score campaign", () => {
  const { initial, state } = position();
  const { input, action, trace, portfolio } = decide(state);
  expect(input.playerView.own.corpFutureFlexibleClicks).toEqual([3, 3]);
  expect(input.legalActions).toContainEqual(
    expect.objectContaining({ type: "advance_card", source: "c2h2" }),
  );
  expect(action).toMatchObject({
    type: "gain_credit",
    expiresAtStateVersion: state.stateVersion,
  });
  expect(trace.selectedPlan).toMatchObject({
    moduleId: "corp.economy",
    parentNeedId: "score-support:agenda:c2h2:r1",
    evidenceCodes: [
      "corp_first_advance_waits_for_rez_reserve:c2s5:2:score_turn_plus_2",
    ],
  });
  expect(portfolio.instances).toContainEqual(
    expect.objectContaining({
      instanceId: trace.selectedPlan!.parentInstanceId,
      moduleId: "corp.score_agenda",
    }),
  );
  const after = execute(state, ["corp", action.actionId]);
  expect(after.corp.credits).toBe(7);
  expect(after.cardInstances.c2h2!.advancementCounters).toBe(0);
  const replay = replayEvents(initial, after.eventLog);
  expect(replay.ok && hashState(replay.state)).toBe(hashState(after));
});

it("keeps the first advance when it opens the next Corp turn for scoring", () => {
  const { state } = position();
  state.actionEconomy = {
    ...state.actionEconomy,
    futureGrants: [
      {
        side: "corp",
        sourceCardInstanceId: "c2h2",
        sourceDefinitionId: 400,
        remainingTurns: 1,
        amountPerTurn: 1,
      },
    ],
  };
  const { input, action } = decide(state);
  expect(input.playerView.own.corpFutureFlexibleClicks).toEqual([4, 3]);
  expect(action).toMatchObject({ type: "advance_card", source: "c2h2" });
});

it("does not open a score funding need when the installed rez is already funded", () => {
  const { state } = position();
  state.corp.credits = 7;
  const { input, portfolio } = decide(state);
  expect(input.legalActions).toContainEqual(
    expect.objectContaining({ type: "advance_card", source: "c2h2" }),
  );
  expect(
    portfolio.instances.some(
      (instance) => instance.dedupeKey === "score-support:agenda:c2h2:r1",
    ),
  ).toBe(false);
});

it("leaves an agenda at Runner match point to the existing survival assessment", () => {
  const { state } = position();
  state.agendaPointsToWin = 6;
  const { trace, portfolio } = decide(state);
  expect(trace.selectedPlan?.evidenceCodes?.join(" ")).not.toContain(
    "corp_first_advance_waits_for_rez_reserve",
  );
  expect(
    portfolio.instances.some(
      (instance) => instance.dedupeKey === "score-support:agenda:c2h2:r1",
    ),
  ).toBe(false);
});
