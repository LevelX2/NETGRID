import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import delegatedCoverageJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-329-airport-locker-delegated-coverage-d240.json";
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

type ReconstructedDecisionCapture = {
  schemaVersion: "netgrid-ai-decision-checkpoint-replay-v1";
  provenance: "reconstructed_from_persisted_decision_sources";
  actor: "runner";
  stateVersion: number;
  stateHash: string;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

describe("pairing 329 delegated Airport Locker coverage checkpoint", () => {
  it("keeps the central-pressure root and exact coverage child through the Engine choice", () => {
    const capture = structuredClone(
      delegatedCoverageJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);
    const portfolio = residentPlanPortfolioSnapshot(capture.input);
    const executor = portfolio?.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );

    expect(decision).toMatchObject({
      actionId: "runner.resolve_choice",
      reasonCode: "plan_first.engine_window",
      fallbackUsed: false,
      selectedChoices: {
        choiceId: "p3_38_search_stack_install_239",
        selectedOptionIds: [
          "card_runner_onr_classic_031_rent-i-con_2",
        ],
      },
    });
    expect(portfolio).toMatchObject({
      stateVersion: 239,
      rootForegroundInstanceId: "plan:runner.pressure_central:central%3Ard",
      executorInstanceId: expect.stringContaining(
        "plan:runner.rig_and_coverage:coverage%3Abreaker_wall",
      ),
    });
    expect(executor).toMatchObject({
      moduleId: "runner.rig_and_coverage",
      parentInstanceId: portfolio?.rootForegroundInstanceId,
      parentNeedId: expect.stringContaining("coverage:breaker_wall"),
      moduleState: {
        kind: "coverage",
        selectedSearchStateVersion: 239,
        gap: {
          requesterPlanInstanceId: portfolio?.rootForegroundInstanceId,
          directSearchChoiceBindings: [
            expect.objectContaining({
              targetCardInstanceId:
                "runner_onr_classic_031_rent-i-con_2",
              targetDefinitionId: "onr_classic_031_rent-i-con",
            }),
          ],
        },
      },
    });
  });
});
