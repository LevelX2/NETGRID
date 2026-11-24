import { readFileSync } from "node:fs";
import {
  applyAction,
  createGame,
  getLegalActions,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState, PlayerAction, Side } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDeckStrategyDeckSnapshot } from "../../deck-strategy-snapshot";
import type { ScoreState } from "../../plans/corp-core-plan-contracts";
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
  setup: NonNullable<Parameters<typeof createGame>[0]>;
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
) as Position & {
  commandsAfterCampaign: Command[];
  commandsToNextCorpMain: Command[];
};

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

function position(agendaPointsToWin = campaign.setup.agendaPointsToWin) {
  const prefix = campaign.scenarios.find(
    (entry) =>
      entry.matchId === checkpoint.matchId && entry.seed === checkpoint.seed,
  )!;
  const initial = createGame({
    ...campaign.setup,
    ...(agendaPointsToWin !== undefined ? { agendaPointsToWin } : {}),
    matchId: checkpoint.matchId,
    seed: checkpoint.seed,
  });
  const campaignState = prefix.commands.reduce(execute, initial);
  if (agendaPointsToWin === campaign.setup.agendaPointsToWin)
    expect(hashState(campaignState)).toBe(prefix.stateHash);
  const state = checkpoint.commandsAfterCampaign.reduce(execute, campaignState);
  if (agendaPointsToWin === campaign.setup.agendaPointsToWin)
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
    selectedChoices: decision.selectedChoices,
    trace: decision.decisionDebug!.planFirstDecision!,
    portfolio: residentPlanPortfolioSnapshot(input)!,
  };
}

it("uses the last click to fund a quoted rez for the installed score campaign", () => {
  const { initial, state } = position(9);
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
  const { state } = position(9);
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
  const { state } = position(9);
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
  const { state } = position(6);
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

it("keeps the first advance in original seed 8 while HQ is a terminal target", () => {
  const { state } = position();
  const { action, portfolio } = decide(state);
  expect(action).toMatchObject({ type: "advance_card", source: "c2h2" });
  expect(
    portfolio.campaigns?.some((entry) => entry.deferredAdvanceWindow),
  ).toBe(false);
});

function firstCorpTurnAfterDeferral(takeCredit = true) {
  const { state, initial } = position(9);
  const { action, portfolio, input } = decide(state);
  expect(action.type).toBe("gain_credit");
  expect(portfolio.campaigns).toContainEqual(
    expect.objectContaining({
      origin: expect.objectContaining({ targetCardInstanceId: "c2h2" }),
      deferredAdvanceWindow: expect.objectContaining({
        selectedAtStateVersion: state.stateVersion,
        scoreByTurnSerial: 28,
      }),
    }),
  );
  const chosen = takeCredit
    ? action
    : input.legalActions.find(
        (entry) => entry.type === "advance_card" && entry.source === "c2h2",
      )!;
  return {
    initial,
    state: checkpoint.commandsToNextCorpMain.reduce(
      execute,
      execute(state, ["corp", chosen.actionId]),
    ),
  };
}

const cfoProject = (portfolio: ReturnType<typeof decide>["portfolio"]) =>
  (
    portfolio.instances.find(
      (entry) =>
        entry.moduleId === "corp.score_agenda" &&
        entry.dedupeKey === "agenda:c2h2:r1",
    )?.moduleState as ScoreState | undefined
  )?.signal;

it("keeps two Advances due and scores on the deadline after a quiet Runner turn", () => {
  const { initial, state } = firstCorpTurnAfterDeferral();
  let current = state;
  expect(current.turnSerial).toBe(26);
  for (const advancesDue of [2, 1]) {
    const { action, portfolio, trace } = decide(current);
    expect(action).toMatchObject({
      type: "advance_card",
      source: "c2h2",
      expiresAtStateVersion: current.stateVersion,
    });
    expect(trace.selectedPlan).toMatchObject({ moduleId: "corp.score_agenda" });
    expect(cfoProject(portfolio)).toMatchObject({
      deferredAdvanceBudget: { advancesDue, requiredCredits: 5 + advancesDue },
      fundingMilestone: {
        basis: { kind: "score_deferred_advance_floor" },
        targetCredits: 5 + advancesDue,
        priorityClass: "P3",
      },
    });
    current = execute(current, ["corp", action.actionId]);
  }
  expect(cfoProject(decide(current).portfolio)?.deferredAdvanceBudget).toEqual({
    advancesDue: 0,
    requiredCredits: 5,
  });
  expect(current.cardInstances.c2h2!.advancementCounters).toBe(2);
  expect(current.corp.clicks).toBe(1);

  const spareClick = getLegalActions(current, "corp").find(
    (action) => action.type === "gain_credit",
  )!;
  current = execute(current, ["corp", spareClick.actionId]);
  const corpEnd = getLegalActions(current, "corp").find(
    (action) => action.type === "end_turn",
  )!;
  current = execute(current, ["corp", corpEnd.actionId]);
  if (current.pendingChoice?.side === "corp") {
    const { action, selectedChoices } = decide(current);
    current = execute(current, ["corp", action.actionId, selectedChoices]);
  }
  const runnerEnd = getLegalActions(current, "runner").find(
    (action) => action.type === "end_turn",
  )!;
  current = execute(current, ["runner", runnerEnd.actionId]);
  const mandatoryDraw = getLegalActions(current, "corp").find(
    (action) => action.type === "mandatory_draw",
  )!;
  current = execute(current, ["corp", mandatoryDraw.actionId]);
  expect(current.turnSerial).toBe(28);

  for (const type of [
    "advance_card",
    "advance_card",
    "advance_card",
    "score_agenda",
  ]) {
    const { action, trace } = decide(current);
    expect(action).toMatchObject({ type, source: "c2h2" });
    expect(trace.selectedPlan).toMatchObject({ moduleId: "corp.score_agenda" });
    current = execute(current, ["corp", action.actionId]);
  }
  expect(current.corp.scoreArea).toContain("c2h2");
  const replay = replayEvents(initial, current.eventLog);
  expect(replay.ok && hashState(replay.state)).toBe(hashState(current));
});

it("allows terminal central defense to preempt the deferred advancement at revalidation", () => {
  const { state } = firstCorpTurnAfterDeferral();
  state.agendaPointsToWin = 7;
  const { action, portfolio, trace } = decide(state);
  expect(action).toMatchObject({
    type: "install_card",
    payload: { serverId: "hq" },
  });
  expect(trace.selectedPlan).toMatchObject({ moduleId: "corp.defend_servers" });
  expect(cfoProject(portfolio)?.deferredAdvanceBudget).toBeUndefined();
});

it("requires the actual credit receipt before reserving the follow-up", () => {
  const { state } = firstCorpTurnAfterDeferral(false);
  expect(
    cfoProject(decide(state).portfolio)?.deferredAdvanceBudget,
  ).toBeUndefined();
});
