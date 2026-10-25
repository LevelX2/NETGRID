import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { runnerLastCentralCounterConversion } from "../../runner/central-pressure/last-central-counter-conversion";
const recorded = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta556-last-central-counter.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing 556 last central counter", () => {
  it.each([
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ])(
    "binds the free Archives run with DTO=%s and known-empty=%s",
    (dto, knownEmpty) => {
      const cp = knownEmpty
        ? JSON.parse(
            readFileSync(
              new URL(
                "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta556-known-empty-last-counter.json",
                import.meta.url,
              ),
              "utf8",
            ),
          )
        : structuredClone(recorded);
      expect(Object.keys(cp.validation)).toHaveLength(9);
      expect(Object.values(cp.validation).every(Boolean)).toBe(true);
      if (dto) cp.input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
      const before = JSON.stringify(cp.input);
      restoreAiRuntimeCheckpoint(
        cp.input,
        cp.input.ownDeckSnapshot.deckSnapshotId,
        cp.runtime,
      );
      const result = chooseAiAction(cp.input);
      const action = cp.input.legalActions.find(
        (a: any) => a.actionId === result.actionId,
      );
      expect(result.fallbackUsed).toBe(false);
      expect(result.timeoutUsed).toBe(false);
      expect(action).toMatchObject({
        type: "start_run",
        payload: { serverId: "archives" },
      });
      const pf = result.decisionDebug?.planFirstDecision;
      expect(pf?.selectedPlan?.moduleId).toBe("runner.pressure_central");
      expect(pf?.priority?.effectiveClass).toBe("P3");
      expect(pf?.rootPlanInstanceId).toBe(pf?.leafExecutorInstanceId);
      expect(pf?.route).toMatchObject({
        actionId: result.actionId,
        stateVersion: cp.input.playerView.stateVersion,
        planInstanceId: pf?.leafExecutorInstanceId,
      });
      expect(pf?.turnPlanning?.coverage).toMatchObject({
        status: "pass",
        coveragePercent: 100,
        missingActionCount: 0,
        conflictingActionCount: 0,
      });
      expect(JSON.stringify(cp.input)).toBe(before);
    },
  );
  it("keeps an open terminal remote contest ahead of counter development", () => {
    // Engine-derived synthetic companion to D32: Corp has six public points
    // and an unprotected facedown root with three public advances. The
    // fixture contains only the Runner view and actual Engine LegalActions.
    const cp = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta556-terminal-counter-companion.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect(cp.provenance).toBe("synthetic_engine_derived_terminal_companion");
    expect(
      cp.input.playerView.servers.find((s: any) => s.id === "remote_1").root[0],
    ).toMatchObject({ known: false, advancementCounters: 3 });
    expect(
      cp.input.playerView.servers.find((s: any) => s.id === "remote_1").root[0],
    ).not.toHaveProperty("definitionId");
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const result = chooseAiAction(cp.input);
    expect(result.actionId).toBe("runner.start_run.remote_1");
    expect(
      result.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.contest_remote");
    expect(
      result.decisionDebug?.planFirstDecision?.priority?.effectiveClass,
    ).toBe("P2");
  });
  it("does not invent the missing pair, a protected path or an unaffordable run", () => {
    const input = structuredClone(recorded.input),
      action = input.legalActions.find(
        (a: any) =>
          a.type === "start_run" && a.payload?.serverId === "archives",
      );
    const evaluation: any = {
      targetServerId: "archives",
      actionId: action.actionId,
      pathPassability: "reachable",
      pathCost: 0,
    };
    expect(runnerLastCentralCounterConversion(input, evaluation)).toMatchObject(
      { actionsDenied: 1 },
    );
    input.playerView.servers.find((s: any) => s.id === "hq").counterDisplays =
      [];
    expect(
      runnerLastCentralCounterConversion(input, evaluation),
    ).toBeUndefined();
    const native = structuredClone(recorded.input);
    native.playerView.servers.find((s: any) => s.id === "archives").ice = [
      { known: false, instanceId: "hidden" },
    ];
    expect(
      runnerLastCentralCounterConversion(native, evaluation),
    ).toBeUndefined();
    expect(
      runnerLastCentralCounterConversion(recorded.input, {
        ...evaluation,
        pathCost: 1,
      }),
    ).toBeUndefined();
  });
});
