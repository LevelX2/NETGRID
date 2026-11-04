import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";

afterEach(resetResidentPlanPortfolioMemory);

it.each([
  [166, "breaker_wall", "onr_proteus_100_wrecking-ball"],
  [168, "breaker_sentry", "onr_proteus_080_black-widow"],
] as const)(
  "does not pay another subtype switch at D%i for a central run blocked by its parent's hand floor",
  (decisionNumber, role, definitionId) => {
    const cp = JSON.parse(
      readFileSync(
        new URL(
          `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta590-subtype-hand-buffer-d${decisionNumber}.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect(Object.values(cp.validation).every(Boolean)).toBe(true);
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    const originalView = JSON.stringify(input.playerView);
    const originalLegalActions = JSON.stringify(input.legalActions);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    const decision = chooseAiAction(input);
    const selected = input.legalActions.find(
      (action: { actionId: string }) => action.actionId === decision.actionId,
    );
    expect(selected).toMatchObject({ type: "install_card" });
    expect(decision.actionId).toContain(definitionId);
    expect(selected.expiresAtStateVersion).toBe(decisionNumber - 1);
    const root = `plan:runner.rig_and_coverage:coverage%3A${role}`;
    expect(decision.decisionDebug!.planFirstDecision!).toMatchObject({
      rootPlanInstanceId: root,
      selectedPlan: { moduleId: "runner.rig_and_coverage", phase: "install_answer" },
      selectedStep: { stepId: `${root}:install:${role}` },
      route: { actionId: selected.actionId, stateVersion: decisionNumber - 1 },
    });
    expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
    expect(JSON.stringify(input.playerView)).toBe(originalView);
    expect(JSON.stringify(input.legalActions)).toBe(originalLegalActions);
  },
);
