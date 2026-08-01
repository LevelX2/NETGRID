import { describe, expect, it } from "vitest";

import allNighterJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-82b2-01-all-nighter-rd-bonus-d5.json";
import brokerCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-82b2-02-broker-cashout-d99.json";
import earlyRdRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-82b2-03-rd-data-wall-rez-d57.json";
import lateRdRezJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-82b2-04-rd-fire-wall-rez-d92.json";
import vaporReadvanceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-82b2-05-vapor-no-readvance-d137.json";
import vaporRepeatJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-82b2-06-vapor-no-repeat-readvance-d161.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

const checkpoints = [
  ["All-Nighter ranks the bound bonus target", allNighterJson],
  ["Broker converts its reached value target", brokerCashoutJson],
  ["early layered R&D path rezzes Data Wall", earlyRdRezJson],
  ["late layered R&D path rezzes Fire Wall", lateRdRezJson],
  ["Vapor Ops is not immediately re-advanced", vaporReadvanceJson],
  ["Vapor Ops does not repeat the cross-plan loop", vaporRepeatJson],
] as const;

describe("series 82b2 remediation decision checkpoints", () => {
  it.each(checkpoints)("keeps %s fixture-valid and replayable", (_label, json) => {
    const checkpoint = fixture(json);
    checkpoint.expectation = { acceptableActions: [{}] };

    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it.each(checkpoints)("remediates %s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
