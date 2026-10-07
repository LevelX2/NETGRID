import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import type { AiDecisionInput, GameState } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { corpScoreProjectHasCurrentProtectionRequote } from "../../corp/score/score-protection-needs";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";

function load(key: string, kind: string) {
  return JSON.parse(
    readFileSync(
      new URL(
        `./fixtures/meta-512-causes/${key}-${kind}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
function source(key: string, alter?: (state: GameState) => void) {
  const cp = load(key, "native");
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const state = load(key, "engine-state") as GameState;
  expect(hashGameState(state)).toBe(cp.stateHash);
  alter?.(state);
  const current = {
    ...cp.input,
    playerView: getPlayerView(state, cp.actor),
    legalActions: getLegalActions(state, cp.actor),
  };
  const input: AiDecisionInput = {
    ...current,
    ...buildAiDecisionInputDto(current),
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  return { cp, state, input };
}
function decide(input: AiDecisionInput, state: GameState) {
  const decision = chooseAiAction(input, {
    quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
  });
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).not.toBe(true);
  if (!decision.actionId)
    throw new Error("native decision must select an action");
  const pf = decision.decisionDebug!.planFirstDecision!;
  if (pf.leafExecutorInstanceId === "rules.window_resolution") {
    expect(input.legalActions).toHaveLength(1);
    expect(decision.reasonCode).toBe("plan_first.engine_window");
    expect(pf.selectedStep!.stepId).toBe(
      `${input.playerView.timingPoint}:${state.stateVersion}`,
    );
  } else {
    expect(pf.route).toMatchObject({
      actionId: decision.actionId,
      stateVersion: state.stateVersion,
      stepId: pf.selectedStep!.stepId,
      planInstanceId: pf.leafExecutorInstanceId,
    });
  }
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId)
      ?.expiresAtStateVersion,
  ).toBe(state.stateVersion);
  return { decision: { ...decision, actionId: decision.actionId }, pf };
}
function take(state: GameState, side: "runner" | "corp", actionId: string) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("exact native Engine transition rejected");
  return result.state;
}
function liveInput(state: GameState, cp: ReturnType<typeof load>) {
  return buildAiDecisionInput(state, cp.actor, {
    difficulty: cp.input.difficulty,
    profileId: cp.input.profileId,
    decisionId: `${state.matchId}:${state.stateVersion}:${cp.actor}`,
    actionNumber: state.stateVersion + 1,
    ownDeckSnapshot: cp.input.ownDeckSnapshot,
  });
}
afterEach(resetResidentPlanPortfolioMemory);

it.each([
  ["g11d190", 9, 10, 5],
  ["g15d272", 9, 22, 9],
  ["g20d302", 9, 5, 4],
  ["g22d446", 14, 7, 10],
] as const)(
  "ranks and executes the complete mixed encounter at native %s without resetting subsequent memory",
  (key, steps, credits, hand) => {
    const r = source(key);
    let state = r.state;
    for (let i = 0; i < steps; i++) {
      const input = i === 0 ? r.input : liveInput(state, r.cp);
      const { decision, pf } = decide(input, state);
      if (i < steps - 1 || input.legalActions.length > 1)
        expect(pf.selectedPlan?.moduleId).toBe("runner.convert_run_window");
      else expect(pf.leafExecutorInstanceId).toBe("rules.window_resolution");
      if (i < steps - 1)
        expect(decision.actionId).toContain("runner_onr_v1_074_worm_1");
      else
        expect(
          input.legalActions.find((a) => a.actionId === decision.actionId)
            ?.type,
        ).toBe("continue_run");
      state = take(state, "runner", decision.actionId);
    }
    expect(state.run?.phase).toBe("movement");
    expect(state.runner.credits).toBe(credits);
    expect(state.runner.grip).toHaveLength(hand);
  },
);
function sixActualKrashPumps(state: GameState) {
  for (let i = 0; i < 6; i++)
    state = take(
      state,
      "runner",
      getLegalActions(state, "runner").find(
        (a) =>
          a.type === "pump_breaker" && a.source === "runner_onr_v1_039_krash_1",
      )!.actionId,
    );
  return state;
}
it("keeps actually cheaper already-pumped Krash", () => {
  const original = source("g11d190");
  const pumped = sixActualKrashPumps(original.state);
  const r = source("g11d190", (state) => Object.assign(state, pumped));
  expect(decide(r.input, r.state).decision.actionId).toContain(
    "break_subroutine.runner_onr_v1_039_krash_1",
  );
});
it("retains partial Safety mitigation when the whole encounter cannot be funded", () => {
  const original = source("g11d190");
  const pumped = sixActualKrashPumps(original.state);
  pumped.runner.credits = 4;
  const r = source("g11d190", (state) => Object.assign(state, pumped));
  expect(decide(r.input, r.state).decision.actionId).toContain(
    "break_subroutine.runner_onr_v1_039_krash_1",
  );
});
it("keeps the cheaper nominal full route when run-only credits fund both", () => {
  const r = source("g11d190", (state) => {
    state.run!.badPublicityCredits = 20;
  });
  expect(decide(r.input, r.state).decision.actionId).toContain(
    "pump_breaker.runner_onr_v1_074_worm_1",
  );
});
it("does not invent a whole mixed encounter when even Worm cannot be funded", () => {
  const r = source("g11d190", (state) => {
    state.runner.credits = 10;
  });
  expect(decide(r.input, r.state).decision.actionId).toContain(
    "runner.continue_run.",
  );
});
const permanent =
  "corp.rez_ice.corp_onr_v1_238_data-wall-2-0_1.corp_onr_v1_238_data-wall-2-0_1";
const temporary =
  "corp.rez_ice.corp_onr_v1_238_data-wall-2-0_1.hq.corp_onr_v1_238_data-wall-2-0_1.corp_onr_v1_363_olivia-salazar_1";
it("values same-ICE paid rez lifetime and actually preserves it over three Engine runs", () => {
  const r = source("g18d13"),
    { decision, pf } = decide(r.input, r.state);
  expect(pf.selectedPlan?.moduleId).toBe("corp.defend_servers");
  expect(decision.actionId).toBe(permanent);
  let state = take(r.state, "corp", decision.actionId);
  for (let i = 0; i < 3; i++) {
    if (i > 0) state = take(state, "runner", "runner.start_run.hq");
    state = take(
      state,
      "runner",
      "runner.continue_run.printed_subroutines_end_the_run",
    );
    expect(state.run).toBeUndefined();
  }
  expect(state.corp.credits).toBe(3);
  expect(state.runner.clicks).toBe(0);
});
it.each(["only-one-credit", "last-current-run"])(
  "retains the admitted temporary route at %s",
  (name) => {
    const r = source("g18d13", (state) => {
      if (name === "only-one-credit") state.corp.credits = 1;
      else state.runner.clicks = 0;
    });
    expect(decide(r.input, r.state).decision.actionId).toBe(temporary);
  },
);
it("preserves the same generic paid lifetime for the three currently funded Quandary runs in G38", () => {
  const r = source("g38d46"),
    { decision, pf } = decide(r.input, r.state);
  expect(pf.selectedPlan?.moduleId).toBe("corp.defend_servers");
  expect(decision.actionId).toBe(
    "corp.rez_ice.corp_onr_v1_261_quandary_2.corp_onr_v1_261_quandary_2",
  );
  let state = take(r.state, "corp", decision.actionId);
  for (let i = 0; i < 3; i++) {
    if (i > 0) state = take(state, "runner", "runner.start_run.rd");
    state = take(
      state,
      "runner",
      "runner.continue_run.printed_subroutines_end_the_run",
    );
    expect(state.run).toBeUndefined();
  }
  expect(state.corp.credits).toBe(6);
  expect(state.runner.clicks).toBe(0);
});
it("retains an actually free temporary Data Wall activation at G22", () => {
  const r = source("g22d10"),
    { decision } = decide(r.input, r.state);
  expect(decision.actionId).toBe(
    "corp.rez_ice.corp_onr_v1_237_data-wall_3.rd.corp_onr_v1_237_data-wall_3.corp_onr_v1_363_olivia-salazar_1",
  );
  expect(take(r.state, "corp", decision.actionId).corp.credits).toBe(
    r.state.corp.credits,
  );
});
it("revalidates the mature fort after the real mandatory draw without clearing the resident portfolio", () => {
  const r = source("g23d400"),
    first = decide(r.input, r.state);
  expect(first.decision.actionId).toBe("corp.mandatory_draw");
  const state = take(r.state, "corp", first.decision.actionId),
    next = load("g23d401", "native");
  expect(hashGameState(state)).toBe(next.stateHash);
  const input = { ...next.input, ...buildAiDecisionInputDto(next.input) };
  const second = decide(input, state);
  expect(second.pf.selectedPlan?.moduleId).toBe("corp.score_agenda");
  expect(second.decision.actionId).toContain(".remote_1.");
  expect(second.decision.actionId).not.toContain(".new_remote.");
  take(state, "corp", second.decision.actionId);
  const project = residentPlanPortfolioSnapshot(input)!
    .instances.filter((i) => i.moduleId === "corp.score_agenda")
    .map((i) => (i.moduleState as { signal: CorpScoreProjectSignal }).signal)
    .find((p) => p.serverId === "remote_1" && p.scoreHorizonCertification)!;
  expect(project).toBeDefined();
  expect(corpScoreProjectHasCurrentProtectionRequote(input, project)).toBe(
    true,
  );
  const stale = structuredClone(project);
  stale.scoreHorizonCertification = {
    ...stale.scoreHorizonCertification!,
    observedAtStateVersion: state.stateVersion - 1,
  };
  expect(corpScoreProjectHasCurrentProtectionRequote(input, stale)).toBe(false);
  const wrongServer = structuredClone(project);
  wrongServer.scoreHorizonCertification = {
    ...wrongServer.scoreHorizonCertification!,
    serverId: "remote_2",
  };
  expect(corpScoreProjectHasCurrentProtectionRequote(input, wrongServer)).toBe(
    false,
  );
  const duplicateLayer = structuredClone(project);
  duplicateLayer.scoreHorizonCertification = {
    ...duplicateLayer.scoreHorizonCertification!,
    layerInstanceIds: [
      "corp_onr_v1_278_wall-of-ice_1",
      "corp_onr_v1_278_wall-of-ice_1",
    ],
  };
  expect(
    corpScoreProjectHasCurrentProtectionRequote(input, duplicateLayer),
  ).toBe(false);
  const exposed = structuredClone(project);
  if (exposed.protectionNeed!.baseline.knowledge !== "known")
    throw new Error("known native baseline required");
  exposed.protectionNeed = {
    ...exposed.protectionNeed!,
    baseline: {
      ...exposed.protectionNeed!.baseline,
      protection: {
        ...exposed.protectionNeed!.baseline.protection,
        runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
        protectsScore: false,
      },
    },
  };
  expect(corpScoreProjectHasCurrentProtectionRequote(input, exposed)).toBe(
    false,
  );
  const poor = structuredClone(input);
  poor.playerView.own.credits = 0;
  expect(corpScoreProjectHasCurrentProtectionRequote(poor, project)).toBe(
    false,
  );
  const agendaPayment = structuredClone(project);
  agendaPayment.scoreHorizonCertification = {
    ...agendaPayment.scoreHorizonCertification!,
    requiredAgendaPoints: 1,
  };
  expect(
    corpScoreProjectHasCurrentProtectionRequote(input, agendaPayment),
  ).toBe(false);
});
