import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { aiLiveRuntimeDependencies } from "../../ai-runtime-public-entrypoints";
import { createAiLiveRuntimeComposition } from "../../runtime/ai-live-runtime-composition";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
import { evaluateRunnerHandDevelopment } from "../../runner/hand-development/hand-development-evaluation";
type Params = Parameters<typeof evaluateRunnerHandDevelopment>[0];
afterEach(resetResidentPlanPortfolioMemory);
function fixture(name: string) {
  const f = JSON.parse(
    readFileSync(
      new URL("./fixtures/meta-ten-repairs/" + name, import.meta.url),
      "utf8",
    ),
  );
  expect(Object.values(f.validation)).toEqual(Array(9).fill(true));
  return f;
}
describe("shared physical coverage memory", () => {
  it("preserves all native parent needs without charging one Corrosion twice", () => {
    const first = fixture("545-r3-g2-d131.json"),
      second = fixture("545-r3-g2-d132.json");
    const before = [JSON.stringify(first.input), JSON.stringify(second.input)];
    const observations: Params[] = [];
    const runtime = createAiLiveRuntimeComposition({
      ...aiLiveRuntimeDependencies,
      evaluateRunnerHandDevelopment: (p) => {
        observations.push(p);
        return aiLiveRuntimeDependencies.evaluateRunnerHandDevelopment(p);
      },
    });
    restoreAiRuntimeCheckpoint(
      first.input,
      first.input.ownDeckSnapshot.deckSnapshotId,
      first.runtime,
    );
    runtime.chooseAiAction(first.input);
    const result = runtime.chooseAiAction(second.input);
    const projection = observations
      .filter(
        (p) => p.input.playerView.stateVersion === 131 && p.rigDemandProjection,
      )
      .at(-1)!.rigDemandProjection!;
    expect(projection.memory).toMatchObject({
      memoryUsed: 3,
      memoryLimit: 4,
      memoryAvailable: 1,
      preferredAdditionalGeneralMu: 1,
      preferredMemoryLimit: 4,
    });
    const wall = projection.roleDemands.filter(
      (d) => d.capabilityId === "breaker_wall",
    );
    expect(wall).toHaveLength(3);
    expect(new Set(wall.map((d) => d.sourceNeedId)).size).toBe(3);
    expect(
      wall.every((d) =>
        d.providers.some(
          (p) =>
            p.definitionId === "onr_proteus_083_corrosion" &&
            p.memoryUnits === 1,
        ),
      ),
    ).toBe(true);
    expect(
      projection.roleDemands.some((d) =>
        d.capabilityId.startsWith("memory_capacity_general:"),
      ),
    ).toBe(false);
    expect(result.actionId).not.toContain(
      "install_card.runner_onr_v1_146_zetatech",
    );
    expect(result.fallbackUsed).toBe(false);
    expect(result.timeoutUsed).toBe(false);
    const pf = result.decisionDebug!.planFirstDecision!;
    expect(pf.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: 131,
      planInstanceId: pf.selectedStep!.planInstanceId,
      stepId: pf.selectedStep!.stepId,
    });
    expect(
      second.input.legalActions.find(
        (a: { actionId: string }) => a.actionId === result.actionId,
      ).expiresAtStateVersion,
    ).toBe(131);
    expect([JSON.stringify(first.input), JSON.stringify(second.input)]).toEqual(
      before,
    );
  });
});
