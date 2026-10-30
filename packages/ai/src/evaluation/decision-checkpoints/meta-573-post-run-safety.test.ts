import { runnerPostRunSelfTagHandSafety } from "../../run-analysis/runner-self-tag-safety";
import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { currentRunAbortAssessment } from "../../runner/run-window/run-window-assessment";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
afterEach(resetResidentPlanPortfolioMemory);
function fixture(name = "g11-d91") {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta573-r4-" +
          name +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  return f;
}
function decide(f: ReturnType<typeof fixture>) {
  const i = f.input;
  i.planningStateIdentity = buildPlanningStateIdentity(i);
  restoreAiRuntimeCheckpoint(i, i.ownDeckSnapshot!.deckSnapshotId, f.runtime);
  const before = JSON.stringify(i),
    d = chooseAiAction(i);
  expect(JSON.stringify(i)).toBe(before);
  expect(d).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(
    i.legalActions.find((a) => a.actionId === d.actionId)
      ?.expiresAtStateVersion,
  ).toBe(i.playerView.stateVersion);
  return d;
}
function shipping(i: AiDecisionInputWithDeckCapabilities) {
  return evaluateRunnerRunTargets({ input: i }).find((t) =>
    t.runActionProjection.riskSignals.includes("tag_self:successful_run"),
  )!;
}
it("aborts the native central access with one card after public Data Darts damage", () => {
  const f = fixture("g14-d12"),
    d = decide(f);
  expect(d.actionId).toBe("runner.jack_out");
  expect(d.decisionDebug?.planFirstDecision?.leafExecutorInstanceId).toContain(
    "runner.convert_run_window",
  );
  expect(d.evidence?.join("|")).toContain(
    "runner_critical_low_grip_unknown_central_access_requires_jack_out",
  );
});
it("does not spend the native final click on a self-tag event leaving less than the confirmed hand floor", () => {
  const f = fixture(),
    t = shipping(f.input);
  expect(t.pathPassability).toBe("blocked_by_visible_damage_hand_buffer");
  expect(t.evidence.join("|")).toContain(
    "runner_post_run_self_tag_hand_buffer_unrecoverable",
  );
  const d = decide(f);
  expect(d.actionId).not.toBe(t.actionId);
});
it("keeps the ordinary HQ run separate from the self-tag route", () => {
  const f = fixture();
  expect(
    evaluateRunnerRunTargets({ input: f.input }).find(
      (t) => t.actionId === "runner.start_run.hq",
    )!.pathPassability,
  ).toBe("reachable");
});
it("retains the self-tag run with a surviving hand floor", () => {
  const f = fixture();
  f.input.playerView.own.gripOrHq.push({
    ...f.input.playerView.own.gripOrHq[0]!,
    instanceId: "owned-additional-buffer",
  });
  expect(shipping(f.input).pathPassability).toBe("reachable");
});
it("does not treat the observed punish card as still secretly guaranteed in HQ", () => {
  const f = fixture();
  f.input.playerView.publicEvents = [];
  f.input.eventTail = [];
  f.input.playerView.servers = [];
  expect(shipping(f.input).pathPassability).not.toBe(
    "blocked_by_visible_damage_hand_buffer",
  );
});
it("retains same-turn tag cleanup when the event leaves a click and its success pays for removal", () => {
  const f = fixture();
  f.input.playerView.own.clicks = 2;
  expect(shipping(f.input).pathPassability).toBe("reachable");
});
it("preserves a bound known agenda and a larger hand in the native central abort assessment", () => {
  const f = fixture("g14-d12");
  expect(
    currentRunAbortAssessment(f.input, {
      purpose: "contest",
      accessCommitment: {
        payoff: "agenda",
        intendedAction: "steal",
        knownTargetDefinitionIds: [],
        trashBudget: "unknown",
        evidenceCode: "bound-current-agenda",
      },
    }),
  ).toBeUndefined();
  f.input.playerView.own.gripOrHq.push({
    ...f.input.playerView.own.gripOrHq[0]!,
    instanceId: "owned-buffer",
  });
  expect(currentRunAbortAssessment(f.input, undefined)).toBeUndefined();
});

it("retains a current installed free tag-avoidance source", () => {
  const f = fixture();
  (f.input.playerView.own.rig ??= []).push({
    instanceId: "owned-free-tag-avoidance",
    definitionId: "onr_v1_161_fall-guy",
    known: true,
    rezzed: true,
    type: "resource",
    title: "Fall Guy",
  });
  expect(shipping(f.input).pathPassability).toBe("reachable");
});
it("projects the exact successful-run tag amount without transferring it to basic runs", () => {
  const f = fixture(),
    ts = evaluateRunnerRunTargets({ input: f.input });
  expect(shipping(f.input).runActionProjection.successfulRunSelfTags).toBe(1);
  expect(
    ts.find((t) => t.actionId === "runner.start_run.hq")!.runActionProjection
      .successfulRunSelfTags,
  ).toBeUndefined();
});

it("retains an already bound agenda conversion in the shared self-tag safety fact", () => {
  const f = fixture();
  expect(
    runnerPostRunSelfTagHandSafety({
      input: f.input,
      projection: shipping(f.input).runActionProjection,
      handAfterAction: 3,
      clicksAfterRun: 0,
      creditsAfterRun: 13,
      preservesAgendaAccess: true,
    }),
  ).toBeUndefined();
});

it("does not invent the conditional success tag while the Corporation bank is empty", () => { const f=fixture();f.input.playerView.opponent.credits=0;const t=shipping(f.input);expect(t.evidence.join("|")).not.toContain("runner_post_run_self_tag_hand_buffer_unrecoverable"); });
