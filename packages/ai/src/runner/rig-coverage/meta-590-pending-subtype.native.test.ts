import { runnerPendingFreeSubtypeCoverageRole } from "./coverage-pending-subtype";
import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
function native() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta590-fubar-before-duplicate.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it("keeps the existing free unconfigured Sentry answer instead of buying a second ten-credit breaker for generic coverage", () => {
  const { cp, input } = native();
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  const selected = input.legalActions.find(
    (a: { actionId: string }) => a.actionId === decision.actionId,
  );
  expect(selected).toBeDefined();
  expect(
    selected.type === "install_card" &&
      selected.source?.includes("morphing-tool"),
  ).toBe(false);
  expect(decision.decisionDebug!.planFirstDecision!).toMatchObject({
    rootPlanInstanceId: "plan:runner.economy:runner-portfolio-credit-reserve",
    selectedPlan: { moduleId: "runner.economy" },
    selectedStep: {
      stepId:
        "plan:runner.economy:runner-portfolio-credit-reserve:fund:runner-portfolio-credit-reserve",
    },
    route: { actionId: "runner.gain_credit", stateVersion: 279 },
  });
});

it("reserves exactly the last missing generic role without changing the installed coverage facts", () => {
  const { input } = native(),
    caps = input.ownDeckCapabilities;
  const before = JSON.stringify(caps);
  expect(runnerPendingFreeSubtypeCoverageRole(input, caps)).toBe(
    "breaker_sentry",
  );
  expect(caps.runner.breakerCoverageMatrix.sentry.installed).toBe(false);
  expect(JSON.stringify(caps) === before).toBe(true);
});
it.each([
  "already_selected",
  "hand_only",
  "two_missing_roles",
  "unknown_source",
  "no_matrix",
])("keeps the coverage boundary %s", (mode) => {
  const { input } = native(),
    caps = input.ownDeckCapabilities;
  const fubar = input.playerView.own.rig.find(
    (c: { definitionId: string }) => c.definitionId === "onr_proteus_088_fubar",
  );
  if (mode === "already_selected") fubar.selectedSubtype = "code_gate";
  if (mode === "hand_only")
    input.playerView.own.rig = input.playerView.own.rig.filter(
      (c: { instanceId: string }) => c.instanceId !== fubar.instanceId,
    );
  if (mode === "two_missing_roles")
    caps.runner.breakerCoverageMatrix.code_gate.installed = false;
  if (mode === "unknown_source") fubar.known = false;
  if (mode === "no_matrix") delete caps.runner.breakerCoverageMatrix;
  expect(runnerPendingFreeSubtypeCoverageRole(input, caps)).toBeUndefined();
});
