import { describe, expect, it } from "vitest";
import {
  corpScoredGeneticsVisionaryAcquisitionActive,
  researchAgendaDifficultyModifierLineForCard,
  scoredAgendaEffectLineForScoreArea,
} from "./score-area-ui";

describe("score area UI helpers", () => {
  it("explains Ice Transmutation on scoring and omits the effect on a stolen agenda", () => {
    expect(scoredAgendaEffectLineForScoreArea(416, "corp")).toMatchObject({
      value: "Wertung",
      label:
        "Das gewählte gerezzte ICE erhält +1 Stärke und eine Kopie jeder eigenen Subroutine.",
    });
    expect(
      scoredAgendaEffectLineForScoreArea(416, "corp", "en")?.label,
    ).toContain("one copy of each of its own subroutines");
    expect(
      scoredAgendaEffectLineForScoreArea(416, "corp", "fr")?.label,
    ).toContain("une copie de chacune de ses propres routines");
    expect(scoredAgendaEffectLineForScoreArea(416, "runner")).toBeNull();
  });

  it("shows Superior Net Barriers as active only in the Corp scored area", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea(
      431,
      "corp",
    );

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Wall-ICE hat +1 Stärke",
    });
    expect(
      scoredAgendaEffectLineForScoreArea(
        431,
        "runner",
      ),
    ).toBeNull();
  });

  it("shows Black Ice Quality Assurance as a +2 Black ICE effect only in the Corp scored area", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea(
      403,
      "corp",
    );

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Black ICE hat +2 Stärke",
    });
    expect(
      scoredAgendaEffectLineForScoreArea(
        403,
        "runner",
      ),
    ).toBeNull();
  });

  it("shows Genetics-Visionary Acquisition as an active Research agenda difficulty effect", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea(
      414,
      "corp",
    );

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Research-Agendas brauchen 1 Entwicklung weniger",
    });
    expect(
      scoredAgendaEffectLineForScoreArea(
        414,
        "runner",
      ),
    ).toBeNull();
  });

  it("shows Encryption Breakthrough as an active Code Gate strength effect only in the Corp scored area", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea(
      412,
      "corp",
    );

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Code-Gates haben +1 Stärke",
    });
    expect(
      scoredAgendaEffectLineForScoreArea(
        412,
        "runner",
      ),
    ).toBeNull();
  });

  it("shows Security Net Optimization selected server in the Corp scored area", () => {
    const corpLine = scoredAgendaEffectLineForScoreArea(
      {
        definitionId: 427,
        selectedServerLabel: "Remote 1",
      },
      "corp",
    );

    expect(corpLine).toMatchObject({
      value: "Aktiv",
      label: "Remote 1: ICE hat +1 Stärke",
    });
  });

  it("marks known Research agendas when Genetics-Visionary Acquisition is scored by the Corp", () => {
    const corpScoreAreaCards = [
      {
        instanceId: "score-1",
        known: true,
        definitionId: 414,
        type: "agenda" as const,
        subtypes: ["gray_ops"],
      },
    ];

    expect(
      corpScoredGeneticsVisionaryAcquisitionActive(corpScoreAreaCards),
    ).toBe(true);
    expect(
      researchAgendaDifficultyModifierLineForCard(
        {
          known: true,
          definitionId: 401,
          type: "agenda",
          subtypes: ["research"],
        },
        corpScoreAreaCards,
      ),
    ).toMatchObject({
      value: "Diff -1",
      label: "Genetics-Visionary Acquisition: braucht 1 Entwicklung weniger",
      tone: "agenda",
    });
  });

  it("does not mark hidden Research agendas", () => {
    const corpScoreAreaCards = [
      {
        instanceId: "score-1",
        known: true,
        definitionId: 414,
        type: "agenda" as const,
        subtypes: ["gray_ops"],
      },
    ];

    expect(
      researchAgendaDifficultyModifierLineForCard(
        {
          known: false,
          definitionId: 401,
          type: "agenda",
          subtypes: ["research"],
        },
        corpScoreAreaCards,
      ),
    ).toBeNull();
  });
});
