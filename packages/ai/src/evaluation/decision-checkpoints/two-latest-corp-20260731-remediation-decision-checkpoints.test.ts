import { describe, expect, it } from "vitest";

import earlyDefenseD3Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-723d40-latest-01-early-defense-d3.json";
import sirenEarlyDefenseD3Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-01-early-defense-d3.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("two latest Corp matches 2026-07-31 remediation checkpoints", () => {
  it.each([
    ["Rent to Own", earlyDefenseD3Json],
    ["Siren Fortress", sirenEarlyDefenseD3Json],
  ])("chooses a productive early defense route over an unbound basic credit for %s", (_deck, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
