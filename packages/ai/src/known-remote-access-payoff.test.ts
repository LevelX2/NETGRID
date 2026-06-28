import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { BeliefState } from "./belief-state";
import { evaluateKnownRemoteAccessPayoff } from "./known-remote-access-payoff";

describe("evaluateKnownRemoteAccessPayoff", () => {
  it("matches remote invalidation entries by bounded server id", () => {
    expect(
      evaluateKnownRemoteAccessPayoff(
        inputWithUnidentifiedKnownRoot("remote_1"),
        "remote_1",
        beliefWithInvalidations(["server:remote_1:root_changed"]),
      ).payoff,
    ).toBe("changed");
    expect(
      evaluateKnownRemoteAccessPayoff(
        inputWithUnidentifiedKnownRoot("remote_1"),
        "remote_1",
        beliefWithInvalidations(["server:remote_10:root_changed"]),
      ).payoff,
    ).toBe("unknown");
  });
});

function inputWithUnidentifiedKnownRoot(serverId: string): AiDecisionInput {
  return {
    playerView: {
      servers: [
        {
          id: serverId,
          root: [{ known: true }],
          ice: [],
        },
      ],
      own: {
        credits: 5,
        rig: [],
      },
    },
  } as unknown as AiDecisionInput;
}

function beliefWithInvalidations(invalidationLog: string[]): BeliefState {
  return {
    invalidationLog,
  } as unknown as BeliefState;
}
