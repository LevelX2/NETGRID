import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";

import { projectRunnerRunActions } from "./run-action-projection";

describe("projectRunnerRunActions", () => {
  it("projects declarative activated run payloads without reading their label", () => {
    const activatedRun = action({
      actionId: "activated-rd-scout",
      type: "activated_card_ability",
      label: "Use ability",
      payload: {
        cardImplementationEffectKind: "make_run",
        runActionKind: "make_run",
        serverId: "rd",
        successfulRunAccessReplacement: "private_look_top_rd",
        successfulRunPrivateLookCount: 5,
        bypassFirstIce: true,
      },
    });

    expect(projectRunnerRunActions({ input: input([activatedRun]) })).toEqual([
      expect.objectContaining({
        actionId: "activated-rd-scout",
        targetServerId: "rd",
        projectionStatus: "concrete_target",
        accessReplacement: "private_look_top_rd",
        accessReplacementLookCount: 5,
        bypassFirstIce: true,
        accessPayoffSignals: expect.arrayContaining([
          "access.replacement",
          "access.replacement:private_look_top_rd",
          "access.rnd_topdeck_info",
        ]),
      }),
    ]);
  });

  it("projects Lucidrine as a concrete run with expiring credits and post-run core damage", () => {
    const lucidrine = action({
      actionId: "lucidrine-rd",
      type: "play_event",
      source: "lucidrine-instance",
      payload: {
        cardId: "lucidrine-instance",
        sourceDefinitionId: "onr_v1_098_lucidrine-booster-drug",
        serverId: "rd",
        runnerEventRun: true,
        runTemporaryCredits: 9,
        afterRunUnpreventableCoreDamage: 1,
      },
    });

    expect(projectRunnerRunActions({ input: input([lucidrine]) })).toEqual([
      expect.objectContaining({
        actionId: "lucidrine-rd",
        targetServerId: "rd",
        projectionStatus: "concrete_target",
        temporaryRunCredits: 9,
        postRunSelfDamage: 1,
      }),
    ]);
  });

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

  it("does not turn an installed future run payoff into a run action", () => {
    const installPayoff = action({
      actionId: "install-hq-interface",
      type: "install_card",
      payload: {
        cardId: "hq-interface",
        sourceDefinitionId: "onr_v1_129_hq-interface",
        runActionSignals: ["hq_run"],
        serverId: "hq",
      },
    });

    expect(projectRunnerRunActions({ input: input([installPayoff]) })).toEqual(
      [],
    );
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
        runActionSignals: ["run_pressure", "multiaccessory_noise", "scope:hq"],
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

  it("takes run constraints exclusively from LegalAction payload", () => {
    const constrained = action({
      actionId: "constrained-run",
      payload: {
        runActionSignals: [
          "make_run",
          "scope:hq",
          "no_noisy",
          "bypass_first_ice",
        ],
        noNoisyBreakers: true,
        bypassFirstIce: true,
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

  it("bounds access payoff projection signals to structured tokens", () => {
    const accessPayoff = action({
      actionId: "access-payoff-run",
      payload: {
        runActionSignals: [
          "make_run",
          "scope:hq",
          "access",
          "free_trash",
          "bypass",
        ],
      } as unknown as LegalAction["payload"],
    });
    const noise = action({
      actionId: "access-payoff-noise",
      payload: {
        runActionSignals: [
          "make_run",
          "scope:hq",
          "accessory",
          "free_trashcan",
          "bypasser",
        ],
      } as unknown as LegalAction["payload"],
    });

    const projections = projectRunnerRunActions({
      input: input([accessPayoff, noise]),
    });
    const accessProjection = projections.find(
      (projection) => projection.actionId === "access-payoff-run",
    );
    const noiseProjection = projections.find(
      (projection) => projection.actionId === "access-payoff-noise",
    );

    expect(accessProjection?.accessPayoffSignals).toEqual(
      expect.arrayContaining(["access", "free_trash", "bypass"]),
    );
    expect(noiseProjection?.accessPayoffSignals).toEqual([]);
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
      projections.find(
        (projection) => projection.actionId === "label-like-server",
      )?.targetServerId,
    ).toBeUndefined();
  });

  it("does not widen a concrete action target with generic card capability signals", () => {
    const concreteHqRun = action({
      actionId: "library-search-hq",
      type: "play_event",
      payload: {
        serverId: "hq",
        runActionSignals: [
          "run_pressure",
          "multiaccess",
          "scope:hq",
          "scope:rd",
        ],
      } as unknown as LegalAction["payload"],
    });

    expect(projectRunnerRunActions({ input: input([concreteHqRun]) })).toEqual([
      expect.objectContaining({
        actionId: "library-search-hq",
        targetServerId: "hq",
        projectionStatus: "concrete_target",
      }),
    ]);
  });

  it("projects Bodyweight's click-free followup as a bonus run without treating decline as a run", () => {
    const bonusRun = action({
      actionId: "bodyweight-run-rd",
      type: "start_run",
      source: "basic_action",
      label: "Bonus-Run auf R&D",
      payload: {
        serverId: "rd",
        bonusRunNoClick: true,
        bonusRunSource: "onr_v1_123_bodyweight-data-creche",
      },
    });
    const decline = action({
      actionId: "bodyweight-decline",
      type: "trigger_ability",
      source: "bodyweight_1",
      payload: {
        cardId: "bodyweight_1",
        sourceDefinitionId: "onr_v1_123_bodyweight-data-creche",
        runnerAbility: "decline_successful_run_extra_run",
        successfulRunExtraRunDecision: "decline",
      },
    });

    const projections = projectRunnerRunActions({
      input: input([bonusRun, decline]),
    });

    expect(projections).toEqual([
      expect.objectContaining({
        actionId: "bodyweight-run-rd",
        actionType: "start_run",
        structure: "bonus_run",
        targetServerId: "rd",
        projectionStatus: "concrete_target",
      }),
    ]);
  });

  it("projects Private LDL as an HQ run that accesses R&D", () => {
    const privateLdl = action({
      actionId: "private-ldl-hq",
      type: "play_event",
      source: "private-ldl-instance",
      payload: {
        cardId: "private-ldl-instance",
        sourceDefinitionId: "onr_v1_106_private-ldl-access",
        serverId: "hq",
      },
    });

    const projections = projectRunnerRunActions({
      input: input([privateLdl]),
    });

    expect(projections).toEqual([
      expect.objectContaining({
        actionId: "private-ldl-hq",
        targetServerId: "hq",
        accessServerId: "rd",
        accessPayoffSignals: expect.arrayContaining([
          "access.replacement",
          "access.hq_to_rnd_conversion",
        ]),
      }),
    ]);
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
