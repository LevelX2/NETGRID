import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  semanticRuntimeCorpRemoteRezFloorAssessment,
} from "./semantic-runtime-corp-rez-floor";

describe("semanticRuntimeCorpRemoteRezFloorAssessment", () => {
  it("blocks scoreline installs that leave no reserve for the next advance", () => {
    const action = corpAction("install-scoreline", "install_card", {
      placement: "root",
    });
    const assessment = semanticRuntimeCorpRemoteRezFloorAssessment(
      corpInput(2),
      action,
      testDependencies({
        actionIsScoreLine: true,
      }),
    );

    expect(assessment).toEqual(
      expect.objectContaining({
        rezFloor: 2,
        requiredCreditsAfterAction: 3,
        creditsAfterAction: 2,
        blockedByFloor: true,
      }),
    );
    expect(assessment?.evidence).toEqual(
      expect.arrayContaining([
        "scoreline_install_next_advance_reserve:1",
        "agenda_development_risk:below_remote_rez_floor",
      ]),
    );
  });

  it("keeps advance actions on the existing rez floor without extra install reserve", () => {
    const action = corpAction("advance-scoreline", "advance_card");
    const assessment = semanticRuntimeCorpRemoteRezFloorAssessment(
      corpInput(3),
      action,
      testDependencies({
        actionCreditCost: 1,
      }),
    );

    expect(assessment).toEqual(
      expect.objectContaining({
        rezFloor: 2,
        requiredCreditsAfterAction: 2,
        creditsAfterAction: 2,
        blockedByFloor: false,
      }),
    );
  });
});

function corpInput(credits: number): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    playerView: {
      own: {
        credits,
      },
      servers: [
        {
          id: "remote_1",
          ice: [
            {
              instanceId: "remote-ice",
              known: true,
              type: "ice",
              rezzed: false,
              rezCost: 2,
            } as VisibleCard,
          ],
          root: [],
        },
      ],
    },
  } as unknown as AiDecisionInput;
}

function corpAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    costs: [],
    payload,
  } as unknown as LegalAction;
}

function testDependencies(overrides: {
  actionCreditCost?: number;
  actionIsScoreLine?: boolean;
} = {}) {
  return {
    actionServerId: () => "remote_1",
    isRemoteServerTarget: () => true,
    server: (input: AiDecisionInput) => input.playerView.servers[0],
    actionCreditCost: () => overrides.actionCreditCost ?? 0,
    advanceCompletesScore: () => false,
    actionIsScoreLine: () => overrides.actionIsScoreLine ?? false,
    remoteHasScoreLine: () => false,
    visibleIceRezCost: (card: VisibleCard) => card.rezCost,
  };
}
