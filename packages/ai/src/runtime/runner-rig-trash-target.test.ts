import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  corpVisibleRunnerHardwareTrashTarget,
  corpVisibleRunnerRigTrashTarget,
} from "./runner-rig-trash-target";

describe("runner rig trash target", () => {
  it("binds trash targets by exact visible runner rig card ids", () => {
    const matchingProgram = visibleCard({
      instanceId: "program-target",
      type: "program",
    });
    const hiddenMatch = visibleCard({
      instanceId: "hidden-target",
      known: false,
      type: "program",
    });
    const input = decisionInputWithOpponentRig([hiddenMatch, matchingProgram]);

    expect(
      corpVisibleRunnerRigTrashTarget(
        input,
        action({ payload: { targetCardId: "program-target" } }),
      ),
    ).toBe(matchingProgram);
    expect(
      corpVisibleRunnerRigTrashTarget(
        input,
        action({ payload: { cardId: "program" } }),
      ),
    ).toBeUndefined();
    expect(
      corpVisibleRunnerRigTrashTarget(
        input,
        action({ payload: { targetCardId: "hidden-target" } }),
      ),
    ).toBeUndefined();
  });

  it("keeps hardware fallback limited to known runner hardware", () => {
    const hiddenHardware = visibleCard({
      instanceId: "hidden-hardware",
      known: false,
      type: "hardware",
    });
    const knownHardware = visibleCard({
      instanceId: "known-hardware",
      type: "hardware",
    });

    expect(
      corpVisibleRunnerHardwareTrashTarget(
        decisionInputWithOpponentRig([hiddenHardware, knownHardware]),
      ),
    ).toBe(knownHardware);
  });
});

function action(overrides: Partial<LegalAction>): LegalAction {
  return {
    actionId: "corp-trash-runner-rig",
    side: "corp",
    type: "trash_resource",
    label: "Trash runner rig card",
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
    ...overrides,
  } as LegalAction;
}

function decisionInputWithOpponentRig(rig: VisibleCard[]): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    playerView: {
      side: "corp",
      own: {
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
      },
      opponent: {
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 1,
        badPublicity: 0,
        rig,
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
    type: "program",
    known: true,
    faceup: true,
    rezzed: true,
    ...overrides,
  } as VisibleCard;
}
