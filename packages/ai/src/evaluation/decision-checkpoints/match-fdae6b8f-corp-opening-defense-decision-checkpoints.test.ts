import { describe, expect, it } from "vitest";

import mulliganZeroIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fdae6b8f-00-mulligan-zero-ice-punish-hand-d1.json";
import searchIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fdae6b8f-01-search-ice-before-idle-economy-d9.json";
import rezRdEncounterTaxJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fdae6b8f-02-rez-known-central-encounter-tax-d19.json";
import rezHqEncounterDisruptionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fdae6b8f-03-rez-known-central-encounter-disruption-d39.json";
import installRdEncounterIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-fdae6b8f-04-install-known-encounter-ice-rd-d15.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

describe("match fdae6b8f Corp opening and central defense regressions", () => {
  it.each([
    ["mulligans the zero-ICE opening", mulliganZeroIceJson],
    ["searches for ICE before idle economy", searchIceJson],
    ["rezzes known encounter-tax ICE on R&D", rezRdEncounterTaxJson],
    [
      "rezzes known encounter-disruption ICE on HQ",
      rezHqEncounterDisruptionJson,
    ],
    [
      "installs known encounter ICE on the protected remote",
      installRdEncounterIceJson,
    ],
  ])("%s", (_label, checkpointJson) => {
    const result = runAiDecisionCheckpoint(
      checkpointJson as AiDecisionCheckpointV1,
    );
    expect(result).toMatchObject({ ok: true });
  });
});
