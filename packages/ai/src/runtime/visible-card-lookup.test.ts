import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import { semanticRuntimeVisibleSourceCard } from "./visible-card-lookup";

describe("semanticRuntimeVisibleSourceCard", () => {
  it("uses source and payload identifiers but ignores label-only card titles", () => {
    const card = visibleCard({
      instanceId: "runtime-card-1",
      definitionId: "runtime_definition",
      title: "Runtime Bank",
    });
    const input = decisionInputWithVisibleCards([card]);

    expect(
      semanticRuntimeVisibleSourceCard(
        input,
        action({ source: "runtime-card-1", label: "anything" }),
      )?.instanceId,
    ).toBe("runtime-card-1");
    expect(
      semanticRuntimeVisibleSourceCard(
        input,
        action({
          source: "unknown",
          payload: { sourceDefinitionId: "runtime_definition" },
        }),
      )?.instanceId,
    ).toBe("runtime-card-1");
    expect(
      semanticRuntimeVisibleSourceCard(
        input,
        action({ source: "unknown", label: "Use Runtime Bank" }),
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

function decisionInputWithVisibleCards(cards: VisibleCard[]): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [],
    playerView: {
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
    },
  } as unknown as AiDecisionInput;
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
