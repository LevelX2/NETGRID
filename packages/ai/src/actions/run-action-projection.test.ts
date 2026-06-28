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

  it("bounds path-blocked run signals to structured entries", () => {
    const blocked = action({
      actionId: "blocked",
      label: "Use ability",
      payload: {
        runActionSignals: ["make_run", "path blocked"],
        serverId: "hq",
      } as unknown as LegalAction["payload"],
    });
    const noise = action({
      actionId: "blocked-noise",
      label: "Use ability",
      payload: {
        runActionSignals: ["make_run", "path blockedness"],
        serverId: "hq",
      } as unknown as LegalAction["payload"],
    });

    const projections = projectRunnerRunActions({
      input: input([blocked, noise]),
    });

    expect(projections.map((projection) => projection.actionId)).toEqual([
      "blocked-noise",
    ]);
  });

  it("bounds scoped run signals to structured entries", () => {
    const scoped = action({
      actionId: "scoped-run",
      label: "Use ability",
      payload: {
        runActionSignals: ["run", "scope:hq"],
      } as unknown as LegalAction["payload"],
    });
    const noise = action({
      actionId: "scoped-noise",
      label: "Use ability",
      payload: {
        runActionSignals: ["runway", "scope:hq"],
      } as unknown as LegalAction["payload"],
    });

    const projections = projectRunnerRunActions({
      input: input([scoped, noise]),
    });

    expect(projections.map((projection) => projection.actionId)).toEqual([
      "scoped-run",
    ]);
  });

  it("bounds run-pressure payoff event signals to structured entries", () => {
    const pressure = action({
      actionId: "pressure-run",
      type: "play_event",
      payload: {
        runActionSignals: ["run_pressure", "multiaccess", "scope:hq"],
      } as unknown as LegalAction["payload"],
    });
    const noise = action({
      actionId: "pressure-noise",
      type: "play_event",
      payload: {
        runActionSignals: [
          "run_pressure",
          "multiaccessory_noise",
          "scope:hq",
        ],
      } as unknown as LegalAction["payload"],
    });

    const projections = projectRunnerRunActions({
      input: input([pressure, noise]),
    });

    expect(projections.map((projection) => projection.actionId)).toEqual([
      "pressure-run",
    ]);
  });

  it("bounds run action structure signals to structured entries", () => {
    const multiRun = action({
      actionId: "multi-run",
      payload: {
        runActionSignals: ["make_run", "multi_run_sequence", "scope:hq"],
      } as unknown as LegalAction["payload"],
    });
    const noise = action({
      actionId: "multi-run-noise",
      payload: {
        runActionSignals: ["make_run", "multi_run_sequenceish", "scope:hq"],
      } as unknown as LegalAction["payload"],
    });

    const projections = projectRunnerRunActions({
      input: input([multiRun, noise]),
    });

    expect(projections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "multi-run",
          structure: "multi_run_sequence",
        }),
        expect.objectContaining({
          actionId: "multi-run-noise",
          structure: "run_enabler",
        }),
      ]),
    );
  });

  it("bounds hq-via-archives override signals to structured entries", () => {
    const hqViaArchives = action({
      actionId: "hq-via-archives",
      payload: {
        runActionSignals: ["run", "scope:archives", "target:hq_via_archives"],
      } as unknown as LegalAction["payload"],
    });
    const noise = action({
      actionId: "hq-via-archives-noise",
      payload: {
        runActionSignals: [
          "run",
          "scope:archives",
          "target:hq_via_archivesish",
        ],
      } as unknown as LegalAction["payload"],
    });

    const projections = projectRunnerRunActions({
      input: input([hqViaArchives, noise]),
    });
    const hqViaArchivesProjection = projections.find(
      (projection) => projection.actionId === "hq-via-archives",
    );
    const noiseProjection = projections.find(
      (projection) => projection.actionId === "hq-via-archives-noise",
    );

    expect(hqViaArchivesProjection).toMatchObject({
      targetServerId: "archives",
      accessServerId: "hq",
    });
    expect(noiseProjection).toMatchObject({
      targetServerId: "archives",
    });
    expect(noiseProjection?.accessServerId).toBeUndefined();
  });

  it("bounds run projection constraint signals to structured entries", () => {
    const constrained = action({
      actionId: "constrained-run",
      payload: {
        runActionSignals: [
          "make_run",
          "scope:hq",
          "no_noisy",
          "bypass_first_ice",
        ],
      } as unknown as LegalAction["payload"],
    });
    const noise = action({
      actionId: "constraint-noise",
      payload: {
        runActionSignals: [
          "make_run",
          "scope:hq",
          "no_noisyish",
          "inside_jobber",
        ],
      } as unknown as LegalAction["payload"],
    });

    const projections = projectRunnerRunActions({
      input: input([constrained, noise]),
    });
    const constrainedProjection = projections.find(
      (projection) => projection.actionId === "constrained-run",
    );
    const noiseProjection = projections.find(
      (projection) => projection.actionId === "constraint-noise",
    );

    expect(constrainedProjection).toMatchObject({
      noNoisyBreakers: true,
      bypassFirstIce: true,
    });
    expect(noiseProjection).toMatchObject({
      noNoisyBreakers: false,
      bypassFirstIce: false,
    });
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
