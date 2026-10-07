import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
} from "@netgrid/engine";
import type { AiDecisionInput, GameState, PlayerAction } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { creditsToBreakVisibleSubroutinesWithBreaker } from "../../run-analysis/visible-run-breaker-path";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

function load(key: string, kind = "native") {
  return JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/meta-513-causes/${key}-${kind}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
function native(key: string) {
  const cp = load(key);
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInput = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  return { cp, input };
}
function decide(input: AiDecisionInput) {
  const d = chooseAiAction(input);
  expect(d.fallbackUsed).toBe(false);
  expect(d.timeoutUsed).not.toBe(true);
  expect(d.actionId).toBeTruthy();
  const pf = d.decisionDebug!.planFirstDecision!;
  const legal = input.legalActions.find((a) => a.actionId === d.actionId)!;
  expect(legal).toBeDefined();
  expect(legal.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  if (pf.leafExecutorInstanceId !== "rules.window_resolution") {
    expect(pf.route).toMatchObject({
      actionId: d.actionId,
      stateVersion: input.playerView.stateVersion,
      stepId: pf.selectedStep!.stepId,
      planInstanceId: pf.leafExecutorInstanceId,
    });
  } else expect(input.legalActions).toHaveLength(1);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  return { d, pf, legal };
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
  if (!r.ok) throw Error("Native Engine continuation rejected");
  return r.state;
}
afterEach(resetResidentPlanPortfolioMemory);

it("admits the native G5/D170 Lucidrine remote contest through the live DTO", () => {
  const { input } = native("g5d170");
  const { d, pf } = decide(input);
  expect(pf.selectedPlan?.moduleId).toBe("runner.contest_remote");
  expect(d.actionId).toBe(
    "runner.play_event.runner_onr_v1_098_lucidrine-booster-drug_1.remote_1.runner_onr_v1_098_lucidrine-booster-drug_1.onr_v1_098_lucidrine-booster-drug:abilities_on_play_make_run",
  );
  const route = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === d.actionId,
  )!;
  expect(route.pathPassability).toBe("reachable");
  expect(route.routeQuote?.conditionalReasons).toContain(
    "visible_random_breaker_strength",
  );
});
it("keeps the native G8/D334 hand reserve and unknown inner ICE after correcting coverage", () => {
  const { input } = native("g8d334");
  const { d, pf } = decide(input);
  expect(d.actionId).toBe("runner.gain_credit");
  expect(pf.selectedPlan?.moduleId).toBe("runner.defense_and_recovery");
  expect(pf.selectedPlan?.evidenceCodes).toContain(
    "runner_damage_locked_hand_reaction_reserve",
  );
  const route = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(route.pathPassability).toBe("reachable");
  expect(route.routeQuote?.conditionalReasons).toEqual(
    expect.arrayContaining([
      "visible_random_breaker_strength",
      "unknown_ice_on_route",
    ]),
  );
});
it("keeps the native G6/D186 real sentry gap when no Boon is installed", () => {
  const { input } = native("g6d186");
  const { d, pf } = decide(input);
  expect(d.actionId).toBe("runner.draw_card");
  expect(pf.selectedPlan?.moduleId).toBe("runner.rig_and_coverage");
  const route = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(route.pathPassability).toBe("blocked_missing_coverage");
});
it("keeps G23/D288 bank cashout but binds it to the newly admitted exact run", () => {
  const { input } = native("g23d288");
  const { d, pf } = decide(input);
  expect(d.actionId).toContain(
    "broker_1.activated.onr_v1_154_broker:withdraw_credits",
  );
  expect(pf.selectedPlan?.moduleId).toBe("runner.credit_bank");
  expect(
    pf.selectedPlan?.evidenceCodes.some((x) =>
      x.startsWith("runner_credit_bank_bound_run_action:"),
    ),
  ).toBe(true);
  const route = evaluateRunnerRunTargets({ input }).find(
    (t) => t.actionId === "runner.start_run.remote_1",
  )!;
  expect(route.pathPassability).toBe("reachable");
  expect(route.routeQuote?.conditionalReasons).toContain(
    "unknown_ice_on_route",
  );
});
it("executes the actual G5 run through current Engine actions without restoring subsequent memory", () => {
  const { cp, input } = native("g5d170");
  let state = load("g5d170", "engine-state") as GameState;
  expect(hashGameState(state)).toBe(cp.stateHash);
  const first = decide(input);
  state = apply(state, "runner", first.d.actionId!, first.d.selectedChoices);
  let steps = 1;
  while (state.run && steps < 35) {
    const actions = getLegalActions(state, "runner");
    if (actions.length) {
      const next = buildAiDecisionInput(state, "runner", {
        difficulty: cp.input.difficulty,
        profileId: cp.input.profileId,
        decisionId: `${state.matchId}:${state.stateVersion}:runner`,
        actionNumber: state.stateVersion + 1,
        ownDeckSnapshot: cp.input.ownDeckSnapshot,
      });
      const { d } = decide(next);
      state = apply(state, "runner", d.actionId!, d.selectedChoices);
    } else {
      const corp = getLegalActions(state, "corp");
      expect(corp).toHaveLength(1);
      expect(corp[0]!.type).toBe("decline_rez");
      state = apply(state, "corp", corp[0]!.actionId);
    }
    steps++;
  }
  expect(state.run).toBeUndefined();
  expect(getPlayerView(state, "runner").own.agendaPoints).toBe(3);
  expect(state.runner.credits).toBe(6);
  expect(state.runner.grip).toHaveLength(2);
});
it("allowlists the Engine's unresolved state without synthesizing numeric strength", () => {
  const cp = load("g5d170"),
    card = cp.input.playerView.own.rig.find(
      (c: { definitionId: string }) => c.definitionId === "onr_v1_002_ai-boon",
    );
  card.randomRunStrengthState.secret = "discard-me";
  const input = buildAiDecisionInputDto(cp.input),
    boon = input.playerView.own.rig!.find(
      (c) => c.instanceId === card.instanceId,
    )!;
  expect(boon.randomRunStrengthState).toEqual({ status: "unresolved" });
  expect(boon.strength).toBeUndefined();
  expect(boon.randomRunStrengthState).not.toBe(card.randomRunStrengthState);
  expect(buildAiDecisionInputDto(input).playerView).toEqual(input.playerView);
});
it("preserves the actual seeded Engine strength after the first native run action", () => {
  const cp = load("g5d170");
  let state = load("g5d170", "engine-state") as GameState;
  state = apply(
    state,
    "runner",
    "runner.play_event.runner_onr_v1_098_lucidrine-booster-drug_1.remote_1.runner_onr_v1_098_lucidrine-booster-drug_1.onr_v1_098_lucidrine-booster-drug:abilities_on_play_make_run",
  );
  const view = getPlayerView(state, "runner"),
    original = view.own.rig!.find(
      (c) => c.definitionId === "onr_v1_002_ai-boon",
    )!;
  expect(original.randomRunStrengthState?.status).toBe("resolved");
  const dto = buildAiDecisionInputDto({
    ...cp.input,
    playerView: view,
    legalActions: getLegalActions(state, "runner"),
  });
  expect(
    dto.playerView.own.rig!.find((c) => c.instanceId === original.instanceId)!
      .randomRunStrengthState,
  ).toEqual(original.randomRunStrengthState);
});
it("strips an unknown card's random-state data without exposing or validating it", () => {
  const cp = load("g5d170"),
    card = cp.input.playerView.own.rig.find(
      (c: { definitionId: string }) => c.definitionId === "onr_v1_002_ai-boon",
    );
  card.known = false;
  card.randomRunStrengthState = { status: "secret", secret: "hidden" };
  const input = buildAiDecisionInputDto(cp.input);
  expect(
    input.playerView.own.rig!.find((c) => c.instanceId === card.instanceId)!
      .randomRunStrengthState,
  ).toBeUndefined();
});
it.each([
  ["resolved", 2.5, 0, 2.5],
  ["resolved", 2, 1, 2],
  ["resolved", -1, 0, -1],
  ["unsupported", 2, 0, 2],
])(
  "fails closed on malformed known random state %s/%s/%s/%s",
  (status, actualStrength, currentStrengthAdjustment, strength) => {
    const cp = load("g5d170"),
      card = cp.input.playerView.own.rig.find(
        (c: { definitionId: string }) =>
          c.definitionId === "onr_v1_002_ai-boon",
      );
    card.randomRunStrengthState = {
      status,
      actualStrength,
      currentStrengthAdjustment,
    };
    card.strength = strength;
    expect(() => buildAiDecisionInputDto(cp.input)).toThrow(
      /Invalid public run-start random breaker strength/,
    );
  },
);

it("continues native G32 Shock with the exact legal Boon pump instead of accepting the next-ICE lock", () => {
  const { input } = native("g32d305");
  const { d, pf } = decide(input);
  expect(pf.selectedPlan?.moduleId).toBe("runner.convert_run_window");
  expect(d.actionId).toBe(
    "runner.pump_breaker.runner_onr_v1_002_ai-boon_2.runner_onr_v1_002_ai-boon_2.runner_onr_v1_002_ai-boon_2.corp_onr_v1_268_shock-r_1.onr_v1_002_ai-boon:icebreaker_abilities_increase_strength",
  );
});
it("quotes a hypothetical pumped resolved breaker without mutating its current public state", () => {
  const { input } = native("g32d305");
  const boon = input.playerView.own.rig!.find(
    (c) => c.definitionId === "onr_v1_002_ai-boon",
  )!;
  const before = structuredClone(boon);
  const ice = input.playerView.run!.encounteredIce!;
  const result = creditsToBreakVisibleSubroutinesWithBreaker(
    boon,
    ice,
    ice.effectiveRunQuote!.subroutines,
    3,
  );
  expect(result?.cost).toBe(1);
  expect(boon).toEqual(before);
});
it("executes the native G32 pump, break and remaining run through the current Engine", () => {
  const { cp, input } = native("g32d305");
  let state = load("g32d305", "engine-state") as GameState;
  expect(hashGameState(state)).toBe(cp.stateHash);
  const first = decide(input);
  state = apply(state, "runner", first.d.actionId!, first.d.selectedChoices);
  let steps = 1;
  while (state.run && steps < 35) {
    const actions = getLegalActions(state, "runner");
    if (actions.length) {
      const next = buildAiDecisionInput(state, "runner", {
        difficulty: cp.input.difficulty,
        profileId: cp.input.profileId,
        decisionId: state.matchId + ":" + state.stateVersion + ":runner",
        actionNumber: state.stateVersion + 1,
        ownDeckSnapshot: cp.input.ownDeckSnapshot,
      });
      const { d } = decide(next);
      state = apply(state, "runner", d.actionId!, d.selectedChoices);
    } else {
      const corp = getLegalActions(state, "corp");
      if (corp.length === 1) {
        expect(corp[0]!.type).toBe("decline_rez");
        state = apply(state, "corp", corp[0]!.actionId);
      } else {
        const originalRezId =
          "corp.rez_ice.corp_onr_v1_279_wall-of-static_2.corp_onr_v1_279_wall-of-static_2";
        expect(corp).toHaveLength(2);
        expect(corp.filter((a) => a.type === "decline_rez")).toHaveLength(1);
        expect(corp.find((a) => a.actionId === originalRezId)?.type).toBe(
          "rez_ice",
        );
        state = apply(state, "corp", originalRezId);
      }
    }
    steps++;
  }
  expect(steps).toBeLessThan(35);
  expect(state.run).toBeUndefined();
  expect(getPlayerView(state, "runner").own.agendaPoints).toBe(3);
  expect(steps).toBe(10);
  expect(state.runner.credits).toBe(19);
  expect(state.runner.grip).toHaveLength(11);
  expect(getPlayerView(state, "runner").own.coreDamage).toBe(2);
});

it("preserves signed public adjustments, including a negative visible strength", () => {
  const cp = load("g32d305"),
    card = cp.input.playerView.own.rig.find(
      (c: { definitionId: string }) => c.definitionId === "onr_v1_002_ai-boon",
    );
  card.randomRunStrengthState = {
    status: "resolved",
    actualStrength: 2,
    currentStrengthAdjustment: -3,
  };
  card.strength = -1;
  const dto = buildAiDecisionInputDto(cp.input);
  expect(
    dto.playerView.own.rig!.find((c) => c.instanceId === card.instanceId)!
      .randomRunStrengthState,
  ).toEqual(card.randomRunStrengthState);
});
it("preserves only the public opponent Rig random-strength fact in the Corp DTO", () => {
  const cp = load("g32d305"),
    state = load("g32d305", "engine-state") as GameState;
  const view = getPlayerView(state, "corp");
  const dto = buildAiDecisionInputDto({
    ...cp.input,
    side: "corp",
    playerView: view,
    legalActions: getLegalActions(state, "corp"),
  });
  const source = view.opponent.rig!.find(
    (c) => c.definitionId === "onr_v1_002_ai-boon",
  )!;
  expect(
    dto.playerView.opponent.rig!.find(
      (c) => c.instanceId === source.instanceId,
    )!.randomRunStrengthState,
  ).toEqual(source.randomRunStrengthState);
  expect(dto.playerView.opponent).not.toHaveProperty("gripOrHq");
});
it("rejects an inconsistent original resolved fact before deriving the hypothetical pump", () => {
  const { input } = native("g32d305");
  const boon = input.playerView.own.rig!.find(
    (c) => c.definitionId === "onr_v1_002_ai-boon",
  )!;
  boon.randomRunStrengthState = {
    status: "resolved",
    actualStrength: 2,
    currentStrengthAdjustment: 1,
  };
  const ice = input.playerView.run!.encounteredIce!;
  expect(() =>
    creditsToBreakVisibleSubroutinesWithBreaker(
      boon,
      ice,
      ice.effectiveRunQuote!.subroutines,
      3,
    ),
  ).toThrow(/Invalid current public random breaker strength/);
});
