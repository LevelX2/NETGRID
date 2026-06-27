import { describe, expect, it } from "vitest";
import type { LegalAction, PlayerView, VisibleCard } from "@netgrid/shared";

import { isBreakerInstallAction } from "./tactical-plan-breaker-coverage";

describe("isBreakerInstallAction", () => {
  it("uses visible source card coverage and ignores label-only breaker text", () => {
    const breaker = visibleCard({
      instanceId: "runner-breaker-1",
      definitionId: "custom-breaker",
      title: "Custom Tool",
      subtypes: ["Icebreaker", "Fracter"],
    });
    const playerView = playerViewWithGrip([breaker]);
    const matchesBreaker = isBreakerInstallAction(playerView, "breaker_wall");

    expect(
      matchesBreaker(installAction("runner-breaker-1", "Install Custom Tool")),
    ).toBe(true);
    expect(
      matchesBreaker(installAction("missing-card", "Install Best Fracter")),
    ).toBe(false);
  });
});

function installAction(source: string, label: string): LegalAction {
  return {
    actionId: `install-${source}`,
    side: "runner",
    type: "install_card",
    label,
    source,
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  } as LegalAction;
}

function playerViewWithGrip(cards: VisibleCard[]): PlayerView {
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
    type: "program",
    known: true,
    faceup: true,
    rezzed: true,
    ...overrides,
  } as VisibleCard;
}
