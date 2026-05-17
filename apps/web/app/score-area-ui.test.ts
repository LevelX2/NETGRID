import { describe, expect, it } from "vitest";
import { scoredAgendaCreditCounterSource, scoredAgendaEffectLineForScoreArea } from "./score-area-ui";

describe("score area UI helpers", () => {
  it("shows Superior Net Barriers as active only in the Corp scored area", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea("onr_v1_219_superior-net-barriers", "corp");

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Wall-ICE hat +1 Stärke"
    });
    expect(scoredAgendaEffectLineForScoreArea("onr_v1_219_superior-net-barriers", "runner")).toBeNull();
  });

  it("shows Black Ice Quality Assurance as a +2 Black ICE effect only in the Corp scored area", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea("onr_v1_191_black-ice-quality-assurance", "corp");

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Black ICE hat +2 Stärke"
    });
    expect(scoredAgendaEffectLineForScoreArea("onr_v1_191_black-ice-quality-assurance", "runner")).toBeNull();
  });

  it("identifies scored Coup agenda counters as credit counters", () => {
    expect(scoredAgendaCreditCounterSource("onr_v1_193_corporate-coup")).toBe("Corporate Coup");
    expect(scoredAgendaCreditCounterSource("onr_v1_209_political-coup")).toBe("Political Coup");
    expect(scoredAgendaCreditCounterSource("onr_v1_219_superior-net-barriers")).toBeNull();
  });
});
