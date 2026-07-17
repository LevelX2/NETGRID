import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import preserveKrashJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-01-preserve-krash-break-target-d37.json";
import brokerFundingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-02-broker-before-unconvertible-funding-d130.json";
import coverageSearchJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-03-aujourdoui-coverage-search-d164.json";
import coverageThresholdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-04-aujourdoui-over-credit-base-d176.json";
import riskyViacoxJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-05-avoid-risky-viacox-install-d148.json";
import safeViacoxJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-23d6-06-allow-safe-viacox-install-d58.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 23D6 runner remediation decision checkpoints", () => {
  it.each([
    [
      "preserves Krash by breaking Viral 15's program-trash subroutine",
      preserveKrashJson,
    ],
    [
      "loads Broker before a funding target that cannot convert this turn",
      brokerFundingJson,
    ],
    [
      "installs Aujourd'Oui to close urgent breaker coverage",
      coverageSearchJson,
    ],
    [
      "lets urgent coverage search outrank a base credit",
      coverageThresholdJson,
    ],
    [
      "avoids installing Viacox into a materially unsafe forced-run board",
      riskyViacoxJson,
    ],
    ["still allows Viacox on the earlier safe board", safeViacoxJson],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("keeps immediately convertible Lucidrine funding liquid", () => {
    const checkpoint = mutateFixture(brokerFundingJson, (fixture) => {
      fixture.engine.testOnlyGameState.runner.credits = 7;
      fixture.engine.testOnlyGameState.runner.clicks = 2;
      fixture.source.kind = "synthetic_companion";
      fixture.source.findingId = "23D6-F2-LIQUID-FUNDING-CONTROL";
      fixture.expectation = { acceptableActions: [{ type: "gain_credit" }] };
    });

    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("does not force Aujourd'Oui without a visible coverage gap", () => {
    const checkpoint = mutateFixture(coverageThresholdJson, (fixture) => {
      for (const server of fixture.engine.testOnlyGameState.corp.servers) {
        for (const iceId of server.ice) {
          const ice = fixture.engine.testOnlyGameState.cardInstances[iceId];
          if (ice) ice.rezzed = false;
        }
      }
      fixture.source.kind = "synthetic_companion";
      fixture.source.findingId = "23D6-F3-NO-COVERAGE-NEED-CONTROL";
      fixture.expectation = {
        forbiddenActions: [
          {
            actionId:
              "runner.install_card.runner_onr_v1_151_aujourdoui_1.runner_onr_v1_151_aujourdoui_1",
          },
        ],
      };
    });

    const result = runAiDecisionCheckpoint(checkpoint);
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
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
