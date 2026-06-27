import { describe, expect, it } from "vitest";
import type { LegalAction, PlayerView, VisibleCard } from "@netgrid/shared";

import { visibleCardForAction } from "./tactical-plan-visible-cards";

describe("visibleCardForAction", () => {
  it("uses source and payload identifiers but ignores label-only card titles", () => {
    const card = visibleCard({
      instanceId: "visible-card-1",
      definitionId: "visible_definition",
      title: "Visible Bank",
    });
    const playerView = playerViewWithVisibleCards([card]);

    expect(
      visibleCardForAction(
        playerView,
        action({ source: "visible-card-1", label: "anything" }),
      )?.instanceId,
    ).toBe("visible-card-1");
    expect(
      visibleCardForAction(
        playerView,
        action({
          source: "unknown",
          payload: { sourceDefinitionId: "visible_definition" },
        }),
      )?.instanceId,
    ).toBe("visible-card-1");
    expect(
      visibleCardForAction(
        playerView,
        action({ source: "unknown", label: "Use Visible Bank" }),
      ),
    ).toBeUndefined();
  });
});

function action(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "action",
    side: "runner",
    type: "trigger_ability",
    label: "Action",
    source: "source",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  } as LegalAction;
}

function playerViewWithVisibleCards(cards: VisibleCard[]): PlayerView {
  return {
    side: "runner",
    own: {
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: cards,
      heapOrArchives: [],
      scoreArea: [],
      rig: [],
    },
    opponent: {
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      badPublicity: 0,
    },
    servers: [],
  } as unknown as PlayerView;
}

function visibleCard(overrides: Partial<VisibleCard>): VisibleCard {
  return {
    instanceId: "card",
    definitionId: "definition",
    title: "Visible Card",
    type: "resource",
    known: true,
    faceup: true,
    rezzed: true,
    ...overrides,
  } as VisibleCard;
}
