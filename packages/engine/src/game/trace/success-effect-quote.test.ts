import { describe, expect, it } from "vitest";

import { traceSuccessEffectCardImplementationQuotesForDefinition } from "./success-effect-quote";

describe("traceSuccessEffectCardImplementationQuotesForDefinition", () => {
  it("quotes a public dynamic trace tag effect", () => {
    expect(
      traceSuccessEffectCardImplementationQuotesForDefinition(
        "onr_proteus_026_hunting-pack",
      ),
    ).toEqual([
      {
        sourceDefinitionId: "onr_proteus_026_hunting-pack",
        traceLimit: 5,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      },
    ]);
  });

  it("quotes a public printed trace effect", () => {
    expect(
      traceSuccessEffectCardImplementationQuotesForDefinition("onr_v1_264_rex"),
    ).toEqual([
      {
        sourceDefinitionId: "onr_v1_264_rex",
        traceLimit: 3,
        traceSuccessEffect: {
          type: "end_run_and_run_lock",
          amount: 2,
        },
      },
    ]);
  });

  it("quotes a public declarative operation trace effect", () => {
    expect(
      traceSuccessEffectCardImplementationQuotesForDefinition(
        "onr_v1_284_chance-observation",
      ),
    ).toEqual([
      {
        sourceDefinitionId: "onr_v1_284_chance-observation",
        traceLimit: 5,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      },
    ]);
  });
});
