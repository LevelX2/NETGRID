import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerRunRiskContractReassessment } from "../../runner/run-window/run-window-assessment";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { RunnerRunOrigin } from "../../plans/runner-run-origin-contract";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function fixture(game: number, decision: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r22-g${game}-d${decision}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  return { cp, input: { ...cp.input, ...buildAiDecisionInputDto(cp.input) } };
}

afterEach(resetResidentPlanPortfolioMemory);

it("resets current encounter strength before quoting the inner risk reserve", () => {
  const { cp, input } = fixture(3, 489);
  const origin = cp.runtime
    .residentPlanPortfolio!.instances.map(
      (p) => p.moduleState as { signal?: RunnerRunOrigin },
    )
    .find((state) => state.signal?.runRiskContract)!.signal!;
  const risk = runnerRunRiskContractReassessment(input, origin)!;
  expect(risk.currentReserveQuote?.knownPathCost).toBe(4);
  expect(risk.currentReserveQuote?.creditsAfterKnownPath).toBe(4);
});

it.each([
  [3, 489],
  [20, 406],
  [21, 63],
])(
  "preserves credits before a pure ETR followed by the same known reserve abort: G%i D%i",
  (game, d) => {
    const { cp, input } = fixture(game, d);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    const selected = input.legalActions.find(
      (a) => a.actionId === decision.actionId,
    );
    expect(selected?.type).toBe("continue_run");
    expect(selected?.payload?.encounterWillEndRun).toBe(true);
    expect(selected?.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    expect(decision.fallbackUsed).toBe(false);
    const root =
      game === 21
        ? "plan:runner.pressure_central:central%3Ahq"
        : "plan:runner.contest_remote:remote%3Aremote_1";
    expect(decision.evidence).toContain(`plan_first_root:${root}`);
    expect(
      decision.evidence?.some((e: string) =>
        e.startsWith("plan_first_executor:plan:runner.convert_run_window:"),
      ),
    ).toBe(true);
  },
);

it.each([10, 12])(
  "keeps a fully funded pure ETR break at %i credits under the original root",
  (credits) => {
    const { cp, input } = fixture(3, 489);
    input.playerView.own.credits = credits;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).toBe("break_subroutine");
    expect(decision.evidence).toContain(
      "plan_first_root:plan:runner.contest_remote:remote%3Aremote_1",
    );
    expect(decision.fallbackUsed).toBe(false);
  },
);

it("preserves the original break that keeps a later jack-out available", () => {
  const { cp, input } = fixture(17, 421);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(
    input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
  ).toBe("break_subroutine");
  expect(decision.evidence).toContain(
    "plan_first_root:plan:runner.contest_remote:remote%3Aremote_3",
  );
  expect(decision.fallbackUsed).toBe(false);
});

it.each(["liquid", "run-only"])(
  "allows the complete pump and break when %s credits preserve the bound reserve",
  (pool) => {
    const { cp, input } = fixture(20, 406);
    if (pool === "liquid") input.playerView.own.credits = 8;
    else input.playerView.run!.badPublicityCredits = 4;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).toBe("pump_breaker");
    expect(decision.evidence).toContain(
      "plan_first_root:plan:runner.contest_remote:remote%3Aremote_1",
    );
    expect(decision.fallbackUsed).toBe(false);
  },
);
