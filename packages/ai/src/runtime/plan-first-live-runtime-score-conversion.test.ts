import { describe, expect, it } from "vitest";

import { sameTurnScoreConversionPreventsTerminalSteal } from "./plan-first-live-runtime";

describe("same-turn score conversion terminal-steal ownership", () => {
  it("does not promote a sibling new-remote install above an exact committed score root", () => {
    expect(
      sameTurnScoreConversionPreventsTerminalSteal({
        targetServerId: "new_remote",
        opponentAgendaPoints: 6,
        agendaPointsToWin: 7,
        visibleHqAgendaIds: ["agenda-sibling"],
        agendaCardId: "agenda-sibling",
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
      }),
    ).toBe(true);
  });
});
