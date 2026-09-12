import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-draw-tax-funding-d116.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("funds the publicly quoted draw tax before the defensive hand-buffer draw", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(input.playerView.own).toMatchObject({
    credits: 0,
    clicks: 2,
    tags: 0,
  });
  expect(
    input.legalActions.find((a) => a.type === "draw_card")?.payload
      ?.visibleDrawTaxSourceCount,
  ).toBe(1);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.gain_credit");
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  expect(portfolio.rootForegroundInstanceId).toBe(
    "plan:runner.defense_and_recovery:runner",
  );
  expect(portfolio.executorInstanceId).toBe(portfolio.rootForegroundInstanceId);
  expect(
    portfolio.instances.find(
      (i) => i.instanceId === portfolio.executorInstanceId,
    )?.moduleState,
  ).toMatchObject({
    phase: "build_reaction_reserve",
    signals: {
      reactionReserveNeed: {
        targetCredits: 1,
        gap: 1,
        evidenceCode: "runner_visible_draw_tax_preparation",
      },
    },
  });
});

it.each(["hidden_source", "already_funded", "last_click", "hand_buffer_met"])(
  "does not invent draw funding for %s",
  (variant) => {
    const { input, runtime } = structuredClone(checkpointJson) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    if (variant === "hidden_source") {
      input.legalActions.find(
        (a) => a.type === "draw_card",
      )!.payload!.visibleDrawTaxSourceCount = 0;
      for (const server of input.playerView.servers)
        server.root = server.root.filter(
          (c) => c.definitionId !== "onr_v1_313_city-surveillance",
        );
    }
    if (variant === "already_funded") input.playerView.own.credits = 1;
    if (variant === "last_click") input.playerView.own.clicks = 1;
    if (variant === "hand_buffer_met")
      input.playerView.own.gripOrHq.push({
        ...input.playerView.own.gripOrHq[0]!,
        instanceId: "boundary-extra-hand-card",
      });
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.some((a) => a.actionId === decision.actionId),
    ).toBe(true);
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    const state = portfolio.instances.find(
      (i) => i.moduleId === "runner.defense_and_recovery",
    )?.moduleState as
      | { signals?: { reactionReserveNeed?: { evidenceCode: string } } }
      | undefined;
    expect(state?.signals?.reactionReserveNeed?.evidenceCode).not.toBe(
      "runner_visible_draw_tax_preparation",
    );
  },
);
