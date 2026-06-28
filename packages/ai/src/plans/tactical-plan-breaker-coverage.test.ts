import { describe, expect, it } from "vitest";
import type { LegalAction, PlayerView, VisibleCard } from "@netgrid/shared";

import {
  isBreakerInstallAction,
  missingBreakerCoverageKind,
} from "./tactical-plan-breaker-coverage";

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

describe("missingBreakerCoverageKind", () => {
  it("matches ICE coverage text by bounded terms", () => {
    expect(missingCoverageForIceText("AP sentry")).toBe("breaker_sentry");
    expect(missingCoverageForIceText("AP")).toBe("breaker_ap");
    expect(missingCoverageForIceText("appliance trace")).toBe("breaker_trace");
    expect(missingCoverageForIceText("appliance")).toBe("breaker_universal");
    expect(missingCoverageForIceText("codegate")).toBe("breaker_code_gate");
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

function playerViewWithIce(ice: VisibleCard): PlayerView {
  return {
    ...playerViewWithGrip([]),
    servers: [
      {
        id: "remote_1",
        ice: [ice],
        root: [],
      },
    ],
  } as unknown as PlayerView;
}

function missingCoverageForIceText(text: string) {
  return missingBreakerCoverageKind(
    playerViewWithIce(
      visibleCard({
        instanceId: "ice",
        type: "ice",
        title: text,
        rulesText: "",
      }),
    ),
    "remote_1",
  );
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
