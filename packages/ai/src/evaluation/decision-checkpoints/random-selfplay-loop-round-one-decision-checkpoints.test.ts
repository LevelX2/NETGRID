import { describe, expect, it } from "vitest";
import { applyAction, hashGameState } from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";

import safeStagedScoreJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-loop-r1-01-safe-staged-score-d138.json";
import terminalRemoteContestJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-loop-r1-02-terminal-remote-contest-d240.json";
import terminalBrokerFundingJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-loop-r1-03-terminal-broker-funding-d287.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("random standard selfplay loop round one", () => {
  it.each([
    [
      "finds effective protection for the bounded staged score line",
      safeStagedScoreJson,
    ],
    [
      "builds AP coverage before the reachable public terminal remote",
      terminalRemoteContestJson,
    ],
    [
      "funds the terminal remote's visible Trace through its complete bank quote",
      terminalBrokerFundingJson,
    ],
  ])("%s", (_label, json) => {
    const checkpoint = fixture(json);
    if (json === safeStagedScoreJson) {
      checkpoint.expectation.acceptableActions = [
        { actionId: "corp.draw_card" },
      ];
      checkpoint.expectation.planExecution = {
        acceptablePlanKinds: ["corp.defend_servers"],
        acceptableCapabilities: ["develop_score_protection"],
        requiredAssessmentEvidence: [
          "score_plan_requires_effective_ice_draw:agenda:corp_onr_v1_209_political-coup_2:remote_1:remote_1",
        ],
      };
    }
    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, diagnostic(result)).toBe(true);
    expect(result.decision?.decisionDebug?.whyNot?.length).toBeGreaterThan(0);
    expect(
      result.decision?.decisionDebug?.detailSections?.some(
        (section) => section.id === "runtime_why_not",
      ),
    ).toBe(true);
    if (json === terminalBrokerFundingJson) {
      expect(
        evaluateRunnerRunTargets({ input: result.input }).find(
          (target) => target.actionId === "runner.start_run.remote_1",
        ),
      ).toMatchObject({ visibleTraceTagHazardUnavoidable: true });
    }
  });

  it.each(["native", "low_cash_companion"] as const)(
    "keeps the Broker cash-out and actual funded run under their owners: %s",
    (variant) => {
      const checkpoint = fixture(terminalBrokerFundingJson);
      if (variant === "low_cash_companion") {
        checkpoint.engine.testOnlyGameState.runner.credits = 1;
        checkpoint.engine.testOnlyGameState.corp.credits = 0;
        checkpoint.source.kind = "synthetic_companion";
        checkpoint.engine.stateHash = hashGameState(
          checkpoint.engine.testOnlyGameState,
        );
      }
      const result = runAiDecisionCheckpoint(checkpoint);
      expect(result.ok, diagnostic(result)).toBe(true);
      const evidence = [
        ...(result.decision?.evidence ?? []),
        ...(result.decision?.decisionDebug?.planFirstDecision
          ?.assessmentEvidenceCodes ?? []),
        ...(result.decision?.decisionDebug?.planFirstDecision?.selectedPlan
          ?.evidenceCodes ?? []),
      ];

      expect(result.decision?.decisionDebug?.planKind).toBe(
        "runner.credit_bank",
      );
      expect(
        result.decision?.decisionDebug?.planFirstDecision?.route?.capabilityId,
      ).toBe("credit_bank_cash_out");
      expect(
        evidence.some(
          (entry) =>
            entry ===
            "runner_credit_bank_bound_run_action:runner.start_run.remote_1",
        ),
      ).toBe(true);
      const before = checkpoint.engine.testOnlyGameState;
      const paid = applyAction(before, {
        matchId: before.matchId,
        side: "runner",
        actionId: result.decision!.actionId!,
        clientKnownStateVersion: before.stateVersion,
      });
      expect(paid.ok).toBe(true);
      if (!paid.ok) throw Error(JSON.stringify(paid.error));
      const next = buildAiDecisionInput(paid.state, "runner", {
        ownDeckSnapshot: checkpoint.deckSnapshot,
        difficulty: "hard",
      });
      const decision = chooseAiAction(next);
      expect(decision.actionId).toBe("runner.start_run.remote_1");
      const started = applyAction(paid.state, {
        matchId: paid.state.matchId,
        side: "runner",
        actionId: decision.actionId!,
        clientKnownStateVersion: paid.state.stateVersion,
      });
      expect(started.ok).toBe(true);
    },
  );
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
