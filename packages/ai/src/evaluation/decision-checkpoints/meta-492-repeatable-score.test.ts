import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("admits the original side-safe G26 D299 Main Office conversion with two Chicago activations", () => {
  const checkpoint = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-492-r2-g26-d299.json",
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
  const path = corpSameTurnScoreConversionPaths(input).find(
    (p) => p.targetServerId === "new_remote",
  )!;
  expect(path).toMatchObject({ clicksRequired: 3, creditsRequired: 8 });
  expect(path.steps.filter((s) => s.kind === "place_advancement")).toHaveLength(
    2,
  );
  expect(path.steps.filter((s) => s.kind === "rez_score_support")).toHaveLength(
    1,
  );
  const before = JSON.stringify(input),
    decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action.type).toBe("install_card");
  expect(action.source).toContain("main-office-relocation");
  expect(action.payload?.serverId).not.toBe("remote_1");
  expect(decision.reasonCode).toBe("plan_first.corp.score_agenda");
  expect(JSON.stringify(input)).toBe(before);
});
