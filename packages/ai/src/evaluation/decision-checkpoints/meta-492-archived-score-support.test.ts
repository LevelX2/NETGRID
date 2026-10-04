import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { corpInstalledAdvancementPreparations } from "../../plans/corp-installed-advancement-preparation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("executes the native Babylon advance at original R4 G1 D171 without projecting trashed support", () => {
  const checkpoint = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-492-r4-g1-d171.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = checkpoint.input;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    checkpoint.runtime,
  );
  const archivedSupport = input.playerView.servers
    .find((s) => s.id === "archives")!
    .root.find((c) => c.definitionId === "onr_v1_312_chicago-branch")!;
  expect(archivedSupport.rezzed).toBe(true);
  expect(corpInstalledAdvancementPreparations(input)).not.toContainEqual(
    expect.objectContaining({ sourceCardId: archivedSupport.instanceId }),
  );
  expect(
    corpSameTurnScoreConversionPaths(input).some((p) =>
      p.steps.some((s) => s.sourceCardId === archivedSupport.instanceId),
    ),
  ).toBe(false);
  const before = JSON.stringify(input),
    decision = chooseAiAction(input),
    action = input.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(action.type).toBe("advance_card");
  expect(action.source).toContain("project-babylon");
  expect(decision.reasonCode).toBe("plan_first.corp.score_agenda");
  expect(decision.fallbackUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});
