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

  it.each([
    ["missing", (ice: any) => delete ice.effectiveRezCostQuote],
    [
      "incomplete",
      (ice: any) => {
        ice.effectiveRezCostQuote = {
          context: "installed",
          complete: false,
          cardId: ice.instanceId,
          targetServerId: "remote_1",
          projectedServerId: "remote_1",
          expiresAtStateVersion: 1,
        };
      },
    ],
    [
      "stale",
      (ice: any) => {
        ice.effectiveRezCostQuote.expiresAtStateVersion = 0;
      },
    ],
    [
      "mandatory additional cost",
      (ice: any) => {
        ice.effectiveRezCostQuote.mandatoryAdditionalCosts.agendaPoints = 1;
      },
    ],
  ])("fails closed for a %s rez-floor quote", (_label, corruptQuote) => {
    const input = corpInput(3);
    corruptQuote(input.playerView.servers[0]!.ice[0]);

    const assessment = semanticRuntimeCorpRemoteRezFloorAssessment(
      input,
      corpAction("advance-scoreline", "advance_card"),
      testDependencies(),
    );

    expect(assessment).toMatchObject({
      knowledge: "unknown",
      rezFloor: undefined,
      requiredCreditsAfterAction: undefined,
      blockedByFloor: true,
      evidence: expect.arrayContaining([
        "remote_rez_floor_knowledge:unknown",
        "agenda_development_risk:below_remote_rez_floor",
      ]),
    });
  });

  it.each([
    ["NaN current credits", Number.NaN, 0],
    ["negative current credits", -1, 0],
    ["fractional current credits", 3.5, 0],
    ["NaN action cost", 3, Number.NaN],
    ["infinite action cost", 3, Number.POSITIVE_INFINITY],
    ["negative action cost", 3, -1],
    ["fractional action cost", 3, 0.5],
    ["action cost above bank", 3, 4],
  ])(
    "fails closed for %s",
    (_label, currentCredits, actionCreditCost) => {
      const assessment = semanticRuntimeCorpRemoteRezFloorAssessment(
        corpInput(currentCredits),
        corpAction("advance-scoreline", "advance_card"),
        testDependencies({ actionCreditCost }),
      );

      expect(assessment).toMatchObject({
        knowledge: "unknown",
        rezFloor: undefined,
        requiredCreditsAfterAction: undefined,
        creditsAfterAction: undefined,
        blockedByFloor: true,
        evidence: expect.arrayContaining([
          "remote_rez_floor_knowledge:unknown",
          "remote_rez_floor:invalid_credit_input",
        ]),
      });
    },
  );
});

function corpInput(credits: number): AiDecisionInput {
  return {
    side: "corp",
    legalActions: [],
    playerView: {
      stateVersion: 1,
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
              definitionId: "test-remote-ice",
              rezzed: false,
              rezCost: 2,
              effectiveRezCostQuote: {
                context: "installed",
                complete: true,
                cardId: "remote-ice",
                targetServerId: "remote_1",
                projectedServerId: "remote_1",
                expiresAtStateVersion: 1,
                baseCredits: 2,
                finalCredits: 2,
                mandatoryAdditionalCosts: { agendaPoints: 0 },
              },
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
  };
}
