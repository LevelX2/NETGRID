import { afterEach, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { sanitizeAiDecisionDebug } from "@netgrid/shared";
import game28 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r05-g28-d378-recovery-funding.json";
import game38 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r05-g38-d306-recovery-hazard.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it.each([
  "native",
  "native_trace_hazard",
  "one_credit_short",
  "one_click_short",
] as const)(
  "quotes the complete known recovery, debt and basic-credit contest: %s",
  (variant) => {
    const cp = structuredClone(
      variant === "native_trace_hazard" ? game38 : game28,
    ) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    if (variant === "one_credit_short") cp.input.playerView.own.credits = 13;
    if (variant === "one_click_short") cp.input.playerView.own.clicks = 3;
    const recovery = cp.input.legalActions.find(
      (action) =>
        action.payload?.cardImplementationEffectKind ===
        "move_top_trash_to_grip",
    )!;
    expect(recovery).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const stateFingerprint = () =>
      createHash("sha256")
        .update(
          JSON.stringify({
            playerView: cp.input.playerView,
            legalActions: cp.input.legalActions,
          }),
        )
        .digest("hex");
    const before = stateFingerprint();
    const decision = chooseAiAction(cp.input);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    if (variant === "native" || variant === "native_trace_hazard") {
      expect(decision.actionId).toBe(recovery.actionId);
      expect(
        sanitizeAiDecisionDebug(decision.decisionDebug)?.planFirstDecision,
      ).toMatchObject({
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        route: { actionId: recovery.actionId },
      });
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
        selectedPlan: {
          moduleId: "runner.economy",
          parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
          parentNeedId: "run-support:remote:remote_1",
        },
        route: {
          actionId: recovery.actionId,
          stateVersion: cp.input.playerView.stateVersion,
        },
      });
    } else expect(decision.actionId).not.toBe(recovery.actionId);
    expect(stateFingerprint()).toBe(before);
  },
);
