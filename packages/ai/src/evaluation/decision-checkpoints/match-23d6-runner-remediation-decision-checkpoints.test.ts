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
    ["preserves Krash by breaking Viral 15's program-trash subroutine", preserveKrashJson],
    ["loads Broker before a funding target that cannot convert this turn", brokerFundingJson],
    ["installs Aujourd'Oui to close urgent breaker coverage", coverageSearchJson],
    ["lets urgent coverage search outrank a base credit", coverageThresholdJson],
    ["avoids installing Viacox into a materially unsafe forced-run board", riskyViacoxJson],
    ["still allows Viacox on the earlier safe board", safeViacoxJson],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
