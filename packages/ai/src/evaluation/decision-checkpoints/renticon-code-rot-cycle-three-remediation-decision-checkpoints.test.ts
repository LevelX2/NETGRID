import { describe, expect, it } from "vitest";
import scoreBeforeOveradvanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c3-01-score-before-overadvance-seed001-d257.json";
import tagPayoffJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c3-02-tag-payoff-over-stale-remote-seed001-d331.json";
import avoidStaleRemoteJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c3-03-avoid-stale-remote-sprawl-seed001-d350.json";
import { type AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const FIXTURES = [
  [
    "scores a ready agenda instead of overadvancing it",
    scoreBeforeOveradvanceJson,
  ],
  ["uses the tagged payoff instead of extending a stale remote", tagPayoffJson],
  [
    "funds the resident score project without extending stale remote sprawl",
    avoidStaleRemoteJson,
  ],
] as const;

describe("Rent-I-Con vs. CODE ROT cycle-three remediation checkpoints", () => {
  it.each(FIXTURES)("%s", (_label, checkpoint) => {
    const result = runAiDecisionCheckpoint(
      structuredClone(checkpoint) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});
