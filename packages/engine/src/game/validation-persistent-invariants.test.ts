import { describe, expect, it } from "vitest";
import { createGame } from "./create-game";
import { validateGameState } from "./validation";

describe("persistent numeric state invariants", () => {
  it("rejects replay-inconsistent random state", () => {
    const state = createGame({
      seed: "invalid-random-state",
      setupMode: "completed",
    });
    state.randomCounter += 1;

    expect(validateGameState(state).errors).toContain(
      "Random counter must equal the recorded draw count.",
    );
  });

  it("rejects inconsistent Corp action debt", () => {
    const state = createGame({
      seed: "invalid-corp-debt",
      setupMode: "completed",
    });
    state.corpActionDebt = {
      forgoActionsPending: 2,
      entries: [
        {
          reason: "test",
          remaining: 1,
          createdAtStateVersion: state.stateVersion,
          source: "test",
        },
      ],
    };

    expect(validateGameState(state).errors).toContain(
      "Corp action debt total must equal its entry total.",
    );
  });

  it("rejects malformed purgeable Runner virus counters", () => {
    const state = createGame({
      seed: "invalid-virus-counters",
      setupMode: "completed",
    });
    state.purgeableRunnerVirusCounters = { corp: { doom: -1 } };

    expect(validateGameState(state).errors).toContain(
      "purgeableRunnerVirusCounters.corp.doom must be a non-negative safe integer.",
    );
  });
});
