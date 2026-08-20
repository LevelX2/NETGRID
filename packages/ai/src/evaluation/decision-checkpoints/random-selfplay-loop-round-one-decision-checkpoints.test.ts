import { describe, expect, it } from "vitest";

import safeStagedScoreJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-loop-r1-01-safe-staged-score-d138.json";
import terminalRemoteContestJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-loop-r1-02-terminal-remote-contest-d240.json";
import terminalBrokerFundingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-loop-r1-03-terminal-broker-funding-d287.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("random standard selfplay loop round one", () => {
  it.each([
    [
      "starts the bounded staged score line",
      safeStagedScoreJson,
    ],
    [
      "builds AP coverage before the reachable public terminal remote",
      terminalRemoteContestJson,
    ],
    [
      "cash-outs the bank for the exact same-turn terminal remote route",
      terminalBrokerFundingJson,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, diagnostic(result)).toBe(true);
    expect(result.decision?.decisionDebug?.whyNot?.length).toBeGreaterThan(0);
    expect(
      result.decision?.decisionDebug?.detailSections?.some(
        (section) => section.id === "runtime_why_not",
      ),
    ).toBe(true);
  });

  it("keeps the Broker cash-out under its own plan owner", () => {
    const result = runAiDecisionCheckpoint(fixture(terminalBrokerFundingJson));
    const evidence = [
      ...(result.decision?.evidence ?? []),
      ...(result.decision?.decisionDebug?.planFirstDecision
        ?.assessmentEvidenceCodes ?? []),
      ...(result.decision?.decisionDebug?.planFirstDecision?.selectedPlan
        ?.evidenceCodes ?? []),
    ];

    expect(result.decision?.decisionDebug?.planKind).toBe("runner.credit_bank");
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.route?.capabilityId,
    ).toBe("credit_bank_cash_out");
    expect(
      evidence.some(
        (entry) =>
          entry === "runner_credit_bank_cashout_for_click_efficient_liquidity",
      ),
    ).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

function diagnostic(
  result: ReturnType<typeof runAiDecisionCheckpoint>,
): string {
  return [
    result.code ?? "pass",
    result.message,
    result.selectedAction?.actionId ?? "no-action",
    result.decision?.reasonCode ?? "no-reason",
  ].join(" | ");
}
