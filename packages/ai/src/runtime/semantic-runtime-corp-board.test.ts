import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import {
  semanticRuntimeCorpActionIsScoreLine,
  semanticRuntimeCorpActionSourceCard,
} from "./semantic-runtime-corp-board";

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

describe("semanticRuntimeCorpActionSourceCard", () => {
  it("resolves a game-rule action target through its side-safe payload card id", () => {
    const agenda = {
      instanceId: "agenda-instance",
      definitionId: "simple_agenda",
      title: "Simple Agenda",
      type: "agenda",
      known: true,
      owner: "corp",
      controller: "corp",
    } as VisibleCard;
    const action = {
      actionId: "corp.advance_card.remote_1",
      side: "corp",
      type: "advance_card",
      label: "Agenda advancen",
      source: "game_rule",
      timingPoint: "corp_action.main",
      costs: [{ clicks: 1, credits: 1 }],
      targetRequirements: [],
      visibility: "public",
      expiresAtStateVersion: 1,
      payload: { cardId: agenda.instanceId, serverId: "remote_1" },
    } satisfies LegalAction;

    expect(
      semanticRuntimeCorpActionSourceCard(input(), action, {
        serverId: () => "remote_1",
        findVisibleCard: (_input, cardId) =>
          cardId === agenda.instanceId ? agenda : undefined,
        findVisibleCorpServerCard: () => undefined,
        rolesForAction: () => [],
        isRemoteServerTarget: () => true,
      }),
    ).toBe(agenda);
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
