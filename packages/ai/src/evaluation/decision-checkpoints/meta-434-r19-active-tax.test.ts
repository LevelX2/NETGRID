import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { currentRunRemainingIce } from "../../runtime/current-encounter";
import { currentRunPathContext } from "../../run-analysis/current-run-path-context";
import { runnerRunRiskContractReassessment } from "../../runner/run-window/run-window-assessment";
import { activeRunRootPlan } from "../../runner/run-window/run-window-origin";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function load() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r19-g4-d215.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}

it.each([false, true])(
  "preserves the accepted risk contract with input sanitization=%s",
  (sanitize) => {
    const checkpoint = load();
    const runtime = checkpoint.runtime;
    const input = sanitize
      ? { ...checkpoint.input, ...buildAiDecisionInputDto(checkpoint.input) }
      : checkpoint.input;
    expect(input.playerView.run?.encounterTaxForFutureIce).toBe(2);
    const root = activeRunRootPlan(runtime.residentPlanPortfolio, input);
    const risk = runnerRunRiskContractReassessment(input, root);
    expect(risk).toMatchObject({
      decision: "preserve_continuation",
      currentReserveQuote: {
        knownPathCost: 12,
        creditsAfterKnownPath: 6,
        creditGap: 0,
      },
    });
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const result = chooseAiAction(input);
    expect(
      input.legalActions.find((a) => a.actionId === result.actionId)?.type,
    ).toBe("continue_run");
    expect(result.fallbackUsed).toBe(false);
    expect(
      result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toContain("plan:runner.convert_run_window:");
    expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: input.playerView.stateVersion,
    });
  },
);

it.each([-1, 1.5, Number.NaN])(
  "rejects an invalid encounter tax %s at the input boundary",
  (amount) => {
    const { input } = load();
    input.playerView.run!.encounterTaxForFutureIce = amount;
    expect(() => buildAiDecisionInputDto(input)).toThrow(
      "Invalid Engine run encounter-entry tax quote",
    );
  },
);

it("still rejects a real credit loss after that same tax was activated", () => {
  const { input, runtime } = load();
  input.playerView.own.credits = 14;
  expect(
    runnerRunRiskContractReassessment(
      input,
      activeRunRootPlan(runtime.residentPlanPortfolio, input),
    )?.decision,
  ).toBe("prefer_jack_out");
});

it("charges only future actual encounters and never the already paid current encounter", () => {
  const { input } = load();
  const remaining = currentRunRemainingIce(input);
  const known = remaining.filter((i) => i.known);
  const withoutSubroutines = known.map((i) => ({
    ...i,
    effectiveRunQuote: { ...i.effectiveRunQuote!, subroutines: [] },
  }));
  const context = currentRunPathContext(input);
  expect(
    assessKnownRezzedIcePath(
      [...withoutSubroutines, remaining.find((i) => !i.known)!],
      [],
      10,
      [],
      0,
      context,
    ),
  ).toMatchObject({ visibleBreakCost: 4, creditsAfterPath: 6 });
  const current = withoutSubroutines[1];
  if (!current) throw new Error("checkpoint_current_ice_missing");
  input.playerView.run!.encounteredIce = current;
  expect(
    assessKnownRezzedIcePath(
      withoutSubroutines,
      [],
      10,
      [],
      0,
      currentRunPathContext(input),
    ),
  ).toMatchObject({ visibleBreakCost: 2, creditsAfterPath: 8 });
});
