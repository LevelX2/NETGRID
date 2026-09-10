import { describe, expect, it } from "vitest";

import { evaluateRunnerHandDevelopment } from "./runner-hand-development";
import {
  findByInstance,
  playEventAction,
  runnerInput,
  startRunAction,
  visibleCard,
} from "./runner-hand-development.test-support";

describe("Runner hand-development run-event roles", () => {
  it("classifies a credit-tax run event as a run event before economy text", () => {
    const runningInterference = visibleCard("running-interference-1", {
      definitionId: "onr_classic_043_running-interference",
      title: "Running Interference",
      type: "event",
      cost: 1,
      rulesText:
        "Make a run. The Corp pays 2 additional credits to rez each piece of ice during this run.",
    });
    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input: runnerInput({
          credits: 3,
          clicks: 2,
          hand: [runningInterference],
          legalActions: [
            playEventAction(
              "play-running-interference",
              runningInterference,
              1,
            ),
            startRunAction("run-hq", "hq"),
          ],
        }),
      }),
      runningInterference.instanceId,
    );

    expect(evaluation.developmentRole).toBe("run_event");
  });
});
