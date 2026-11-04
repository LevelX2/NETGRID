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
function original(decision: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta592-r3-g10-d" + decision + ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it("keeps the original run executor through untargeted Corp rez passes, Hunter trace and Swiss payment (SP-168)", () => {
  const origin = original(149).cp.runtime.residentPlanPortfolio;
  for (const d of [149, 151, 152]) {
    const { cp, input } = original(d);
    expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
    if (d === 149)
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot.deckSnapshotId,
        cp.runtime,
      );
    const before = JSON.stringify(input),
      result = chooseAiAction(input),
      portfolio = residentPlanPortfolioSnapshot(input)!;
    expect(JSON.stringify(input)).toBe(before);
    expect(result.fallbackUsed || result.timeoutUsed).toBe(false);
    expect(portfolio.stateVersion).toBe(input.playerView.stateVersion);
    expect(portfolio.rootForegroundInstanceId).toBe(
      origin.rootForegroundInstanceId,
    );
    expect(portfolio.executorInstanceId).toBe(origin.executorInstanceId);
    expect(portfolio.pendingRunnerCostPenaltySupportOrigin).toMatchObject({
      rootPlanInstanceId: origin.rootForegroundInstanceId,
      executorInstanceId: origin.executorInstanceId,
      originalActionId:
        d === 149
          ? "runner.continue_run.printed_subroutines_trace"
          : "runner.resolve_choice",
      selectedAtStateVersion: d === 149 ? 148 : 150,
    });
    if (d === 149)
      expect(result.actionId).toBe(
        "runner.continue_run.printed_subroutines_trace",
      );
    if (d === 151)
      expect(result.selectedChoices?.selectedOptionIds).toEqual(["bid_5"]);
    if (d === 152) {
      expect(
        input.legalActions.find((a: any) => a.actionId === result.actionId)
          ?.payload.costPenaltySupportOriginalActionId,
      ).toBe("runner.resolve_choice");
      expect(result.actionId).toContain("swiss-bank-account");
    }
  }
});
it.each([
  "valid",
  "explicit_wrong_server",
  "runner_rez_pass",
  "missing_rez_server",
  "gap",
  "wrong_run",
  "wrong_root",
  "wrong_executor",
])(
  "advances only the fully witnessed run-owned forced continuation: %s",
  (variant) => {
    const { cp, input } = original(149),
      previous = cp.runtime.residentPlanPortfolio;
    const pass = input.eventTail.find((e: any) => e.stateVersionBefore === 145);
    if (variant === "explicit_wrong_server") pass.publicPayload.serverId = "rd";
    if (variant === "runner_rez_pass") pass.publicPayload.actor = "runner";
    if (variant === "missing_rez_server")
      delete input.eventTail.find((e: any) => e.stateVersionBefore === 146)
        .publicPayload.serverId;
    if (variant === "gap")
      input.eventTail.splice(input.eventTail.indexOf(pass), 1);
    if (variant === "wrong_run") input.playerView.run.runId = "another-run";
    if (variant === "wrong_root")
      previous.rootForegroundInstanceId = "another-root";
    if (variant === "wrong_executor")
      previous.executorInstanceId = "another-executor";
    const result: Extract<PlanSchedulerResult, { lane: "engine_window" }> = {
      lane: "engine_window",
      actionId: input.legalActions[0].actionId,
      origin: {
        rootPlanInstanceId: "run:run_142",
        leafPlanInstanceId: "rules.window_resolution",
        side: "runner",
        windowKind: "mandatory_choice",
        windowId: "run.encounter_ice:148",
        stateVersion: 148,
        timingPoint: input.playerView.timingPoint,
      },
      portfolio: structuredClone(previous),
      diagnostics: [
        { stage: "window", code: "engine_window_single_legal_resolution" },
      ],
    };
    reconcileSelectedRunnerCostPenaltySupportOrigin(input, result, previous);
    expect(result.portfolio!.stateVersion).toBe(
      variant === "valid" ? 148 : 144,
    );
    if (variant !== "valid")
      expect(result.portfolio!.pendingRunnerCostPenaltySupportOrigin).toEqual(
        previous.pendingRunnerCostPenaltySupportOrigin,
      );
  },
);
