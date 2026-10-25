import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  exportAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
function read(name: string) {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/" + name,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    schemaVersion: string;
    provenance: unknown;
    stateVersion: number;
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation?: Record<string, boolean>;
  };
}
function target() {
  const cp = read("cp-meta-555-r1-g8-d226.json");
  expect(Object.values(cp.validation!)).toEqual(Array(9).fill(true));
  return cp;
}
function failed() {
  const cp = read("cp-meta-555-failed-current-g8-sv226.json");
  expect(cp.schemaVersion).toBe("netgrid-current-ai-input-v1");
  expect(cp.provenance).toBe("current_persisted_state");
  return cp;
}
afterEach(resetResidentPlanPortfolioMemory);
it("binds the exact hidden Stack target and sufficient MU sacrifice before the real consecutive memory input", () => {
  const before = target(),
    next = failed();
  const safe = JSON.stringify([
    before.input.playerView,
    before.input.legalActions,
    next.input.playerView,
    next.input.legalActions,
  ]);
  expect(before.input.playerView.stateVersion).toBe(225);
  expect(next.input.playerView.stateVersion).toBe(226);
  restoreAiRuntimeCheckpoint(
    before.input,
    before.input.ownDeckSnapshot!.deckSnapshotId,
    before.runtime,
  );
  const original = residentPlanPortfolioSnapshot(before.input)!;
  const root = original.rootForegroundInstanceId,
    executor = original.executorInstanceId;
  const choice = chooseAiAction(before.input);
  expect(choice.selectedChoices).toMatchObject({
    choiceId: before.input.playerView.pendingChoice!.choiceId,
    selectedOptionIds: ["card_runner_onr_classic_031_rent-i-con_3"],
  });
  const continued = residentPlanPortfolioSnapshot(before.input)!;
  expect(continued.rootForegroundInstanceId).toBe(root);
  expect(continued.executorInstanceId).toBe(executor);
  const state = continued.instances.find((i) => i.instanceId === executor)!
    .moduleState as {
    selectedSearchStateVersion: number;
    gap: {
      directSearchChoiceBindings: Array<{
        targetCardInstanceId: string;
        resolvedSearchChoice: { stateVersion: number };
        installMemorySacrificeBinding: {
          requiredMemoryToFree: number;
          selectedCards: Array<{ cardInstanceId: string; memoryCost: number }>;
        };
      }>;
    };
  };
  const binding = state.gap.directSearchChoiceBindings[0]!;
  expect(state.selectedSearchStateVersion).toBe(225);
  expect(binding.targetCardInstanceId).toBe(
    "runner_onr_classic_031_rent-i-con_3",
  );
  expect(binding.resolvedSearchChoice.stateVersion).toBe(225);
  expect(binding.installMemorySacrificeBinding.requiredMemoryToFree).toBe(1);
  const sacrifices = binding.installMemorySacrificeBinding.selectedCards;
  expect(
    sacrifices.reduce((n, c) => n + c.memoryCost, 0),
  ).toBeGreaterThanOrEqual(1);
  const runtime = exportAiRuntimeCheckpoint(
    before.input,
    before.input.ownDeckSnapshot!.deckSnapshotId,
  );
  restoreAiRuntimeCheckpoint(
    next.input,
    next.input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(next.input);
  expect(decision.actionId).toBe("runner.resolve_choice");
  expect(decision.selectedChoices).toEqual({
    choiceId: next.input.playerView.pendingChoice!.choiceId,
    selectedOptionIds: sacrifices.map((c) => "card_" + c.cardInstanceId),
  });
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  expect(residentPlanPortfolioSnapshot(next.input)!.executorInstanceId).toBe(
    executor,
  );
  const pf = decision.decisionDebug!.planFirstDecision!;
  expect(pf.rootPlanInstanceId).toBe("rules");
  expect(pf.leafExecutorInstanceId).toBe("rules.window_resolution");
  expect(
    JSON.stringify([
      before.input.playerView,
      before.input.legalActions,
      next.input.playerView,
      next.input.legalActions,
    ]),
  ).toBe(safe);
});
it("keeps the old unbound failed-state checkpoint fail-closed", () => {
  const cp = failed();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  expect(() => chooseAiAction(cp.input)).toThrow();
});
it.each(["state_version", "target", "source"] as const)(
  "rejects a changed memory continuation: %s",
  (kind) => {
    const before = target(),
      next = failed();
    restoreAiRuntimeCheckpoint(
      before.input,
      before.input.ownDeckSnapshot!.deckSnapshotId,
      before.runtime,
    );
    chooseAiAction(before.input);
    const runtime = exportAiRuntimeCheckpoint(
      before.input,
      before.input.ownDeckSnapshot!.deckSnapshotId,
    );
    const executor = runtime.residentPlanPortfolio!.instances.find(
      (i) => i.instanceId === runtime.residentPlanPortfolio!.executorInstanceId,
    )!;
    const state = executor.moduleState as {
      selectedSearchStateVersion: number;
      gap: {
        directSearchChoiceBindings: Array<{
          targetCardInstanceId: string;
          sourceCardInstanceId: string;
        }>;
      };
    };
    if (kind === "state_version") state.selectedSearchStateVersion--;
    if (kind === "target")
      state.gap.directSearchChoiceBindings[0]!.targetCardInstanceId =
        "unbound-target";
    if (kind === "source")
      state.gap.directSearchChoiceBindings[0]!.sourceCardInstanceId =
        "unbound-source";
    restoreAiRuntimeCheckpoint(
      next.input,
      next.input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    expect(() => chooseAiAction(next.input)).toThrow();
  },
);
