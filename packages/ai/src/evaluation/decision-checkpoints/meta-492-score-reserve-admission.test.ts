import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { corpFundedCentralProtectionReserve } from "../../corp/defense/corp-server-protection-reserve";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("rejects original R3 G2 D102 before exposing Tycho across the already funded five-credit central reserve", () => {
  const checkpoint = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-492-r3-g2-d102.json",
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
    (p) =>
      p.agendaCardId.includes("tycho-extension") &&
      p.targetServerId === "new_remote",
  )!;
  expect(path).toMatchObject({ creditsRequired: 8, clicksRequired: 3 });
  expect(
    corpFundedCentralProtectionReserve(input, path.agendaCardId, undefined),
  ).toBe(5);
  const before = JSON.stringify(input),
    decision = chooseAiAction(input),
    action = input.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(action.source).not.toContain("tycho-extension");
  expect(decision.fallbackUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});
