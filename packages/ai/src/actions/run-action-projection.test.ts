import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { projectRunnerRunActions } from "./run-action-projection";

describe("projectRunnerRunActions", () => {
  it("uses structured run signals and ignores label-only run text", () => {
    const labelOnly = action({
      actionId: "label-only",
      label: "Make a run on HQ",
    });
    const structured = action({
      actionId: "structured",
      label: "Use ability",
      payload: {
        runActionSignals: ["make_run"],
        serverId: "hq",
      } as unknown as LegalAction["payload"],
    });

    const projections = projectRunnerRunActions({
      input: input([labelOnly, structured]),
    });

    expect(projections.map((projection) => projection.actionId)).toEqual([
      "structured",
    ]);
  });

  it("bounds structured run signals before projecting concrete server payloads", () => {
    const structured = action({
      actionId: "structured-run",
      label: "Use ability",
      payload: {
        runActionSignals: ["make_run"],
        serverId: "hq",
      } as unknown as LegalAction["payload"],
    });
    const noise = action({
      actionId: "structured-noise",
      label: "Use ability",
      payload: {
        runActionSignals: ["make_runaway"],
        serverId: "hq",
      } as unknown as LegalAction["payload"],
    });

    const projections = projectRunnerRunActions({
      input: input([structured, noise]),
    });

    expect(projections.map((projection) => projection.actionId)).toEqual([
      "structured-run",
    ]);
  });

  it("requires canonical structured server ids in payloads", () => {
    const labelLikeServer = action({
      actionId: "label-like-server",
      label: "Use ability",
      payload: {
        runActionSignals: ["make_run"],
        serverId: "R&D",
      } as unknown as LegalAction["payload"],
    });
    const canonical = action({
      actionId: "canonical",
      label: "Use ability",
      payload: {
        runActionSignals: ["make_run"],
        serverId: "rd",
      } as unknown as LegalAction["payload"],
    });

    const projections = projectRunnerRunActions({
      input: input([labelLikeServer, canonical]),
    });

    expect(projections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "label-like-server",
          projectionStatus: "missing_target_options",
        }),
        expect.objectContaining({
          actionId: "canonical",
          projectionStatus: "concrete_target",
          targetServerId: "rd",
        }),
      ]),
    );
    expect(
      projections.find((projection) => projection.actionId === "label-like-server")
        ?.targetServerId,
    ).toBeUndefined();
  });
});

function input(legalActions: LegalAction[]): AiDecisionInput {
  return {
    side: "runner",
    legalActions,
    playerView: {
      side: "runner",
      own: {
        identity: visibleCard("runner-identity"),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        heapOrArchives: [],
        scoreArea: [],
        rig: [],
      },
      opponent: {
        identity: visibleCard("corp-identity"),
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

function visibleCard(instanceId: string) {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    type: "identity",
    known: true,
  };
}

function action(overrides: Record<string, unknown>): LegalAction {
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
