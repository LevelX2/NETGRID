import { describe, expect, it } from "vitest";

import knownDamageAmbushJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-01-known-damage-ambush-jack-out.json";
import marginalMemoryInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-02-marginal-memory-install-yield.json";
import confirmedDamageReserveJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-03-confirmed-damage-reaction-reserve.json";
import safeRemoteContinueJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-04-safe-remote-continue-control.json";
import usefulBreakerInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-05-useful-breaker-install-control.json";
import visiblePayoffRunJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-f5d27033-06-visible-payoff-run-control.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match F5D27033 runner flatline-risk checkpoints", () => {
  it.each([
    [
      "jacks out before the sole known advanced damage ambush",
      knownDamageAmbushJson,
    ],
    [
      "lets a much stronger action displace a marginal memory install",
      marginalMemoryInstallJson,
    ],
    [
      "keeps reaction reserve under confirmed damage and a locked hand buffer",
      confirmedDamageReserveJson,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it.each([
    ["continues an unambiguous safe remote run", safeRemoteContinueJson],
    [
      "keeps the useful breaker resident while executing stronger R&D pressure",
      usefulBreakerInstallJson,
    ],
    ["still takes a run with visible immediate payoff", visiblePayoffRunJson],
  ])("control: %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("does not expose the later hidden flatline combo to the reserve decision", () => {
    const checkpoint = fixture(confirmedDamageReserveJson);
    const publicPrefix = JSON.stringify(checkpoint.engine.eventPrefix);

    expect(publicPrefix).not.toContain("onr_v1_284_chance-observation");
    expect(publicPrefix).not.toContain("onr_v1_307_urban-renewal");
    expect(publicPrefix).not.toContain("Chance Observation");
    expect(publicPrefix).not.toContain("Urban Renewal");
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    [
      "cp-f5d27033-05-useful-breaker-install-control",
      "cp-f5d27033-06-visible-payoff-run-control",
    ],
  );
  if (
    checkpoint.checkpointId === "cp-f5d27033-05-useful-breaker-install-control"
  ) {
    checkpoint.expectation.planExecution!.acceptableCapabilities = [
      "pressure_rd_access",
    ];
  }
  return checkpoint;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
