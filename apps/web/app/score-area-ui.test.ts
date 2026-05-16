import { describe, expect, it } from "vitest";
import { scoredAgendaEffectLineForScoreArea } from "./score-area-ui";

describe("score area UI helpers", () => {
  it("shows Superior Net Barriers as active only in the Corp scored area", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea("onr_v1_219_superior-net-barriers", "corp");

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Wall-ICE hat +1 Stärke"
    });
    expect(scoredAgendaEffectLineForScoreArea("onr_v1_219_superior-net-barriers", "runner")).toBeNull();
  });
});
