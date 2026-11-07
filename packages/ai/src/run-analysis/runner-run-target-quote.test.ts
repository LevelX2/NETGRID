import { describe, expect, it, vi } from "vitest";
import { buildRealEngineDecisionCorpusScenarios } from "../evaluation/real-engine-decision-corpus-fixtures";
import * as remotePayoff from "../known-remote-access-payoff";
import {
  evaluateRunnerRunTargets,
  quoteRunnerRunTarget,
} from "../runner-run-target-evaluation";

describe("bound Runner run quotes", () => {
  const input = buildRealEngineDecisionCorpusScenarios().find(
    (scenario) =>
      scenario.scenarioId === "runner_real_target_choice_hq_remote_mix",
  )!.input;
  const targets = evaluateRunnerRunTargets({ input });
  const current = targets.find((target) => target.targetServerId === "hq")!;

  it("quotes the exact route and evaluates alternatives only for funding admission", () => {
    const remote = vi.spyOn(remotePayoff, "evaluateKnownRemoteAccessPayoff");
    try {
      const quote = quoteRunnerRunTarget({
        input,
        runActionId: current.actionId,
        targetServerId: current.targetServerId,
      });
      expect(quote?.target).toEqual(current);
      expect(remote).not.toHaveBeenCalled();
      expect(quote?.fundingTargets()).toEqual(targets);
      expect(remote).toHaveBeenCalled();
      const calls = remote.mock.calls.length;
      expect(quote?.fundingTargets()).toBe(quote?.fundingTargets());
      expect(remote).toHaveBeenCalledTimes(calls);
    } finally {
      remote.mockRestore();
    }
  });

  it.each(["missing_action", "other_target", "stale_action"] as const)(
    "rejects an unbound route with %s",
    (variant) => {
      const copy = structuredClone(input);
      if (variant === "stale_action") {
        copy.legalActions.find(
          (action) => action.actionId === current.actionId,
        )!.expiresAtStateVersion -= 1;
      }
      expect(
        quoteRunnerRunTarget({
          input: copy,
          runActionId:
            variant === "missing_action" ? "missing" : current.actionId,
          targetServerId:
            variant === "other_target"
              ? "remote_missing"
              : current.targetServerId,
        }),
      ).toBeUndefined();
    },
  );
});
