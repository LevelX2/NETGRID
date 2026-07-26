import { describe, expect, it } from "vitest";

import projectConsultantsTychoJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-74e2369-01-project-consultants-tycho.json";
import protectRdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-74e2369-02-protect-rd.json";
import nightShiftJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-74e2369-03-night-shift-over-basic-credit.json";
import discardLicheJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-74e2369-04-retain-night-shift-discard-liche.json";
import corporateWarThresholdJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-74e2369-05-corporate-war-threshold-consumer.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 74e2369 exact Corp decision checkpoints", () => {
  it.each([
    [
      "protects repeatedly accessed open R&D before exposing Tycho",
      projectConsultantsTychoJson,
    ],
    ["protects repeatedly accessed R&D", protectRdJson],
    [
      "starts the exact staged Tycho score project before a background asset",
      nightShiftJson,
    ],
    [
      "retains both agendas and Night Shift while discarding Liche",
      discardLicheJson,
    ],
    [
      "explains the Corporate War threshold tradeoff while preserving the urgent score",
      corporateWarThresholdJson,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, `${result.code ?? "ok"}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
