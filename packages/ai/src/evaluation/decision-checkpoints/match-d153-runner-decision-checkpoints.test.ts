import { describe, expect, it } from "vitest";

import payForEarlyRemoteAccessD7Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-01-pay-for-early-remote-access-d7.json";
import hqSaturationD24Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-02-hq-saturation-d24.json";
import noRepeatHqD32Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-03-no-repeat-hq-d32.json";
import releaseHqPlanD50Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-04-release-hq-plan-d50.json";
import preserveHqFacecheckD61Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-05-preserve-hq-facecheck-d61.json";
import noJunkyardCashoutD124Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-06-no-junkyard-as-bank-cashout-d124.json";
import releaseRemotePlanD131Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-07-release-low-value-remote-d131.json";
import breakBeforeEtrD134Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-08-break-before-etr-d134.json";
import buildRemoteReserveD161Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-09-build-deep-remote-reserve-d161.json";
import liquidateForRemoteD167Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-10-liquidate-for-remote-threat-d167.json";
import cashoutForRdD179Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-11-cashout-for-rd-d179.json";
import cashoutForRdD185Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-12-cashout-for-rd-d185.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match D153 Runner decision checkpoints", () => {
  it.each([
    [
      "F01 pays for the early unknown remote access at D7",
      payForEarlyRemoteAccessD7Json,
    ],
    ["F02 releases saturated HQ pressure at D24", hqSaturationD24Json],
    ["F02 avoids the repeated HQ run at D32", noRepeatHqD32Json],
    ["F02 releases the stale HQ plan at D50", releaseHqPlanD50Json],
    [
      "F03 never maps Junkyard BBS as a bank payout at D124",
      noJunkyardCashoutD124Json,
    ],
    [
        "F04 funds the remote contest reserve through Broker at D131",
      releaseRemotePlanD131Json,
    ],
    [
      "F05 pumps before allowing four ETR subroutines at D134",
      breakBeforeEtrD134Json,
    ],
    [
      "F06 cashes out the bound Broker reserve at D179",
      cashoutForRdD179Json,
    ],
    [
      "F06 cashes out the bound Broker reserve at D185",
      cashoutForRdD185Json,
    ],
    [
      "F07 builds the remote pressure reserve at D161",
      buildRemoteReserveD161Json,
    ],
    [
        "F08 cashes out Broker for the urgent remote threat at D167",
      liquidateForRemoteD167Json,
    ],
  ])("satisfies %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it.each([
    ["the breaker-AP coverage draw at D61", preserveHqFacecheckD61Json],
  ])("keeps the positive control: %s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    [
      "cp-d153-05-preserve-hq-facecheck-d61",
      "cp-d153-10-liquidate-for-remote-threat-d167",
      "cp-d153-12-cashout-for-rd-d185",
    ],
  );
  return checkpoint;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
}
