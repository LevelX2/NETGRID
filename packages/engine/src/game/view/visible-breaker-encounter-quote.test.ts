import { describe, expect, it } from "vitest";
import { visibleBreakerEncounterQuote } from "./visible-breaker-encounter-quote";

describe("visibleBreakerEncounterQuote", () => {
  it("applies an implementation-declared chosen-ICE strength bonus only to its bound instance", () => {
    const common = {
      breakerDefinitionId: "onr_proteus_080_black-widow" as const,
      breakerInstanceId: "black_widow",
      breakerStrength: 2,
      selectedTargetCardId: "chosen_ice",
      iceDefinitionId: "onr_v1_223_banpei" as const,
      iceSubtypes: ["sentry"],
    };

    expect(
      visibleBreakerEncounterQuote({ ...common, iceInstanceId: "chosen_ice" }),
    ).toMatchObject({
      effectiveStrength: 7,
      pumpCost: 2,
      pumpStrengthGain: 1,
      breakCost: 1,
      coverageStatus: "full",
    });
    expect(
      visibleBreakerEncounterQuote({ ...common, iceInstanceId: "other_ice" }),
    ).toMatchObject({ effectiveStrength: 2 });
  });

  it("uses selected subtype state and reports an unresolved selectable breaker", () => {
    const common = {
      breakerDefinitionId: "onr_proteus_088_fubar" as const,
      breakerInstanceId: "fubar",
      breakerStrength: 1,
      iceDefinitionId: "onr_v1_223_banpei" as const,
      iceSubtypes: ["sentry"],
    };
    expect(visibleBreakerEncounterQuote(common)).toMatchObject({
      coverageStatus: "requires_selection",
    });
    expect(
      visibleBreakerEncounterQuote({ ...common, selectedSubtype: "sentry" }),
    ).toMatchObject({
      coverageStatus: "full",
      breakCost: 1,
      postBreakStealthLossPerUse: 1,
    });
  });
});
