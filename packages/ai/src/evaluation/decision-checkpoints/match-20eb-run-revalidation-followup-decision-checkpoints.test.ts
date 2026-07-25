import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import upgradeOnlyRemoteJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-20eb-07-no-upgrade-only-matchpoint-run-d92.json";
import upgradeOnlyContinuationJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-20eb-08-revalidate-upgrade-only-run-d113.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

describe("match 20EB run revalidation follow-up checkpoints", () => {
  it("does not force a matchpoint run on a root known by deduction to contain only an upgrade", () => {
    expectCheckpointToPass(fixture(upgradeOnlyRemoteJson));
  });

  it("jacks out after the only root payoff is publicly revealed as an upgrade and liquidity is exhausted", () => {
    expectCheckpointToPass(fixture(upgradeOnlyContinuationJson));
  });

  it("keeps a newly installed unknown root evaluable but takes the stronger open R&D route", () => {
    const newlyInstalledUnknown = mutateFixture(
      upgradeOnlyRemoteJson,
      (checkpoint) => {
        const replacedEvent = checkpoint.engine.eventPrefix.find(
          (event) => event.eventId === "evt_183",
        );
        if (!replacedEvent) throw new Error("Expected evt_183 in event prefix");
        replacedEvent.type = "install_card";
        replacedEvent.visibilityClass = "private_to_side";
        replacedEvent.publicPayload = {
          actor: "corp",
          actionType: "install_card",
          label: "Korp installiert eine Karte.",
          actionCostClicks: 1,
          serverLabel: "Remote 1",
          installPlacement: "root",
          zoneLabel: "Remote",
          redactedKind: "installed_card",
          effectKind: "install_card",
          targets: {
            serverLabel: "Remote 1",
            redactedKind: "installed_card",
          },
          visibility: {
            class: "private_to_side",
            redactedKind: "installed_card",
          },
        };
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId =
          "20EB-C06-POST-SCORE-UNKNOWN-REMOTE-CONTEST";
        checkpoint.expectation = {
          acceptableActions: [
            { type: "start_run", targetServerId: "rd" },
          ],
          planExecution: {
            acceptablePlanKinds: ["runner.pressure_central"],
            acceptableCapabilities: ["pressure_rd_information"],
            requiredAssessmentEvidence: ["target:rd"],
          },
        };
      },
    );

    const result = runAiDecisionCheckpoint(newlyInstalledUnknown);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(
      evaluateRunnerRunTargets({ input: result.input }).find(
        (target) => target.targetServerId === "remote_1",
      ),
    ).toMatchObject({
      knownAccessState: "unknown",
      recommendation: "run_if_free",
      pathPassability: "reachable",
    });
  });

  it("continues toward a visible upgrade trash payoff when sufficient liquidity remains", () => {
    const fundedContinuation = mutateFixture(
      upgradeOnlyContinuationJson,
      (checkpoint) => {
        checkpoint.engine.testOnlyGameState.runner.credits = 12;
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.source.findingId = "20EB-C07-FUNDED-UPGRADE-TRASH-PAYOFF";
        checkpoint.expectation = {
          acceptableActions: [{ type: "continue_run" }],
        };
      },
    );

    expectCheckpointToPass(fundedContinuation);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["cp-20eb-07-no-upgrade-only-matchpoint-run-d92"],
  );
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
