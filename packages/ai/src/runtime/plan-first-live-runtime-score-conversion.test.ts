import { describe, expect, it } from "vitest";

import { sameTurnScoreConversionPreventsTerminalSteal } from "../corp/score/score-project-signals";

describe("same-turn score conversion terminal-steal ownership", () => {
  it("keeps the sole agenda's terminal prevention after its exact install", () => {
    const facts = {
      targetServerId: "remote_1",
      opponentAgendaPoints: 6,
      agendaPointsToWin: 7,
      visibleHqAgendaIds: [],
      agendaCardId: "installed-agenda",
      installedAgendaId: "installed-agenda",
      hasOtherInstalledAgenda: false,
    };
    expect(sameTurnScoreConversionPreventsTerminalSteal(facts)).toBe(true);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...facts,
        installedAgendaId: "different",
      }),
    ).toBe(false);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...facts,
        installedAgendaId: undefined,
      }),
    ).toBe(false);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...facts,
        hasOtherInstalledAgenda: true,
      }),
    ).toBe(false);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...facts,
        visibleHqAgendaIds: ["other"],
      }),
    ).toBe(false);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...facts,
        opponentAgendaPoints: 5,
      }),
    ).toBe(false);
  });
  it("does not promote a sibling new-remote install above an exact committed score root", () => {
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        targetServerId: "new_remote",
        opponentAgendaPoints: 6,
        agendaPointsToWin: 7,
        visibleHqAgendaIds: ["agenda-sibling"],
        agendaCardId: "agenda-sibling",
        hasOtherInstalledAgenda: true,
      }),
    ).toBe(false);
  });

  it("retains terminal-steal prevention for an existing protected score server", () => {
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        targetServerId: "remote_1",
        opponentAgendaPoints: 6,
        agendaPointsToWin: 7,
        visibleHqAgendaIds: ["agenda-exact"],
        agendaCardId: "agenda-exact",
        hasOtherInstalledAgenda: false,
      }),
    ).toBe(true);
  });

  it("allows the complete sole-agenda score to remove terminal HQ exposure in a new remote", () => {
    const facts = {
      targetServerId: "new_remote",
      opponentAgendaPoints: 6,
      agendaPointsToWin: 7,
      visibleHqAgendaIds: ["sole-agenda"],
      agendaCardId: "sole-agenda",
      hasOtherInstalledAgenda: false,
    };
    expect(sameTurnScoreConversionPreventsTerminalSteal(facts)).toBe(true);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...facts,
        opponentAgendaPoints: 5,
      }),
    ).toBe(false);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...facts,
        visibleHqAgendaIds: ["sole-agenda", "second"],
      }),
    ).toBe(false);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...facts,
        agendaCardId: "different",
      }),
    ).toBe(false);
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        ...facts,
        hasOtherInstalledAgenda: true,
      }),
    ).toBe(false);
  });
});
