import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { reconcileSelectedRunnerCostPenaltySupportOrigin } from "./run-window-cost-continuation";
import type { PlanSchedulerResult } from "../../plans/plan-scheduler";
function original(d: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta592-r8-g03-sequential-trace.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).checkpoints.find((x: any) => x.decision === d).checkpoint;
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it("retains the direct central run root across both real Pocket traces and Chiba support (SP-168)", () => {
  const initial = original(124).cp.runtime.residentPlanPortfolio;
  for (const d of [124, 126, 127]) {
    const { cp, input } = original(d);
    expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
    if (d === 124)
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot.deckSnapshotId,
        cp.runtime,
      );
    const before = JSON.stringify(input),
      z = chooseAiAction(input),
      p = residentPlanPortfolioSnapshot(input)!;
    expect(JSON.stringify(input)).toBe(before);
    expect(z.fallbackUsed || z.timeoutUsed).toBe(false);
    expect(p.rootForegroundInstanceId).toBe(initial.rootForegroundInstanceId);
    expect(p.executorInstanceId).toBe(initial.executorInstanceId);
    expect(p.stateVersion).toBe(input.playerView.stateVersion);
    expect(p.pendingRunnerCostPenaltySupportOrigin).toMatchObject({
      rootPlanInstanceId: initial.rootForegroundInstanceId,
      executorInstanceId: initial.executorInstanceId,
      selectedAtStateVersion: d === 124 ? 123 : 125,
      originalActionId:
        d === 124
          ? "runner.continue_run.printed_subroutines_trace_a"
          : "runner.resolve_choice",
    });
    if (d === 126)
      expect(z.selectedChoices?.selectedOptionIds).toEqual(["bid_6"]);
    if (d === 127) {
      const a = input.legalActions.find((a: any) => a.actionId === z.actionId)!;
      expect(a.payload.costPenaltySupportOriginalActionId).toBe(
        "runner.resolve_choice",
      );
      expect(a.payload.costPenaltySupportWindowId).toBe(
        "runner_cost_penalty_support.126",
      );
      expect(z.actionId).toContain("chiba-bank-account");
    }
  }
});
it.each([
  "valid",
  "wrong_run",
  "wrong_server",
  "wrong_target",
  "wrong_signal",
  "wrong_root",
  "wrong_executor",
  "wrong_pending_root",
  "wrong_pending_executor",
  "missing_pending",
  "missing_target",
  "wrong_step",
  "missing_event",
  "corp_actor",
  "foreign_trace",
  "nontrace_effect",
])(
  "advances a completed trace only with its exact direct run root: %s",
  (variant) => {
    const { cp, input } = original(124),
      previous = cp.runtime.residentPlanPortfolio,
      pending = previous.pendingRunnerCostPenaltySupportOrigin,
      root = previous.instances.find(
        (p: any) => p.instanceId === previous.rootForegroundInstanceId,
      ),
      event = input.eventTail.find((e: any) => e.stateVersionBefore === 122);
    if (variant === "wrong_run") input.playerView.run.runId = "foreign-run";
    if (variant === "wrong_server")
      input.playerView.run.attackedServerId = "hq";
    if (variant === "wrong_target") root.target.id = "hq";
    if (variant === "wrong_signal") root.moduleState.signal.serverId = "hq";
    if (variant === "wrong_root")
      previous.rootForegroundInstanceId = "foreign-root";
    if (variant === "wrong_executor")
      previous.executorInstanceId = "foreign-executor";
    if (variant === "wrong_pending_root")
      pending.rootPlanInstanceId = "foreign-root";
    if (variant === "wrong_pending_executor")
      pending.executorInstanceId = "foreign-executor";
    if (variant === "missing_pending")
      delete previous.pendingRunnerCostPenaltySupportOrigin;
    if (variant === "missing_target") delete root.target;
    if (variant === "wrong_step")
      pending.sourceStepId = "run.encounter_ice:121";
    if (variant === "missing_event")
      input.eventTail = input.eventTail.filter((e: any) => e !== event);
    if (variant === "corp_actor") event.publicPayload.actor = "corp";
    if (variant === "foreign_trace")
      event.publicPayload.traceId = "foreign-run.foreign.trace";
    if (variant === "nontrace_effect")
      event.publicPayload.effectKind = "not-trace";
    const result: Extract<PlanSchedulerResult, { lane: "engine_window" }> = {
      lane: "engine_window",
      actionId: input.legalActions[0].actionId,
      origin: {
        rootPlanInstanceId: "run:run_119",
        leafPlanInstanceId: "rules.window_resolution",
        side: "runner",
        windowKind: "run",
        windowId: "run.encounter_ice:123",
        stateVersion: 123,
        timingPoint: "run.encounter_ice",
      },
      portfolio: structuredClone(previous),
      diagnostics: [
        { stage: "window", code: "engine_window_single_legal_resolution" },
      ],
    };
    reconcileSelectedRunnerCostPenaltySupportOrigin(input, result, previous);
    expect(result.portfolio!.stateVersion).toBe(
      variant === "valid" ? 123 : 122,
    );
    if (variant !== "valid")
      expect(result.portfolio!.pendingRunnerCostPenaltySupportOrigin).toEqual(
        previous.pendingRunnerCostPenaltySupportOrigin,
      );
  },
);
import {
  applyAction,
  getLegalActions,
  hashGameState,
  validateGameState,
} from "../../../../engine/src/index";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
it("executes the full second-trace, Chiba and exact original bid sequence twice through the Engine", () => {
  const f = JSON.parse(
      readFileSync(
        new URL(
          "../../runtime/test-fixtures/meta592-r8-g03-sequential-trace.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
    hashes: string[] = [];
  expect(f.engineOrigin.checkedStates).toBe(124);
  for (let repeat = 0; repeat < 2; repeat++) {
    resetResidentPlanPortfolioMemory();
    let state = structuredClone(f.engineOrigin.state);
    const { cp, input: first } = original(124);
    restoreAiRuntimeCheckpoint(
      first,
      first.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const actions: string[] = [];
    for (let i = 0; i < 5; i++) {
      const side = getLegalActions(state, "runner").length ? "runner" : "corp";
      const input =
        i === 0
          ? first
          : buildAiDecisionInput(state, side, {
              difficulty: "hard",
              ownDeckSnapshot:
                side === "runner" ? cp.input.ownDeckSnapshot : f.corpDeck,
            });
      const before = JSON.stringify(input),
        z = chooseAiAction(input),
        a = getLegalActions(state, side).find((a) => a.actionId === z.actionId);
      expect(JSON.stringify(input)).toBe(before);
      expect(z.fallbackUsed || z.timeoutUsed).toBe(false);
      expect(a).toBeDefined();
      actions.push(a!.actionId);
      const r = applyAction(state, {
        matchId: state.matchId,
        side,
        actionId: a!.actionId,
        clientKnownStateVersion: state.stateVersion,
        ...(z.selectedChoices ? { selectedChoices: z.selectedChoices } : {}),
      });
      expect(r.ok).toBe(true);
      if (!r.ok) throw Error(r.error.message);
      state = r.state;
      expect(validateGameState(state).ok).toBe(true);
    }
    expect(actions[0]).toBe("runner.continue_run.printed_subroutines_trace_a");
    expect(actions[3]).toContain("chiba-bank-account");
    expect(actions[4]).toBe("runner.resolve_choice");
    expect(state.runner.credits).toBe(0);
    hashes.push(hashGameState(state));
  }
  expect(hashes).toEqual(["fnv1a:3f7c6978", "fnv1a:3f7c6978"]);
});
