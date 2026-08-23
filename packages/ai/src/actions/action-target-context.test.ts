import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

import { applyTargetContextProjection } from "./action-target-context";

describe("applyTargetContextProjection", () => {
  it("completes partial projection only for exact action types", () => {
    expect(
      applyTargetContextProjection(
        candidate(),
        action("score_agenda"),
        undefined,
        undefined,
      ).primaryProjectionStatus,
    ).toBe("projected");
    expect(
      applyTargetContextProjection(
        candidate(),
        action("score_agenda_noise"),
        undefined,
        undefined,
      ).primaryProjectionStatus,
    ).toBe("partial_projected");
  });

  it("binds a delayed-install ability to its exact prepared card", () => {
    const projected = applyTargetContextProjection(
      candidate(),
      {
        ...action("trigger_ability"),
        side: "runner",
        source: "shell-traders-1",
        payload: {
          delayedInstallAbility: "set_aside_from_grip",
          cardId: "shell-traders-1",
          targetCardId: "dwarf-1",
          targetCardDefinitionId: "dwarf-definition",
        },
      },
      undefined,
      undefined,
    );

    expect(projected.targetContext?.selectedTargets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetId: "dwarf-1",
          targetKind: "card",
          targetSide: "runner",
          targetDefinitionId: "dwarf-definition",
        }),
      ]),
    );
  });

  it.each([
    ["runner.rig.programs", "program-host"],
    ["runner.rig.hardware", "hardware-host"],
  ] as const)(
    "projects the exact hosted-install target in %s without changing the action",
    (zoneScope, hostCardId) => {
      const hostedInstallAction = {
        ...action("install_card"),
        actionId: `runner.install_card.program.${hostCardId}`,
        side: "runner",
        payload: {
          cardId: "program-to-install",
          hostOnCardId: hostCardId,
        },
        targetRequirements: [
          {
            id: "hostProgram",
            kind: "card",
            side: "runner",
            zoneScope: [zoneScope],
            targetCardRef: hostCardId,
            visibility: "public",
          },
        ],
      } satisfies LegalAction;

      const projected = applyTargetContextProjection(
        candidate(),
        hostedInstallAction,
        undefined,
        undefined,
      );

      expect(hostedInstallAction.actionId).toBe(
        `runner.install_card.program.${hostCardId}`,
      );
      expect(projected.targetContext?.availableTargets).toEqual([
        expect.objectContaining({
          targetId: hostCardId,
          targetKind: "card",
          targetSide: "runner",
          targetZone: zoneScope,
        }),
      ]);
      expect(projected.projectionIssues).not.toContain(
        "target_context_unavailable",
      );
    },
  );
});

function candidate(): ActionSemanticCandidate {
  return {
    primaryProjectionStatus: "partial_projected",
    projectionIssues: ["target_context_unavailable"],
    hardGates: [],
    evidence: [],
  } as unknown as ActionSemanticCandidate;
}

function action(type: string): LegalAction {
  return {
    actionId: `test.${type}`,
    side: "corp",
    type: type as LegalAction["type"],
    label: type,
    source: "agenda",
    timingPoint: "corp_action.main",
    costs: [],
    payload: { serverId: "remote_1" },
    targetRequirements: [
      {
        id: "server",
        kind: "server",
        allowedServers: ["remote_1"],
      },
    ],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
