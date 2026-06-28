import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { semanticRuntimeCorpActionIsScoreLine } from "./semantic-runtime-corp-board";

describe("semanticRuntimeCorpActionIsScoreLine", () => {
  it("matches agenda roles by bounded role terms", () => {
    expect(isScoreLine(["agenda"])).toBe(true);
    expect(isScoreLine(["corp_score_agenda"])).toBe(true);
    expect(isScoreLine(["remote_agenda_protection"])).toBe(false);
    expect(isScoreLine(["agenda_protection"])).toBe(true);
    expect(isScoreLine(["agendaish_asset"])).toBe(false);
    expect(isScoreLine(["agenda_like_noise"])).toBe(false);
  });
});

function isScoreLine(roles: string[]): boolean {
  return semanticRuntimeCorpActionIsScoreLine(input(), action(), {
    serverId: () => undefined,
    findVisibleCard: () => undefined,
    findVisibleCorpServerCard: () => undefined,
    rolesForAction: () => roles,
    isRemoteServerTarget: () => false,
  });
}

function input(): AiDecisionInput {
  return { playerView: { servers: [] } } as unknown as AiDecisionInput;
}

function action(): LegalAction {
  return {
    actionId: "install",
    side: "corp",
    type: "install_card",
    source: "basic_action",
    payload: {},
  } as LegalAction;
}
