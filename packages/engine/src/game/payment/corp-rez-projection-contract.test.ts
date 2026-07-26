import {
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type VisibleCorpRezCostQuote,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { createRemote } from "../state/zone-mutation";
import { validateGameState } from "../validation";
import { buildPlayerViewProjection } from "../view/player-view-projection";
import {
  buildCorpNewRemoteIceInstallAction,
  buildCorpServerIceInstallAction,
} from "../turn/corp-install-actions";
import {
  corpIcePostInstallRezProjectionPayload,
  projectCorpIceRezCostAfterInstall,
  projectInstalledCorpIceRezCost,
} from "./corp-rez-cost";

const WALL = "onr_v1_279_wall-of-static";
const GLACIER = "onr_classic_011_glacier";
const JERUSALEM_CITY_GRID = "onr_v1_360_jerusalem-city-grid";
const DIGICONDA = "onr_proteus_020_digiconda";
const HOMING_MISSILE = "onr_proteus_025_homing-missile";
const SANDSTORM = "onr_proteus_036_sandstorm";
const CREDIT_BLOCKS = "onr_proteus_017_credit-blocks";

function instance(
  instanceId: CardInstanceId,
  definitionId: string,
  zone: CardInstance["zone"],
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    instanceId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone,
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    advancementCounters: 0,
    strengthModifier: 0,
    ...options,
  };
}

function stateWithHandIce(
  definitionId = WALL,
  cardId = "corp_projection_ice" as CardInstanceId,
): { state: GameState; cardId: CardInstanceId } {
  const state = createGame({
    seed: `corp-rez-projection-${definitionId}`,
    setupMode: "completed",
  });
  state.stateVersion = 17;
  state.cardInstances[cardId] = instance(cardId, definitionId, {
    side: "corp",
    zone: "hq",
  });
  state.corp.hq.push(cardId);
  return { state, cardId };
}

function installRezzedRoot(
  state: GameState,
  definitionId: string,
  serverId: "hq" | "rd",
): CardInstanceId {
  const cardId = `root_${definitionId}_${serverId}` as CardInstanceId;
  state.cardInstances[cardId] = instance(
    cardId,
    definitionId,
    { side: "corp", zone: "serverRoot", serverId },
    { faceup: true, rezzed: true },
  );
  state.corp.servers
    .find((server) => server.id === serverId)!
    .root.push(cardId);
  return cardId;
}

