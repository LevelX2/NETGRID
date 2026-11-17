import { afterEach, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { sanitizeAiDecisionDebug } from "@netgrid/shared";
import game28 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r05-g28-d378-recovery-funding.json";
import game38 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r05-g38-d306-recovery-hazard.json";
import afterRecovery38 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r05-g38-d307-after-recovery.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { quoteRunnerRunTarget } from "../../runner-run-target-evaluation";
import { createDeckCapabilitiesContext } from "../../runtime/deck-capabilities-context";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type FundingCheckpoint = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

function removeFallGuy(input: AiDecisionInputWithDeckCapabilities) {
  input.playerView.own.rig = input.playerView.own.rig!.filter(
    (card) => card.definitionId !== 373,
  );
}

afterEach(resetResidentPlanPortfolioMemory);

it.each([game38, afterRecovery38])(
  "takes the funded terminal run with one installed Fall Guy (%#)",
  (source) => {
    const { input, runtime } = structuredClone(
      source,
    ) as unknown as FundingCheckpoint;
    const runActionId = "runner.start_run.remote_1";
    const { target } = quoteRunnerRunTarget({
      input,
      runActionId,
      targetServerId: "remote_1",
      deckCapabilities:
        createDeckCapabilitiesContext().deckCapabilitiesForInput(input),
    })!;
    const traceHazards = target.visibleIceRunHazards?.filter(
      (hazard) => hazard.kind === "trace_tag",
    );
    expect(traceHazards).toHaveLength(2);
    expect(
      traceHazards?.filter((hazard) => hazard.minimumAvoidanceCost === 0),
    ).toHaveLength(1);
    expect(traceHazards?.every((hazard) => !hazard.unavoidable)).toBe(true);

    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(runActionId);
    expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
    ).toBe("runner.contest_remote");
  },
);

it("revalidates the recovered loan when the terminal hazards still need funding", () => {
  const cp = structuredClone(afterRecovery38) as unknown as FundingCheckpoint;
  removeFallGuy(cp.input);
  const loan = cp.input.legalActions.find(
    (action) =>
      action.type === "install_card" &&
      cp.input.playerView.own.gripOrHq.some(
        (card) =>
          card.instanceId === action.source &&
          card.definitionId === 380,
      ),
  )!;
  expect(loan).toBeDefined();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(cp.input);
  expect(decision.actionId).toBe(loan.actionId);
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(
    sanitizeAiDecisionDebug(decision.decisionDebug)?.planFirstDecision,
  ).toMatchObject({
    rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
    selectedPlan: {
      moduleId: "runner.economy",
      parentNeedId: "run-support:remote:remote_1",
    },
    route: {
      actionId: loan.actionId,
      stateVersion: cp.input.playerView.stateVersion,
    },
  });
});

it.each([
  "native",
  "trace_without_prevention",
  "one_credit_short",
  "one_click_short",
] as const)(
  "quotes the complete known recovery, debt and basic-credit contest: %s",
  (variant) => {
    const cp = structuredClone(
      variant === "trace_without_prevention" ? game38 : game28,
    ) as unknown as FundingCheckpoint;
    if (variant === "trace_without_prevention") removeFallGuy(cp.input);
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
    if (variant === "native" || variant === "trace_without_prevention") {
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
