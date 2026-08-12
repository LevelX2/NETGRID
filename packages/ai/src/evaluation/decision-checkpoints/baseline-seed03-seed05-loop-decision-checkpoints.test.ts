import { describe, expect, it } from "vitest";

import brokerOverTargetJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed03-01-broker-over-target.json";
import richCreditLoopJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed03-02-rich-credit-loop.json";
import newsgroupRichLoopJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed05-01-newsgroup-rich-loop.json";
import newsgroupLowCreditControlJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed05-02-newsgroup-low-credit-control.json";
import netwatchNoConversionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed05-03-netwatch-no-conversion.json";
import postRemediationNewsgroupLoopJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed05-04-post-remediation-newsgroup-loop.json";
import thirdTraceWithoutPayoffJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed05-05-third-trace-without-payoff.json";
import backgroundBankYieldsJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-baseline-seed05-06-background-bank-yields.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("baseline seed 03 and seed 05 exact loop checkpoints", () => {
  it.each([
    [
      "stops adding Broker credits after the combined target is reached",
      brokerOverTargetJson,
    ],
    [
      "converts a rich Seed 03 runner turn instead of taking another basic credit",
      richCreditLoopJson,
    ],
    [
      "does not repeat Newsgroup Filter with 53 credits and legal development",
      newsgroupRichLoopJson,
    ],
    [
      "does not force a no-conversion Netwatch trace into a 109-credit runner",
      netwatchNoConversionJson,
    ],
    [
      "pays the run lock instead of continuing late Newsgroup economy",
      postRemediationNewsgroupLoopJson,
    ],
    [
      "continues the funded protected agenda instead of landing an unconvertible last-click tag",
      thirdTraceWithoutPayoffJson,
    ],
    [
      "builds the required volatile-breaker hand buffer instead of background Broker investment",
      backgroundBankYieldsJson,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("still repeats Newsgroup Filter while the runner is below reserve", () => {
    expectCheckpointToPass(fixture(newsgroupLowCreditControlJson));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
}
