import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import type { AiDecisionInput, GameState, PlayerAction } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function native(key: string, runnerCredits?: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/meta-515-core-rez/${key}-native.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const state = JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/meta-515-core-rez/${key}-engine-state.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as GameState;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  expect(hashGameState(state)).toBe(cp.stateHash);
  if (runnerCredits !== undefined) state.runner.credits = runnerCredits;
  const input = next(state, cp);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  return { cp, state, input };
}
function next(
  state: GameState,
  cp: ReturnType<typeof JSON.parse>,
): AiDecisionInput {
  return buildAiDecisionInput(state, cp.input.side, {
    difficulty: cp.input.difficulty,
    profileId: cp.input.profileId,
    decisionId: `${state.matchId}:${state.stateVersion}:${cp.input.side}`,
    actionNumber: state.stateVersion + 1,
    ownDeckSnapshot: cp.input.ownDeckSnapshot,
  });
}
function decide(input: AiDecisionInput) {
  const d = chooseAiAction(input),
    pf = d.decisionDebug!.planFirstDecision!;
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).not.toBe(true);
  expect(
    input.legalActions.some(
      (a) =>
        a.actionId === d.actionId &&
        a.expiresAtStateVersion === input.playerView.stateVersion,
    ),
  ).toBe(true);
  if (pf.lane !== "engine_window")
    expect(pf.route).toMatchObject({
      actionId: d.actionId,
      stateVersion: input.playerView.stateVersion,
      stepId: pf.selectedStep!.stepId,
      planInstanceId: pf.leafExecutorInstanceId,
    });
  else {
    expect(pf.engineWindowAction?.actionId).toBe(d.actionId);
    expect(pf.executionOrigin).toMatchObject({
      side: input.side,
      stateVersion: input.playerView.stateVersion,
    });
  }
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  return { d, pf };
}
function apply(
  state: GameState,
  side: "runner" | "corp",
  actionId: string,
  selectedChoices?: PlayerAction["selectedChoices"],
) {
  const r = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  expect(r.ok).toBe(true);
  if (!r.ok) throw Error(JSON.stringify(r.error));
  return r.state;
}
afterEach(resetResidentPlanPortfolioMemory);

it.each([
  ["g17d164", 5, 2],
  ["g38d434", 4, 1],
] as const)(
  "finances positive Core and ETR together before %s's ordinary run",
  (key, knownCost, fundingGap) => {
    const { input } = native(key);
    const target = evaluateRunnerRunTargets({ input }).find(
      (e) => e.actionId === "runner.start_run.rd",
    )!;
    expect(target).toMatchObject({
      pathPassability: "blocked_unpayable",
      routeQuote: {
        reachability: "no_access",
        knownCost,
        availableCredits: 3,
        fundingGap,
      },
    });
    const { d } = decide(input);
    expect(d.actionId).not.toBe("runner.start_run.rd");
  },
);
it("keeps the native positive Core path payable while funding the following ordinary run", () => {
  const { input } = native("g17d139"),
    { d, pf } = decide(input);
  expect(
    evaluateRunnerRunTargets({ input }).find(
      (e) => e.actionId === "runner.start_run.rd",
    )!.routeQuote,
  ).toMatchObject({
    reachability: "guaranteed_access",
    knownCost: 5,
    fundingGap: 0,
  });
  expect(
    input.legalActions.find((a) => a.actionId === d.actionId),
  ).toMatchObject({
    type: "play_event",
    payload: {
      cardImplementationAbilityId:
        "onr_v1_108_score:abilities_on_play_gain_credits",
    },
  });
  expect(pf.selectedPlan?.moduleId).toBe("runner.economy");
});
it("does not charge for the native outer Mastermind's exact zero Core", () => {
  const { input } = native("g33d175");
  const zero = input.playerView.servers
    .find((s) => s.id === "rd")!
    .ice.flatMap((i) => i.effectiveRunQuote?.subroutines ?? [])
    .find((s) => s.type === "do_damage" && s.damageType === "core")!;
  expect(zero.amount).toBe(0);
  expect(
    evaluateRunnerRunTargets({ input }).find(
      (e) => e.actionId === "runner.start_run.rd",
    )!.routeQuote,
  ).toMatchObject({
    reachability: "guaranteed_access",
    knownCost: 2,
    fundingGap: 0,
  });
  const { d, pf } = decide(input);
  expect(d.actionId).toBe("runner.gain_credit");
  expect(pf.rootPlanInstanceId).toBe(
    "plan:runner.pressure_central:central%3Ard",
  );
});
it.each([
  ["g17d164", undefined, false],
  ["g17d164", 10, true],
  ["g17d139", undefined, true],
  ["g33d175", undefined, true],
] as const)(
  "executes %s's current route with credits=%s and access=%s without Core loss",
  (key, credits, expectAccess) => {
    const { cp, state: initial, input } = native(key, credits);
    let state = initial,
      first = decide(input),
      access = false,
      started = false;
    const rows: string[] = [],
      eventStart = initial.eventLog.length;
    for (let i = 0; i < 60; i++) {
      const runner = getLegalActions(state, "runner"),
        corp = getLegalActions(state, "corp");
      if (!runner.length) {
        const declines = corp.filter((a) => a.type === "decline_rez");
        expect(
          declines,
          JSON.stringify({
            phase: state.run?.phase,
            timing: state.timingPoint,
            choice: state.pendingChoice?.source,
            actions: corp.map((a) => [a.type, a.actionId]),
          }),
        ).toHaveLength(1);
        state = apply(state, "corp", declines[0]!.actionId);
        rows.push(declines[0]!.actionId);
      } else {
        const { d } = i === 0 ? first : decide(next(state, cp));
        state = apply(state, "runner", d.actionId!, d.selectedChoices);
        rows.push(d.actionId!);
      }
      started ||= Boolean(state.run);
      access ||= state.run?.phase === "access";
      if (started && (!state.run || state.winner)) break;
      if (!state.run && state.activeSide !== "runner") break;
    }
    expect(started).toBe(expectAccess);
    expect(access).toBe(expectAccess);
    if (!expectAccess) {
      expect(rows).toContain("runner.draw_card");
      expect(rows.at(-1)).toBe("runner.end_turn");
    }
    if (!state.winner) expect(state.run).toBeUndefined();
    expect(state.runner.coreDamage).toBe(initial.runner.coreDamage);
    expect(state.winner === null || state.winner === "runner").toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(eventStart));
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(state));
    if (key === "g17d164" && credits === undefined) {
      expect(rows[0]).toBe("runner.gain_credit");
    }
    if (expectAccess)
      expect(rows.some((id) => id.startsWith("runner.break_subroutine"))).toBe(
        true,
      );
  },
);
it("feeds the native Corp defense owner complete public fixed-credit post-rez quotes", () => {
  const { input, state } = native("g5d55"),
    before = hashGameState(state);
  const ice = getPlayerView(state, "corp")
    .servers.find((s) => s.id === "remote_1")!
    .ice.find((i) => i.definitionId === "onr_proteus_038_snowbank")!;
  expect(ice.effectivePostRezRunQuote).toMatchObject({
    complete: true,
    expiresAtStateVersion: state.stateVersion,
  });
  expect(hashGameState(state)).toBe(before);
  const { d, pf } = decide(input);
  expect(pf.selectedPlan?.moduleId).toBe("corp.defend_servers");
  expect(d.actionId).toContain(
    "corp.install_card.corp_onr_proteus_045_washed-up-solo-construct_2.rd.",
  );
  expect(
    apply(state, "corp", d.actionId!, d.selectedChoices).stateVersion,
  ).toBe(state.stateVersion + 1);
});
