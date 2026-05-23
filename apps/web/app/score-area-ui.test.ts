import { describe, expect, it } from "vitest";
import {
  corpScoredGeneticsVisionaryAcquisitionActive,
  researchAgendaDifficultyModifierLineForCard,
  scoredAgendaEffectLineForScoreArea
} from "./score-area-ui";

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

  it("shows Genetics-Visionary Acquisition as an active Research agenda difficulty effect", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea("onr_v1_202_genetics-visionary-acquisition", "corp");

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Research-Agendas brauchen 1 Entwicklung weniger"
    });
    expect(scoredAgendaEffectLineForScoreArea("onr_v1_202_genetics-visionary-acquisition", "runner")).toBeNull();
  });

  it("shows Encryption Breakthrough as an active Code Gate strength effect only in the Corp scored area", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea("onr_v1_200_encryption-breakthrough", "corp");

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Code-Gates haben +1 Stärke"
    });
    expect(scoredAgendaEffectLineForScoreArea("onr_v1_200_encryption-breakthrough", "runner")).toBeNull();
  });

  it("shows Security Net Optimization selected server in the Corp scored area", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea(
      {
        definitionId: "onr_v1_215_security-net-optimization",
        selectedServerLabel: "Remote 1"
      },
      "corp"
    );

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Remote 1: ICE hat +1 Stärke"
    });
  });

  it("marks known Research agendas when Genetics-Visionary Acquisition is scored by the Corp", () => {
    const corpScoreAreaCards = [
      {
        instanceId: "score-1",
        known: true,
        definitionId: "onr_v1_202_genetics-visionary-acquisition",
        type: "agenda" as const,
        subtypes: ["gray_ops"]
      }
    ];

    expect(corpScoredGeneticsVisionaryAcquisitionActive(corpScoreAreaCards)).toBe(true);
    expect(
      researchAgendaDifficultyModifierLineForCard(
        {
          known: true,
          definitionId: "onr_v1_189_artificial-security-directors",
          type: "agenda",
          subtypes: ["research"]
        },
        corpScoreAreaCards
      )
    ).toMatchObject({
      value: "Diff -1",
      label: "Genetics-Visionary Acquisition: braucht 1 Entwicklung weniger",
      tone: "agenda"
    });
  });

  it("does not mark hidden Research agendas", () => {
    const corpScoreAreaCards = [
      {
        instanceId: "score-1",
        known: true,
        definitionId: "onr_v1_202_genetics-visionary-acquisition",
        type: "agenda" as const,
        subtypes: ["gray_ops"]
      }
    ];

    expect(
      researchAgendaDifficultyModifierLineForCard(
        {
          known: false,
          definitionId: "onr_v1_189_artificial-security-directors",
          type: "agenda",
          subtypes: ["research"]
        },
        corpScoreAreaCards
      )
    ).toBeNull();
  });
});
