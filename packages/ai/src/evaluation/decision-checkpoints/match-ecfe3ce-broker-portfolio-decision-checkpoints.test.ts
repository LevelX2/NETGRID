import { describe, expect, it } from "vitest";

import emergencyCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-01-emergency-cashout.json";
import holdThreeJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-02-hold-three-with-liquid-five.json";
import scoreWindowCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-03-score-window-cashout.json";
import pressureCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-04-pressure-cashout.json";
import reactionFloorCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-05-reaction-floor-cashout.json";
import lastClickLoadJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-06-last-click-load.json";
import secondInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-07-build-phase-second-install.json";
import twoSourceFirstLoadJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-08-two-source-first-load.json";
import maturePoolCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-09-mature-pool-cashout.json";
import twoSourceBalancedLoadJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-10-two-source-balanced-load.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match ECFE3CE Broker portfolio checkpoints", () => {
  it.each([
    ["allows the zero-credit emergency cashout", emergencyCashoutJson],
    ["allows the score-window cashout", scoreWindowCashoutJson],
    ["allows the pressure cashout", pressureCashoutJson],
    [
      "restores a reaction floor from a nine-credit bank",
      reactionFloorCashoutJson,
    ],
    [
      "allows a second Broker or continued loading during a funded build window",
      secondInstallJson,
    ],
    [
      "allows either unused Broker to start a two-source turn",
      twoSourceFirstLoadJson,
    ],
    [
      "moves a mature bank into a non-comfortable liquid pool",
      maturePoolCashoutJson,
    ],
    [
      "keeps survival card draw ahead of Broker portfolio growth",
      twoSourceBalancedLoadJson,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("loads three stored credits instead of cashing out without a liquidity need", () => {
    expectCheckpointToPass(fixture(holdThreeJson));
  });

  it("uses the last click to store three credits instead of taking one liquid credit", () => {
    expectCheckpointToPass(fixture(lastClickLoadJson));
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function expectCheckpointToPass(checkpoint: AiDecisionCheckpointV1): void {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(
    result.ok,
    `${result.code ?? "ok"}: ${result.message}\n${JSON.stringify(
      {
        selectedAction: result.selectedAction,
        scoreBreakdown: result.decision?.decisionDebug?.scoreBreakdown,
        planArbitration:
          result.decision?.decisionDebug?.decisionChain?.planArbitration,
      },
      null,
      2,
    )}`,
  ).toBe(true);
}
