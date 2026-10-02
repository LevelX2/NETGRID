import { readFileSync } from "node:fs";
import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  chooseAiAction,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../index";
import { restoreStrategicIntentMemorySnapshot } from "../../strategic-intent-memory";

type CapturedCheckpoint = {
  input: AiDecisionInput;
  validation: Record<string, boolean>;
  runtime: {
    strategicIntent: Parameters<typeof restoreStrategicIntentMemorySnapshot>[1];
    residentPlanPortfolio: Parameters<
      typeof restoreResidentPlanPortfolioMemorySnapshot
    >[1];
  };
};

function checkpoint(index: number): CapturedCheckpoint {
  const captured = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-472-06-corp-terminal-hq-defense-d" +
          index +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as CapturedCheckpoint;
  expect(Object.values(captured.validation)).toEqual(Array(9).fill(true));
  return captured;
}

function restore(captured: CapturedCheckpoint) {
  restoreStrategicIntentMemorySnapshot(
    captured.input,
    captured.runtime.strategicIntent,
    captured.input.ownDeckSnapshot!.deckSnapshotId,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    captured.input,
    captured.runtime.residentPlanPortfolio,
  );
}

function expectTerminalHqClosure(input: AiDecisionInput) {
  const decision = chooseAiAction(input, { persistTacticalPlanMemory: false });
  expect(decision).toMatchObject({
    actionId: expect.stringMatching(
      /^corp\.install_card\.corp_onr_v1_244_filter_[12]\.hq\./,
    ),
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(
    input.legalActions.some((action) => action.actionId === decision.actionId),
  ).toBe(true);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
    leafExecutorInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
    priority: { effectiveClass: "P2" },
    selectedStep: {
      stepId: "plan:corp.defend_servers:server-defense-portfolio:allocate",
    },
  });
}

describe("pairing 472: exact terminal central-defense ownership", () => {
  it("executes funded terminal HQ closure ahead of distant nonterminal score funding", () => {
    const captured = checkpoint(110);
    restore(captured);
    expectTerminalHqClosure(captured.input);
  });

  it("preserves the HQ priority after the actual forgo and defensive draw sequence", () => {
    const first = checkpoint(108);
    restore(first);
    const forgo = chooseAiAction(first.input, {
      persistTacticalPlanMemory: false,
    });
    expect(forgo.actionId).toBe("corp.forgo_action");
    expect(forgo.fallbackUsed || forgo.timeoutUsed).toBe(false);

    const draw = chooseAiAction(checkpoint(109).input, {
      persistTacticalPlanMemory: false,
    });
    expect(draw).toMatchObject({
      actionId: "corp.draw_card",
      fallbackUsed: false,
      timeoutUsed: false,
    });
    expect(draw.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      "plan:corp.defend_servers:server-defense-portfolio",
    );

    expectTerminalHqClosure(checkpoint(110).input);
  });
});
