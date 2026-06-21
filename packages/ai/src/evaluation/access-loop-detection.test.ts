import { describe, expect, it } from "vitest";
import { detectRepeatedNoPayoffAccessLoop } from "./access-loop-detection";

describe("access loop detection", () => {
  it("detects repeated no-payoff access loops on the same server", () => {
    const detection = detectRepeatedNoPayoffAccessLoop({
      observations: [
        observation(1, "run-1", "remote_1"),
        observation(3, "run-2", "remote_1"),
        observation(5, "run-3", "remote_1"),
        observation(6, "run-hq", "hq", "unknown", "payoff"),
      ],
    });

    expect(detection).toMatchObject({
      kind: "access_loop_detection",
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      repeatedNoPayoffAccessLoop: true,
      serverId: "remote_1",
      repeatedCount: 3,
      actionIds: ["run-1", "run-2", "run-3"],
    });
    expect(detection.evidence).toEqual(
      expect.arrayContaining([
        "access_loop_detection_repeated_no_payoff:true",
        "access_loop_detection_server:remote_1",
        "access_loop_detection_action:run-3",
      ]),
    );
  });

  it("does not flag repeated profitable access", () => {
    const detection = detectRepeatedNoPayoffAccessLoop({
      observations: [
        observation(1, "run-1", "remote_1", "agenda", "payoff"),
        observation(3, "run-2", "remote_1", "trash_affordable", "payoff"),
        observation(5, "run-3", "remote_1", "unknown", "payoff"),
      ],
    });

    expect(detection).toMatchObject({
      repeatedNoPayoffAccessLoop: false,
      repeatedCount: 0,
      actionIds: [],
    });
    expect(detection.evidence).toContain(
      "access_loop_detection_repeated_no_payoff:false",
    );
  });

  it("requires the repeat threshold per server", () => {
    const detection = detectRepeatedNoPayoffAccessLoop({
      minimumRepeats: 3,
      observations: [
        observation(1, "run-1", "remote_1"),
        observation(2, "run-2", "remote_1"),
        observation(3, "run-3", "remote_2"),
      ],
    });

    expect(detection.repeatedNoPayoffAccessLoop).toBe(false);
  });
});

function observation(
  turn: number,
  actionId: string,
  serverId: string,
  accessPayoff: "agenda" | "trash_affordable" | "known_low_value" | "unknown" =
    "known_low_value",
  outcome: "payoff" | "no_payoff" | "declined" = "no_payoff",
) {
  return {
    turn,
    actionId,
    serverId,
    accessPayoff,
    outcome,
    evidence: [`test_observation:${actionId}`],
  };
}
