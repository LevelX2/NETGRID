import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { scoreCorpOperation, scoreCorpRootInstall } from "./corp-card-action-score";

describe("corp-card-action-score", () => {
  it("matches corp root install roles by bounded role terms", () => {
    expect(
      scoreCorpRootInstall(
        ["agenda_asset", "remote_economy_asset"],
        installAction(),
        { credits: 3, handCount: 5, opponentTags: 0 },
        { remote: 1, score: 1 },
      ),
    ).toBe(780);

    expect(
      scoreCorpRootInstall(
        ["agendaish_asset", "agendalike_asset", "remote_economy_assetish_noise"],
        installAction(),
        { credits: 3, handCount: 5, opponentTags: 0 },
        { remote: 1, score: 1 },
      ),
    ).toBe(545);
    expect(
      scoreCorpRootInstall(
        ["remote_agenda_protection"],
        installAction(),
        { credits: 3, handCount: 5, opponentTags: 0 },
        { remote: 1, score: 1 },
      ),
    ).toBe(690);
  });

  it("matches corp operation roles by bounded role terms", () => {
    expect(
      scoreCorpOperation(
        ["tag_punishment_followup"],
        { credits: 3, handCount: 2, opponentTags: 1 },
        { economy: 1 },
      ),
    ).toBe(790);
    expect(
      scoreCorpOperation(
        ["economy_operation_burst", "draw_operation"],
        { credits: 3, handCount: 2, opponentTags: 0 },
        { economy: 1 },
      ),
    ).toBe(760);
    expect(
      scoreCorpOperation(
        ["economy_operationish_noise", "draw_operationish_noise"],
        { credits: 3, handCount: 2, opponentTags: 0 },
        { economy: 1 },
      ),
    ).toBe(480);
  });
});

function installAction(): LegalAction {
  return {
    actionId: "install",
    type: "install_card",
    side: "corp",
    payload: {},
  } as LegalAction;
}
