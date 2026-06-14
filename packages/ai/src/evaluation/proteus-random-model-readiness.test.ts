import { describe, expect, it } from "vitest";

import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import { buildProteusRandomModelReadinessReport } from "./proteus-random-model-readiness";

describe("Proteus random model readiness", () => {
  it("keeps random-outcome Proteus cards report-only", () => {
    const report = buildProteusRandomModelReadinessReport();

    expect(report).toMatchObject({
      version: "proteus-random-model-readiness-v0",
      scope: "proteus_random_model_readiness_report_only",
      model: "random_outcome_model",
      cardCount: 6,
      productiveUseAllowed: false,
      runtimeConsumerStatus: "none",
      noRuntimeEffect: true,
    });
    expect(report.cards.map((card) => card.cardName)).toEqual([
      "AI Board Member",
      "Bargain with Viacox",
      "Playful AI",
      "Quest for Cattekin",
      "Rio de Janeiro City Grid",
      "Roadblock",
    ]);
    expect(report.cards.every((card) => card.deterministicRuntimeAllowed === false))
      .toBe(true);
    expect(report.cards.flatMap((card) => card.requiredModelEvidence)).toEqual(
      expect.arrayContaining([
        "random_outcome_model_required:true",
        "seeded_replay_contract_required:true",
        "runtime_consumer:none",
      ]),
    );
    expect(report.evidence).toEqual(
      expect.arrayContaining([
        "proteus_random_model_readiness:report_only",
        "deterministic_runtime_allowed:false",
      ]),
    );
    expect(containsForbiddenSemanticMarker(report)).toBe(false);
  });
});
