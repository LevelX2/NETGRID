import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { installedMemorySurplusQuote } from "./installed-memory-surplus";
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta576-smith-surplus-memory.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}
beforeEach(resetResidentPlanPortfolioMemory);
describe("installed memory liquidation with whole-own-deck capacity", () => {
  it("bounds retained capacity by every copy in the immutable own deck", () => {
    const input = fixture().input;
    const target = input.playerView.own.rig!.find(
      (c) => c.memoryLimitBonus === 1,
    )!;
    expect(installedMemorySurplusQuote(input, target)).toEqual({
      stateVersion: 407,
      targetInstanceId: target.instanceId,
      memoryLimitAfterRemoval: 11,
      wholeOwnDeckProgramMemory: 9,
    });
    input.playerView.own.memoryLimit = 9;
    expect(installedMemorySurplusQuote(input, target)).toBeUndefined();
  });
  it("does not certify an unknown own pool or extra program copies", () => {
    const input = fixture().input,
      target = input.playerView.own.rig!.find((c) => c.memoryLimitBonus === 1)!;
    const noDeck = structuredClone(input);
    delete noDeck.ownDeckSnapshot;
    expect(installedMemorySurplusQuote(noDeck, target)).toBeUndefined();
    input.ownDeckSnapshot!.cards.push({
      cardId: "unknown-own-program",
      quantity: 1,
    });
    expect(installedMemorySurplusQuote(input, target)).toBeUndefined();
    const extra = fixture().input,
      program = extra.playerView.own.rig!.find(
        (c) => c.type === "program" && c.memoryCost === 1,
      )!;
    extra.playerView.own.rig!.push({
      ...program,
      instanceId: "additional-generated-copy",
    });
    expect(installedMemorySurplusQuote(extra, target)).toBeUndefined();
  });
  it("keeps other functions, host children and modified program requirements", () => {
    const input = fixture().input,
      target = input.playerView.own.rig!.find((c) => c.memoryLimitBonus === 1)!;
    const protectedHardware = input.playerView.own.rig!.find(
      (c) => (c.maxHandSizeBonus ?? 0) > 0,
    )!;
    expect(
      installedMemorySurplusQuote(input, {
        ...protectedHardware,
        memoryLimitBonus: 1,
      }),
    ).toBeUndefined();
    const hosted = structuredClone(input);
    hosted.playerView.own.rig!.find((c) => c.type === "program")!.hostedOn =
      target.instanceId;
    expect(installedMemorySurplusQuote(hosted, target)).toBeUndefined();
    const modified = structuredClone(input);
    modified.playerView.own.rig!.find((c) => c.type === "program")!.memoryCost =
      9;
    expect(installedMemorySurplusQuote(modified, target)).toBeUndefined();
  });
  it("uses the native Economy choice to sell a pure capacity surplus", () => {
    const f = fixture(),
      input = f.input;
    expect(Object.values(f.validation).every(Boolean)).toBe(true);
    expect(input.playerView.own).toMatchObject({
      credits: 19,
      memoryUsed: 6,
      memoryLimit: 12,
    });
    input.planningStateIdentity = buildPlanningStateIdentity(input);
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      f.runtime,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      f.runtime.residentPlanPortfolio!,
    );
    const before = JSON.stringify(input),
      d = chooseAiAction(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(d.fallbackUsed).toBe(false);
    expect(d.timeoutUsed).toBe(false);
    const a = input.legalActions.find((a) => a.actionId === d.actionId)!;
    expect(a.type).toBe("resolve_choice");
    expect(a.expiresAtStateVersion).toBe(input.playerView.stateVersion);
    const selectedOptionIds = d.selectedChoices?.selectedOptionIds;
    if (!Array.isArray(selectedOptionIds) || selectedOptionIds.length !== 1)
      throw Error("Expected one bound native liquidation option");
    const target = input.playerView.own.rig!.find(
      (c) => "card_" + c.instanceId === selectedOptionIds[0],
    );
    expect(target?.memoryLimitBonus).toBeGreaterThan(0);
    expect(
      input.playerView.own.memoryLimit! - target!.memoryLimitBonus!,
    ).toBeGreaterThanOrEqual(9);
    const p = d.decisionDebug?.planFirstDecision;
    expect(p?.selectedPlan?.moduleId).toBe("runner.economy");
    expect(p?.route?.actionId).toBe(a.actionId);
    expect(p?.route?.stateVersion).toBe(input.playerView.stateVersion);
    expect(p?.selectedStep?.planInstanceId).toBe(p?.leafExecutorInstanceId);
  });
});
