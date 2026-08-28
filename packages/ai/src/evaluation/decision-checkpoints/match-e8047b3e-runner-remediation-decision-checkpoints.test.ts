import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import shellDuplicateJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8047b3e-d40-replay.json";
import shellAccelerationJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8047b3e-d63-replay.json";
import conferenceHoldJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8047b3e-d72-replay.json";
import encounterBudgetJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8047b3e-d78-replay.json";
import lethalTraceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8047b3e-d95-replay.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { assessTraceBidCandidates } from "../../runtime/trace-bid-assessment";
import { latestTraceContext } from "../../runtime/trace-context";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type ReconstructedRunnerDecisionCapture = {
  schemaVersion: "netgrid-ai-decision-checkpoint-replay-v1";
  provenance: "reconstructed_from_persisted_decision_sources";
  actor: "runner";
  stateVersion: number;
  stateHash: string;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

describe("match e8047b3e Runner remediation checkpoints", () => {
  it("does not prepare a second copy already waiting on Shell Traders", () => {
    const { input, decision } = replayDecision(shellDuplicateJson);
    const duplicatePreparation = input.legalActions.find((action) =>
      action.actionId.includes(
        "runner_onr_v1_059_self-modifying-code_1.set_aside_from_grip",
      ),
    );
    expect(duplicatePreparation).toBeDefined();

    expect(decision.actionId).not.toBe(duplicatePreparation?.actionId);
    expect(decision.decisionDebug?.planFirstDecision?.dispositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: duplicatePreparation?.actionId,
          disposition: "explicitly_nonproductive",
          ownerModuleId: "runner.shell_traders_pipeline",
          evidenceCode:
            "runner_shell_traders_rejected_pending_duplicate_definition",
        }),
      ]),
    );
  });

  it("does not pay to accelerate a Shell Traders card without a current-use need", () => {
    const { input, decision } = replayDecision(shellAccelerationJson);
    const paidAcceleration = input.legalActions.find(
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.delayedInstallAbility === "remove_shell_counter",
    );
    expect(paidAcceleration).toBeDefined();

    expect(decision.actionId).not.toBe(paidAcceleration?.actionId);
    expect(decision.decisionDebug?.planFirstDecision?.dispositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: paidAcceleration?.actionId,
          disposition: "explicitly_nonproductive",
          ownerModuleId: "runner.shell_traders_pipeline",
          evidenceCode: "runner_shell_traders_holds_unneeded_paid_acceleration",
        }),
      ]),
    );
  });

  it("lets Score! compete while Top Runners' Conference only defers runs", () => {
    const { input, decision } = replayDecision(conferenceHoldJson);
    const score = input.legalActions.find(
      (action) => action.label === "Score! spielen",
    );
    const selectedAction = input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );
    expect(score).toBeDefined();
    expect(selectedAction).toBeDefined();

    expect(decision).toMatchObject({
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.develop_board_and_hand",
      },
    });
    expect(selectedAction?.type).not.toBe("start_run");
    expect(decision.decisionDebug?.planFirstDecision?.dispositions).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ actionId: score?.actionId }),
      ]),
    );
    expect(decision.decisionDebug?.planFirstDecision?.portfolio).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          moduleId: "runner.recurring_economy",
          phase: "hold",
          viability: "blocked",
        }),
      ]),
    );
  });

  it("preserves the contest parent and pumps Snowball instead of accepting a dearer Trace line", () => {
    const { input, decision } = replayDecision(encounterBudgetJson);
    const snowballPump = input.legalActions.find(
      (action) =>
        action.type === "pump_breaker" && action.label.startsWith("Snowball:"),
    );
    expect(snowballPump).toBeDefined();

    expect(decision).toMatchObject({
      actionId: snowballPump?.actionId,
      fallbackUsed: false,
      decisionDebug: {
        planKind: "runner.convert_run_window",
        planFirstDecision: {
          rootPlanInstanceId: expect.stringContaining("runner.contest_remote"),
          route: {
            actionType: "pump_breaker",
          },
        },
      },
    });
    expect(decision.evidence).not.toContain(
      "run_plan_information_budget_exceeded",
    );
  });

  it("spends the full visible safe bid against Neon Guillotine's credible tag-kill turn", () => {
    const capture = structuredClone(
      lethalTraceJson,
    ) as ReconstructedRunnerDecisionCapture;
    const choice = capture.input.playerView.pendingChoice;
    if (!choice) throw new Error("Expected the persisted Trace choice.");

    const result = assessTraceBidCandidates(
      capture.input as AiDecisionInput,
      choice,
      latestTraceContext(capture.input),
    );

    expect(result?.assessment).toMatchObject({
      stakes: "terminal",
      rationalTarget: 5,
      rationalRange: [5, 5],
      reserveTarget: 0,
    });
    expect(result?.candidates.map((candidate) => candidate.bid)).toEqual([5]);
  });
});

function replayDecision(unchecked: unknown) {
  const capture = structuredClone(
    unchecked,
  ) as ReconstructedRunnerDecisionCapture;
  const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
  if (!deckSnapshotId) throw new Error("Expected a captured deck snapshot.");
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId, capture.runtime);
  return {
    input: capture.input,
    decision: chooseAiAction(capture.input as AiDecisionInput),
  };
}
