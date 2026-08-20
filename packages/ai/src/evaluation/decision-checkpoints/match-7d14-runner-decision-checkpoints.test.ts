import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import staleFundingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-7d14-01-urgent-run-over-stale-funding.json";
import fundedInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-7d14-01b-urgent-run-over-funded-install.json";
import matchpointDiscardJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-7d14-02-matchpoint-discard.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 7D14 runner decision checkpoints", () => {
  it("installs HQ Interface to open its exact central-pressure payoff", () => {
    expectCheckpointToPass(fixture(staleFundingJson));
  });

  it("keeps the funded HQ Interface install bound to the central plan", () => {
    expectCheckpointToPass(fixture(fundedInstallJson));
  });

  it("retains HQ closeout and immediate liquidity at matchpoint discard", () => {
    expectCheckpointToPass(fixture(matchpointDiscardJson));
  });

  it("draws the missing AP answer when the competing R&D path is not payable", () => {
    const noPayableRun = mutateFixture(staleFundingJson, (checkpoint) => {
      checkpoint.engine.testOnlyGameState.runner.credits = 0;
      checkpoint.source.kind = "synthetic_companion";
      checkpoint.source.findingId = "7D14-C01-FUND-WITHOUT-PAYABLE-RUN";
      checkpoint.expectation = {
        acceptableActions: [{ type: "draw_card" }],
        runTargets: [
          {
            actionId: "runner.start_run.rd",
            pathPassability: "blocked_unpayable",
          },
        ],
        planExecution: {
          acceptablePlanKinds: ["runner.rig_and_coverage"],
          acceptableCapabilities: ["draw_for_answer_breaker_ap"],
          requiredAssessmentEvidence: ["target:remote_1"],
        },
      };
    });

    expectCheckpointToPass(noPayableRun);
  });

  it("may discard the hand copy when the same HQ interface is installed", () => {
    const installedEquivalent = mutateFixture(
      matchpointDiscardJson,
      (checkpoint) => {
        const state = checkpoint.engine.testOnlyGameState;
        const handInstanceId = "runner_onr_v1_129_hq-interface_1";
        const installedInstanceId =
          "runner_onr_v1_129_hq-interface_companion_installed";
        const handCard = state.cardInstances[handInstanceId];
        if (!handCard) throw new Error("Expected HQ Interface in grip");
        state.cardInstances[installedInstanceId] = {
          ...handCard,
          instanceId: installedInstanceId,
          zone: { side: "runner", zone: "rig" },
        };
        state.runner.rig.hardware.push(installedInstanceId);
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "7D14-C02-DISCARD-INSTALLED-EQUIVALENT";
        checkpoint.expectation = {
          discardChoice: {
            mustDiscardDefinitionIds: ["onr_v1_129_hq-interface"],
          },
        };
      },
    );

    expectCheckpointToPass(installedEquivalent);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    [
      "cp-7d14-01-urgent-run-over-stale-funding",
      "cp-7d14-01b-urgent-run-over-funded-install",
    ],
  );
  return checkpoint;
}

function mutateFixture(
  value: unknown,
  mutation: (fixture: AiDecisionCheckpointV1) => void,
): AiDecisionCheckpointV1 {
  const result = fixture(value);
  mutation(result);
  result.engine.stateHash = hashGameState(result.engine.testOnlyGameState);
  return result;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