describe("Corp ICE rez projection contract", () => {
  it("projects same-server public rez modifiers in the hypothetical post-install position", () => {
    const { state, cardId } = stateWithHandIce();
    installRezzedRoot(state, JERUSALEM_CITY_GRID, "hq");

    expect(projectCorpIceRezCostAfterInstall(state, cardId, "hq")).toEqual({
      context: "post_install",
      cardId,
      targetServerId: "hq",
      projectedServerId: "hq",
      expiresAtStateVersion: 17,
      complete: true,
      costKind: "fixed",
      baseCredits: 3,
      finalCredits: 1,
      mandatoryAdditionalCosts: { agendaPoints: 0 },
      reductionSourceDefinitionIds: [JERUSALEM_CITY_GRID],
    });
    expect(
      projectCorpIceRezCostAfterInstall(state, cardId, "rd"),
    ).toMatchObject({
      complete: true,
      baseCredits: 3,
      finalCredits: 3,
      targetServerId: "rd",
      projectedServerId: "rd",
    });
    expect(state.cardInstances[cardId]?.zone).toEqual({
      side: "corp",
      zone: "hq",
    });
  });

  it("binds each install action projection to card, target server and state version", () => {
    const { state, cardId } = stateWithHandIce();
    const action = buildCorpServerIceInstallAction(
      state,
      cardId,
      { id: "hq", label: "HQ" },
      {
        baseCost: 0,
        additionalCost: 0,
        reduction: 0,
        totalCost: 0,
      },
    );

    expect(action.expiresAtStateVersion).toBe(17);
    expect(action.payload).toMatchObject({
      cardId,
      serverId: "hq",
      placement: "ice",
      iceInstallBaseCost: 0,
      iceInstallAdditionalCost: 0,
      iceInstallReduction: 0,
      iceInstallTotalCost: 0,
      postInstallRezQuoteCardId: cardId,
      postInstallRezQuoteTargetServerId: "hq",
      postInstallRezQuoteProjectedServerId: "hq",
      postInstallRezQuoteExpiresAtStateVersion: 17,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteCostKind: "fixed",
      postInstallRezQuoteBaseCredits: 3,
      postInstallRezQuoteFinalCredits: 3,
      postInstallRezQuoteMandatoryAgendaPointCost: 0,
    });
  });

  it("projects new_remote through the exact next concrete remote position", () => {
    const { state, cardId } = stateWithHandIce();
    state.corp.servers.push({
      id: "remote_4",
      kind: "remote",
      label: "Remote 4",
      ice: [],
      root: [],
    });
    const action = buildCorpNewRemoteIceInstallAction(state, cardId);

    expect(action.payload).toMatchObject({
      cardId,
      serverId: "new_remote",
      postInstallRezQuoteTargetServerId: "new_remote",
      postInstallRezQuoteProjectedServerId: "remote_5",
      postInstallRezQuoteExpiresAtStateVersion: 17,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteFinalCredits: 3,
    });
    expect(createRemote(state).id).toBe("remote_5");
  });

  it("exposes mandatory agenda-point rez cost without folding it into credits", () => {
    const { state, cardId } = stateWithHandIce(GLACIER);
    const projection = projectCorpIceRezCostAfterInstall(
      state,
      cardId,
      "new_remote",
    );
    const action = buildCorpNewRemoteIceInstallAction(state, cardId);

    expect(projection).toMatchObject({
      context: "post_install",
      complete: true,
      baseCredits: 0,
      finalCredits: 0,
      mandatoryAdditionalCosts: { agendaPoints: 1 },
    });
    expect(action.payload).toMatchObject({
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteMandatoryAdditionalCostKind: "agenda_point",
      postInstallRezQuoteMandatoryAgendaPointCost: 1,
    });
  });

  it("aggregates every mandatory agenda-point rez cost exactly once", () => {
    const implementation = cardImplementationForDefinitionId(GLACIER);
    if (!implementation) throw new Error("Glacier implementation missing.");
    const original = implementation.selfRezAdditionalCosts;
    const mutableImplementation = implementation as unknown as {
      selfRezAdditionalCosts: typeof original;
    };
    mutableImplementation.selfRezAdditionalCosts = [
      { kind: "agenda_point", amount: 1, visibility: "public" },
      { kind: "agenda_point", amount: 2, visibility: "public" },
    ];
    try {
      const { state, cardId } = stateWithHandIce(GLACIER);
      const projection = projectCorpIceRezCostAfterInstall(
        state,
        cardId,
        "new_remote",
      );
      const action = buildCorpNewRemoteIceInstallAction(state, cardId);
      expect(projection).toMatchObject({
        complete: true,
        mandatoryAdditionalCosts: { agendaPoints: 3 },
      });
      expect(action.payload).toMatchObject({
        postInstallRezQuoteMandatoryAgendaPointCost: 3,
      });
    } finally {
      mutableImplementation.selfRezAdditionalCosts = original;
    }
  });

  it("certifies bounded X-strength parameters and their exact payment bounds", () => {
    const { state, cardId } = stateWithHandIce(HOMING_MISSILE);
    const action = buildCorpNewRemoteIceInstallAction(state, cardId);

    expect(
      projectCorpIceRezCostAfterInstall(state, cardId, "new_remote"),
    ).toEqual({
      context: "post_install",
      cardId,
      targetServerId: "new_remote",
      projectedServerId: "remote_1",
      expiresAtStateVersion: 17,
      complete: true,
      costKind: "variable",
      baseCredits: 4,
      finalCredits: 4,
      mandatoryAdditionalCosts: { agendaPoints: 0 },
      variableParameter: {
        kind: "x_strength",
        additionalCreditsPerValue: 1,
        minValue: 0,
        maxValue: 8,
        minValueFinalCredits: 4,
        maxValueFinalCredits: 12,
        effectiveStrengthFromValue: true,
        traceBaseFromValue: true,
        traceBidLimitFromValue: true,
      },
    });
    expect(action.payload).toMatchObject({
      postInstallRezQuoteCardId: cardId,
      postInstallRezQuoteTargetServerId: "new_remote",
      postInstallRezQuoteExpiresAtStateVersion: 17,
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteCostKind: "variable",
      postInstallRezQuoteBaseCredits: 4,
      postInstallRezQuoteFinalCredits: 4,
      postInstallRezQuoteVariableRezKind: "x_strength",
      postInstallRezQuoteVariableAdditionalCreditsPerValue: 1,
      postInstallRezQuoteVariableMinValue: 0,
      postInstallRezQuoteVariableMaxValue: 8,
      postInstallRezQuoteVariableMinValueFinalCredits: 4,
      postInstallRezQuoteVariableMaxValueFinalCredits: 12,
      postInstallRezQuoteVariableEffectiveStrengthFromValue: true,
      postInstallRezQuoteVariableTraceBaseFromValue: true,
      postInstallRezQuoteVariableTraceBidLimitFromValue: true,
    });
  });

  it("certifies Sandstorm's first ETR funding frontier beyond current credits", () => {
    const { state, cardId } = stateWithHandIce(SANDSTORM);
    state.corp.credits = 5;
    const projection = projectCorpIceRezCostAfterInstall(state, cardId, "hq");
    const action = buildCorpServerIceInstallAction(
      state,
      cardId,
      { id: "hq", label: "HQ" },
      {
        baseCost: 0,
        additionalCost: 0,
        reduction: 0,
        totalCost: 0,
      },
    );

    expect(projection).toMatchObject({
      complete: true,
      costKind: "variable",
      baseCredits: 4,
      finalCredits: 4,
      variableParameter: {
        kind: "paid_end_the_run_subroutines",
        additionalCreditsPerSubroutine: 2,
        minSubroutines: 0,
        minSubroutinesFinalCredits: 4,
        firstEndTheRunSubroutineCount: 1,
        firstEndTheRunFinalCredits: 6,
      },
    });
    expect(action.payload).toMatchObject({
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteCostKind: "variable",
      postInstallRezQuoteVariableRezKind: "paid_end_the_run_subroutines",
      postInstallRezQuoteVariableAdditionalCreditsPerSubroutine: 2,
      postInstallRezQuoteVariableMinSubroutines: 0,
      postInstallRezQuoteVariableMinSubroutinesFinalCredits: 4,
      postInstallRezQuoteVariableFirstEndTheRunSubroutineCount: 1,
      postInstallRezQuoteVariableFirstEndTheRunFinalCredits: 6,
    });
    expect(
      Number(
        action.payload?.postInstallRezQuoteVariableFirstEndTheRunFinalCredits,
      ) - state.corp.credits,
    ).toBe(1);
  });

  it("certifies both exact alternate-subtype payment branches", () => {
    const { state, cardId } = stateWithHandIce(CREDIT_BLOCKS);
    const action = buildCorpNewRemoteIceInstallAction(state, cardId);

    expect(
      projectCorpIceRezCostAfterInstall(state, cardId, "new_remote"),
    ).toMatchObject({
      complete: true,
      costKind: "variable",
      baseCredits: 6,
      finalCredits: 6,
      variableParameter: {
        kind: "alternate_subtype",
        baseSubtypes: ["sentry"],
        baseSubtypesFinalCredits: 6,
        alternateSubtypes: ["wall"],
        alternateSubtypesAdditionalCredits: 1,
        alternateSubtypesFinalCredits: 7,
      },
    });
    expect(action.payload).toMatchObject({
      postInstallRezQuoteComplete: true,
      postInstallRezQuoteCostKind: "variable",
      postInstallRezQuoteVariableRezKind: "alternate_subtype",
      postInstallRezQuoteVariableBaseSubtypes: "sentry",
      postInstallRezQuoteVariableBaseSubtypesFinalCredits: 6,
      postInstallRezQuoteVariableAlternateSubtypes: "wall",
      postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits: 1,
      postInstallRezQuoteVariableAlternateSubtypesFinalCredits: 7,
    });
  });

  it("fails closed instead of reconstructing an invalid variable-rez contract", () => {
    const implementation = cardImplementationForDefinitionId(DIGICONDA);
    if (implementation?.variableRez?.kind !== "x_strength")
      throw new Error("Digiconda variable-rez implementation missing.");
    const original = implementation.variableRez;
    const mutableImplementation = implementation as unknown as {
      variableRez: typeof original;
    };
    mutableImplementation.variableRez = {
      ...original,
      additionalCostPerValue: 0,
    } as unknown as typeof original;
    try {
      const { state, cardId } = stateWithHandIce(DIGICONDA);
      const action = buildCorpNewRemoteIceInstallAction(state, cardId);
      expect(action.payload).toMatchObject({
        postInstallRezQuoteCardId: cardId,
        postInstallRezQuoteTargetServerId: "new_remote",
        postInstallRezQuoteExpiresAtStateVersion: 17,
        postInstallRezQuoteComplete: false,
      });
      expect(action.payload).not.toHaveProperty(
        "postInstallRezQuoteFinalCredits",
      );
      expect(action.payload).not.toHaveProperty(
        "postInstallRezQuoteVariableRezKind",
      );
    } finally {
      mutableImplementation.variableRez = original;
    }
  });

  it("rejects arithmetically inconsistent complete payload projections", () => {
    const cases = [
      {
        definitionId: HOMING_MISSILE,
        corrupt: (parameter: Record<string, unknown>) => {
          parameter.maxValueFinalCredits =
            Number(parameter.maxValueFinalCredits) + 1;
        },
      },
      {
        definitionId: SANDSTORM,
        corrupt: (parameter: Record<string, unknown>) => {
          parameter.firstEndTheRunFinalCredits =
            Number(parameter.firstEndTheRunFinalCredits) + 1;
        },
      },
      {
        definitionId: CREDIT_BLOCKS,
        corrupt: (parameter: Record<string, unknown>) => {
          parameter.baseSubtypesFinalCredits =
            Number(parameter.baseSubtypesFinalCredits) + 1;
        },
      },
    ] as const;

    for (const { definitionId, corrupt } of cases) {
      const { state, cardId } = stateWithHandIce(definitionId);
      const projection = structuredClone(
        projectCorpIceRezCostAfterInstall(state, cardId, "new_remote"),
      ) as unknown as Record<string, unknown>;
      expect(projection.costKind).toBe("variable");
      corrupt(projection.variableParameter as Record<string, unknown>);

      const payload = corpIcePostInstallRezProjectionPayload(
        projection as unknown as VisibleCorpRezCostQuote,
      );
      expect(payload.postInstallRezQuoteComplete).toBe(false);
      expect(payload).not.toHaveProperty("postInstallRezQuoteFinalCredits");
      expect(payload).not.toHaveProperty("postInstallRezQuoteVariableRezKind");
    }

    const { state, cardId } = stateWithHandIce(WALL);
    const fixedProjection = structuredClone(
      projectCorpIceRezCostAfterInstall(state, cardId, "new_remote"),
    ) as unknown as Record<string, unknown>;
    delete fixedProjection.costKind;
    expect(
      corpIcePostInstallRezProjectionPayload(
        fixedProjection as unknown as VisibleCorpRezCostQuote,
      ).postInstallRezQuoteComplete,
    ).toBe(false);
  });

  it("adds complete current quotes only to own Corp unrezzed ICE", () => {
    const { state, cardId } = stateWithHandIce();
    state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
    state.corp.servers.find((server) => server.id === "hq")!.ice.push(cardId);
    state.cardInstances[cardId] = {
      ...state.cardInstances[cardId]!,
      zone: { side: "corp", zone: "serverIce", serverId: "hq" },
    };

    expect(projectInstalledCorpIceRezCost(state, cardId)).toMatchObject({
      context: "installed",
      cardId,
      targetServerId: "hq",
      projectedServerId: "hq",
      expiresAtStateVersion: 17,
      complete: true,
      costKind: "fixed",
      finalCredits: 3,
    });
    expect(
      buildPlayerViewProjection(state, "corp", [])
        .servers.find((server) => server.id === "hq")
        ?.ice.find((card) => card.instanceId === cardId)?.effectiveRezCostQuote,
    ).toMatchObject({ cardId, complete: true, finalCredits: 3 });
    expect(
      JSON.stringify(buildPlayerViewProjection(state, "runner", [])),
    ).not.toContain("effectiveRezCostQuote");
  });

  it("shares one fail-closed canonical next-remote rule with createRemote", () => {
    const { state, cardId } = stateWithHandIce();
    state.corp.servers.push({
      id: "remote_01" as "remote_1",
      kind: "remote",
      label: "Invalid Remote",
      ice: [],
      root: [],
    });

    const projection = projectCorpIceRezCostAfterInstall(
      state,
      cardId,
      "new_remote",
    );
    expect(projection).toEqual({
      context: "post_install",
      cardId,
      targetServerId: "new_remote",
      expiresAtStateVersion: 17,
      complete: false,
    });
    expect(JSON.stringify(projection)).not.toContain("NaN");
    expect(validateGameState(state).errors).toContain(
      "Corp server IDs must be canonical and unique.",
    );
    expect(() => createRemote(state)).toThrow(/nichtkanonischem Serverzustand/);

    state.corp.servers.pop();
    state.corp.servers.push({ ...state.corp.servers[0]! });
    expect(validateGameState(state).errors).toContain(
      "Corp server IDs must be canonical and unique.",
    );
  });

  it("projects repeatedly without cloning the full GameState", () => {
    const { state, cardId } = stateWithHandIce();
    const originalStructuredClone = globalThis.structuredClone;
    globalThis.structuredClone = (() => {
      throw new Error("full GameState clone is forbidden");
    }) as typeof structuredClone;
    try {
      for (let index = 0; index < 250; index += 1) {
        expect(
          projectCorpIceRezCostAfterInstall(state, cardId, "hq").complete,
        ).toBe(true);
      }
    } finally {
      globalThis.structuredClone = originalStructuredClone;
    }
  });
});
