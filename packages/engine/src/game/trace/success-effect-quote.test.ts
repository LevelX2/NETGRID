import { describe, expect, it } from "vitest";

import { traceSuccessEffectCardImplementationQuotesForDefinition } from "./success-effect-quote";

describe("traceSuccessEffectCardImplementationQuotesForDefinition", () => {
  it("quotes the public margin-based operation effect without reducing it to a fixed tag", () => {
    expect(
      traceSuccessEffectCardImplementationQuotesForDefinition(
        108,
      ),
    ).toEqual([
      {
        sourceDefinitionId: 108,
        traceLimit: 6,
        traceSuccessEffect: {
          type: "add_tags_by_trace_margin_over_runner_link",
        },
      },
    ]);
  });
  it("quotes a public dynamic trace tag effect", () => {
    expect(
      traceSuccessEffectCardImplementationQuotesForDefinition(
        84,
      ),
    ).toEqual([
      {
        sourceDefinitionId: 84,
        traceLimit: 5,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      },
    ]);
  });

  it("quotes a public printed trace effect", () => {
    expect(
      traceSuccessEffectCardImplementationQuotesForDefinition(476),
    ).toEqual([
      {
        sourceDefinitionId: 476,
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
        496,
      ),
    ).toEqual([
      {
        sourceDefinitionId: 496,
        traceLimit: 5,
        traceSuccessEffect: { type: "add_tag", amount: 1 },
      },
    ]);
  });
});
