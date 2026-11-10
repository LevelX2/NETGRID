import { afterEach, expect, it } from "vitest";
import game27 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r05-g27-d211-composite-funding.json";
import game25 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r06-g25-d351-bank-debt-credit.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it.each([game27, game25])(
  "starts the complete bank funding route at its actual owner (%#)",
  (source) => {
    const cp = structuredClone(source) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    const payout = cp.input.legalActions.find((action) =>
      action.actionId.endsWith(":withdraw_credits"),
    )!;
    expect(payout).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const before = JSON.stringify(cp.input);
    const decision = chooseAiAction(cp.input);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    expect(decision.actionId).toBe(payout.actionId);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      selectedPlan: {
        moduleId: "runner.credit_bank",
        parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        parentNeedId: "run-support:remote:remote_1",
      },
      route: {
        actionId: payout.actionId,
        stateVersion: cp.input.playerView.stateVersion,
      },
    });
    expect(JSON.stringify(cp.input)).toBe(before);
  },
);
