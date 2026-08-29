import { describe, expect, it } from "vitest";

import priorityWreckD49Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-01-priority-wreck-spend-d49.json";
import priorityWreckD76Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-02-priority-wreck-spend-d76.json";
import jettisonWindowD26Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-03-jettison-window-d26.json";
import retainJettisonD34Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-04-retain-jettison-d34.json";
import rnzTargetD66Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-05-rnz-target-d66.json";
import noLateRnzD159Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-06-no-late-rnz-d159.json";
import probeNotFundingD88Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-07-probe-not-funding-d88.json";
import rdAfterKnownTopInvalidatedD95Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-08-rd-after-known-top-invalidated-d95.json";
import hqProbeD109Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-09-hq-probe-classification-d109.json";
import noRepeatRdD115Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-10-no-repeat-rd-d115.json";
import noDeadFundingD127Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-11-no-dead-funding-d127.json";
import remote2ProbeD143Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-12-remote2-probe-d143.json";
import noBreakWithoutPayoffD144Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-13-no-break-without-payoff-d144.json";
import jackOutFireWallD92Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-9fef-14-jack-out-fire-wall-control-d92.json";
import earlyCheckRunJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-e8886-05-early-remote-check-run.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 9FEF runner decision checkpoints", () => {
  it.each([
    [
      "F01 chooses a positive Priority Wreck spend at D49",
      priorityWreckD49Json,
    ],
    [
      "F01 chooses a positive Priority Wreck spend at D76",
      priorityWreckD76Json,
    ],
    ["F02 converts Broker liquidity at D26", jettisonWindowD26Json],
    ["F02 retains Jettison during the D34 discard", retainJettisonD34Json],
    ["F03 targets useful Corp servers with RNZ at D66", rnzTargetD66Json],
    ["F03 builds the liquid reserve at D159", noLateRnzD159Json],
    ["F04 starts the available Broker bank at D88", probeNotFundingD88Json],
    [
      "F05 follows the current HQ pressure route at D95",
      rdAfterKnownTopInvalidatedD95Json,
    ],
    ["F06 builds the liquid reserve at D109", hqProbeD109Json],
    ["F05 avoids the repeated costly R&D run at D115", noRepeatRdD115Json],
    ["F07 builds the liquid reserve at D127", noDeadFundingD127Json],
    ["F08 classifies the D143 remote run as a probe", remote2ProbeD143Json],
    [
      "F08 continues the hidden-root contest through Reinforced Wall at D144",
      noBreakWithoutPayoffD144Json,
    ],
  ])("satisfies %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it.each([
    ["the historical Fire Wall checkout at D92", jackOutFireWallD92Json],
    ["the existing early unknown-ICE information run", earlyCheckRunJson],
  ])("keeps the positive information-run control: %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    [
      "9FEF-F02-JETTISON-WINDOW-D26",
      "9FEF-F03-RNZ-TARGET-D66",
      "9FEF-F03-NO-LATE-RNZ-D159",
      "9FEF-F05-RD-AFTER-KNOWN-TOP-INVALIDATED-D95",
      "9FEF-F06-HQ-PROBE-CLASSIFICATION-D109",
    ],
  );
  return checkpoint;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
