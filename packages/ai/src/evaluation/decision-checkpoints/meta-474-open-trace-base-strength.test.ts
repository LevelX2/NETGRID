import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { assessCorpTraceBid } from "../../runtime/corp-trace-bid-assessment";
import { selectedBidChoiceOptionId } from "../../runtime/bid-choice-option";
import { latestTraceContext } from "../../runtime/trace-context";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-r5-g40-d250.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return {
    input: { ...cp.input, ...buildAiDecisionInputDto(cp.input) },
    runtime: cp.runtime,
  };
}

describe("pairing 474: open Trace base strength is already funded", () => {
  it("needs two additional credits for native Trace3 against the public four-credit maximum", () => {
    const { input } = checkpoint();
    const context = latestTraceContext(input);
    expect(context).toMatchObject({
      traceLimit: 3,
      traceRulesProfile: "modern_open",
      runnerMaximumPreRevealStrength: 4,
    });
    expect(
      assessCorpTraceBid({
        input,
        traceContext: context,
        maxBid: 6,
        sourceDefinitionId: context.sourceDefinitionId,
      }),
    ).toMatchObject({
      recommendedBid: 2,
      minimumGuaranteedBid: 2,
      reason: "guaranteed_native_trace_payoff",
    });
    expect(
      selectedBidChoiceOptionId(
        input,
        input.playerView.pendingChoice!,
        context,
      ),
    ).toBe("bid_2");
  });

  it("keeps the original current Choice, action, root and mandatory executor", () => {
    const { input, runtime } = checkpoint();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision).toMatchObject({
      actionId: "corp.resolve_choice",
      fallbackUsed: false,
      timeoutUsed: false,
      selectedChoices: {
        choiceId: input.playerView.pendingChoice!.choiceId,
        selectedOptionIds: ["bid_2"],
      },
    });
    expect(input.legalActions[0]!.expiresAtStateVersion).toBe(249);
    expect(
      input.playerView.pendingChoice!.options.some(
        (o) => o.id === "bid_2" && o.value === 2,
      ),
    ).toBe(true);
    const plan = decision.decisionDebug!.planFirstDecision!;
    expect(plan).toMatchObject({
      stateVersion: 249,
      lane: "engine_window",
      rootPlanInstanceId: "run:run_239",
      leafExecutorInstanceId: "rules.window_resolution",
      selectedStep: {
        planInstanceId: "rules.window_resolution",
        stepId: "run.encounter_ice:249",
      },
      engineWindowAction: { actionId: decision.actionId },
    });
  });

  it.each([
    ["modern_open", 0],
    ["classic_blind", 3],
    ["classic_blind_corp_ties", 2],
  ] as const)(
    "uses the Engine base and tie rule for %s",
    (traceRulesProfile, expectedBid) => {
      const { input } = checkpoint();
      const context = {
        ...latestTraceContext(input),
        traceRulesProfile,
        runnerMaximumPreRevealStrength: 2,
      };
      expect(
        assessCorpTraceBid({
          input,
          traceContext: context,
          maxBid: 6,
          sourceDefinitionId: context.sourceDefinitionId,
        }).recommendedBid,
      ).toBe(expectedBid);
    },
  );

  it("does not claim a guaranteed bid above the actual offered capacity", () => {
    const { input } = checkpoint();
    const context = latestTraceContext(input);
    expect(
      assessCorpTraceBid({
        input,
        traceContext: context,
        maxBid: 1,
        sourceDefinitionId: context.sourceDefinitionId,
      }).recommendedBid,
    ).toBe(0);
  });

  it("reports unknown open base strength instead of inventing zero", () => {
    const { input } = checkpoint();
    const context = { ...latestTraceContext(input), traceLimit: undefined };
    expect(
      assessCorpTraceBid({
        input,
        traceContext: context,
        maxBid: 6,
        sourceDefinitionId: context.sourceDefinitionId,
      }),
    ).toEqual({ recommendedBid: 0, reason: "unknown_trace_context" });
  });
});
