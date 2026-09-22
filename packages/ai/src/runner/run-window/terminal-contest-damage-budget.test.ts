import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { createRunnerPumpFuturePathContext } from "../../runtime/runner-pump-future-path-context";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { runnerRunWindowEncounterRequiredHandFloor } from "./run-window-assessment";
import { activeRunRootPlan } from "./run-window-origin";
import { isAcceptableNonlethalDamageSubroutine } from "../../runtime/encounter-subroutine";

afterEach(resetResidentPlanPortfolioMemory);

it.each([
  [352, "pump_breaker"],
  [356, "break_subroutine"],
])("keeps the accepted inner encounter route at D%s", (index, type) => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-456-terminal-contest-d${index}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input: AiDecisionInput = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  );
  expect(action?.type).toBe(type);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_2",
  );
  if (index === 356) {
    expect(action?.payload?.subroutineIndex).toBe(2);
    const core =
      input.playerView.run!.encounteredIce!.effectiveRunQuote!.subroutines[0]!;
    expect(isAcceptableNonlethalDamageSubroutine(input, core)).toBe(false);
    expect(isAcceptableNonlethalDamageSubroutine(input, core, 0)).toBe(true);
    input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.slice(0, 1);
    expect(isAcceptableNonlethalDamageSubroutine(input, core, 0)).toBe(false);
  }
});

it("preserves the same accepted damage budget in the movement phase", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-456-terminal-contest-d351.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input: AiDecisionInput = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.continue_run");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_2",
  );
});

it("preserves the accepted terminal contest through the payable outer ETR break", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-456-terminal-contest-d348.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input: AiDecisionInput = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  );
  expect(action?.type).toBe("break_subroutine");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.evidence).toContain("plan_first_runtime:true");
  expect(
    decision.evidence!.some((e) => e.includes("runner.convert_run_window")),
  ).toBe(true);
  expect(decision.evidence!.some((e) => e.startsWith("plan_step_id:"))).toBe(
    true,
  );
  expect(
    decision.evidence!.some((e) => e.startsWith("plan_scheduler:route:")),
  ).toBe(true);
  const selected = decision.decisionDebug?.actionAlternatives?.find(
    (a) => a.actionId === decision.actionId,
  );
  expect(selected).toBeDefined();
  expect(JSON.stringify(selected)).not.toContain(
    "break_future_path_blocked_after_cost",
  );
});

it("keeps ordinary reserve, lethal damage and unfunded future ICE blocked", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-456-terminal-contest-d348.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input: AiDecisionInput = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  const { encounterFuturePathAfterPumpBreakAssessment: assess } =
    createRunnerPumpFuturePathContext({
      assessKnownRezzedIcePath,
      knownIcePathReason: (path) => JSON.stringify(path),
    });
  const server = input.playerView.servers.find((s) => s.id === "remote_2")!;
  expect(assess(input, server, 10, []).blocksPump).toBe(true);
  expect(assess(input, server, 10, [], 0).blocksPump).toBe(false);
  expect(assess(input, server, 9, [], 0).blocksPump).toBe(true);
  input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.slice(0, 1);
  expect(assess(input, server, 10, [], 0).blocksPump).toBe(true);
});

it("requires the bound terminal contest and its risk contract for reserve acceptance", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-456-terminal-contest-d348.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input: AiDecisionInput = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    cp.input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const root = activeRunRootPlan(cp.runtime.residentPlanPortfolio, input);
  expect(runnerRunWindowEncounterRequiredHandFloor(root)).toBe(0);
  expect(runnerRunWindowEncounterRequiredHandFloor(undefined)).toBeUndefined();
  const withoutRisk = { ...root };
  delete withoutRisk.runRiskContract;
  expect(
    runnerRunWindowEncounterRequiredHandFloor(withoutRisk),
  ).toBeUndefined();
  expect(
    runnerRunWindowEncounterRequiredHandFloor({ ...root, purpose: "access" }),
  ).toBeUndefined();
  if (root?.parentBinding?.moduleId !== "runner.contest_remote")
    throw Error("fixture_parent_missing");
  root.parentBinding.signal.terminalPatternThreat = false;
  expect(runnerRunWindowEncounterRequiredHandFloor(root)).toBeUndefined();
});
