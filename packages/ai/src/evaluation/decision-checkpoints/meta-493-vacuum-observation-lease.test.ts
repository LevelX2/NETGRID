import { beforeEach, expect, it } from "vitest";
import before from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-493-vacuum-d148.json";
import after from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-493-vacuum-d149.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

beforeEach(resetResidentPlanPortfolioMemory);
function fixture(source: typeof after | typeof before = after) {
  return structuredClone(source) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function restore(cp: ReturnType<typeof fixture>) {
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  // This is the captured live run, not a runtime restart. The public checkpoint
  // restore deliberately invalidates a turn lease when simulating a restart.
  restoreResidentPlanPortfolioMemorySnapshot(
    cp.input,
    cp.runtime.residentPlanPortfolio,
  );
}
it("retains the executed lease at 140 while the portfolio has observed state 141", () => {
  const cp = fixture();
  restore(cp);
  const original = JSON.stringify([cp.input.playerView, cp.input.legalActions]);
  const result = chooseAiAction(cp.input);
  expect(result.actionId).toBe("runner.resolve_choice");
  expect(result.selectedChoices).toMatchObject({
    choiceId: cp.input.playerView.pendingChoice!.choiceId,
    selectedOptionIds: ["resume_from_rezzed_ice_back"],
  });
  expect(result.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(cp.input)!;
  expect(portfolio.rootForegroundInstanceId).toBe(
    cp.runtime.residentPlanPortfolio!.rootForegroundInstanceId,
  );
  expect(portfolio.executorInstanceId).toBe(
    cp.runtime.residentPlanPortfolio!.executorInstanceId,
  );
  expect(JSON.stringify([cp.input.playerView, cp.input.legalActions])).toBe(
    original,
  );
});
it("binds the native forced source action through the exact continuous run chain", () => {
  const cp = fixture(before);
  restore(cp);
  const forced = chooseAiAction(cp.input);
  expect(forced.actionId).toBe(cp.input.legalActions[0]!.actionId);
  expect(
    residentPlanPortfolioSnapshot(cp.input)?.selectedActionOrigin,
  ).toMatchObject({
    selectedAtStateVersion: 147,
    selectedActionId: forced.actionId,
    immediateChoicePolicy: "resolve_runner_vacuum_link_rewind",
  });
  const next = fixture().input;
  expect(chooseAiAction(next).selectedChoices).toMatchObject({
    choiceId: next.playerView.pendingChoice!.choiceId,
    selectedOptionIds: ["resume_from_rezzed_ice_back"],
  });
});
it.each([
  "gap",
  "other_server",
  "unrelated_action",
  "lease_source",
  "lease_state",
  "lease_phase",
  "lease_node",
  "first_server",
  "other_run",
  "missing_option",
])("rejects incomplete or foreign provenance: %s", (fault) => {
  const cp = fixture(),
    i = cp.input,
    p = cp.runtime.residentPlanPortfolio!;
  const e = i.eventTail!.find((e) => e.stateVersionBefore === 142)!;
  if (fault === "gap")
    i.eventTail = i.eventTail!.filter((event) => event !== e);
  if (fault === "other_server") e.publicPayload!.serverId = "hq";
  if (fault === "unrelated_action") e.publicPayload!.actionType = "gain_credit";
  if (fault === "lease_source")
    p.turnPlanExecutionLease!.sourcePlanId = "other_source";
  if (fault === "lease_state")
    p.turnPlanExecutionLease!.stateIdentity.stateVersion++;
  if (fault === "lease_phase")
    p.turnPlanExecutionLease!.phaseId = "other_phase";
  if (fault === "lease_node") p.turnPlanExecutionLease!.nodeId = "other_node";
  if (fault === "first_server")
    i.eventTail!.find(
      (event) => event.stateVersionBefore === 140,
    )!.publicPayload!.serverId = "hq";
  if (fault === "other_run")
    i.playerView.pendingChoice!.choiceId =
      "card_implementation.vacuum_link_rewind:other_run:148";
  if (fault === "missing_option") i.playerView.pendingChoice!.options.pop();
  expect(() => {
    restore(cp);
    chooseAiAction(i);
  }).toThrow(
    fault === "lease_source"
      ? /executor_invariant_broken/
      : /window_origin_missing/,
  );
});
