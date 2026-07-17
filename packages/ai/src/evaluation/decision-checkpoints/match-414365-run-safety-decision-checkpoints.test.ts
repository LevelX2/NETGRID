import { describe, expect, it } from "vitest";

import runningInterferenceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-414365-01-running-interference-not-economy-d32.json";
import immediateTagRemovalJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-414365-02-data-raven-immediate-tag-control-d52.json";
import dataRavenCounterRemovalJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-414365-03-data-raven-counter-removal-d54.json";
import knownDataRavenRunJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-414365-04-known-data-raven-run-denial-d59.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 414365 runner run-safety checkpoints", () => {
  it.each([
    [
      "does not reduce Running Interference to economy development",
      runningInterferenceJson,
    ],
    [
      "removes the persistent Data Raven counter before funding",
      dataRavenCounterRemovalJson,
    ],
    [
      "does not start the known unbreakable Data Raven HQ run",
      knownDataRavenRunJson,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("control: still removes the immediate Data Raven tag", () => {
    expectCheckpointToPass(fixture(immediateTagRemovalJson));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
